import asyncio
import unittest
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import httpx

from ops_pilot.consumers.log_consumer import LogConsumeManager


class LogConsumerRetryTests(unittest.IsolatedAsyncioTestCase):
    async def run_attempts(self, outcomes, times):
        manager = LogConsumeManager()
        manager.client = Mock(spec=httpx.AsyncClient)
        manager._read_stream = AsyncMock(side_effect=outcomes)
        manager._flush_batch = Mock()
        sleep = AsyncMock(side_effect=[None] * (len(outcomes) - 1) + [asyncio.CancelledError()])
        with (
            patch("ops_pilot.consumers.log_consumer.asyncio.sleep", sleep),
            patch("ops_pilot.consumers.log_consumer.monotonic", side_effect=times),
            self.assertLogs("ops_pilot.consumers.log_consumer", level="WARNING") as logs,
        ):
            with self.assertRaises(asyncio.CancelledError):
                await manager._consume_stream(
                    uuid4(), uuid4(), "http://127.0.0.1:8080/logs/stream"
                )
        return manager, [call.args[0] for call in sleep.await_args_list], logs.output

    async def test_connection_failures_back_off_and_cap_at_sixty_seconds(self):
        error = httpx.ConnectError("All connection attempts failed")
        manager, delays, logs = await self.run_attempts(
            [error] * 8, [0] * 16
        )
        self.assertEqual(delays, [2, 4, 8, 16, 32, 60, 60, 60])
        self.assertEqual(manager._read_stream.await_count, 8)
        self.assertIn("retrying in 60s", logs[-1])
        self.assertIn("All connection attempts failed", logs[0])

    async def test_stable_stream_resets_backoff(self):
        error = httpx.ReadError("Stream disconnected")
        _, delays, _ = await self.run_attempts(
            [error] * 4, [0, 0, 0, 0, 0, 61, 61, 61]
        )
        self.assertEqual(delays, [2, 4, 2, 4])

    async def test_clean_eof_also_backs_off(self):
        _, delays, logs = await self.run_attempts([None] * 3, [0] * 6)
        self.assertEqual(delays, [2, 4, 8])
        self.assertIn("ended", logs[0])

    async def test_cancellation_during_backoff_flushes_pending_logs(self):
        manager = LogConsumeManager()
        manager.client = Mock(spec=httpx.AsyncClient)
        environment_id = uuid4()
        payload = {"message": "pending"}

        async def read_stream(client, source_id, environment_id, stream_url, queue):
            queue.append(payload)
            raise httpx.ReadError("Stream disconnected")

        manager._read_stream = AsyncMock(side_effect=read_stream)
        manager._flush_batch = Mock()
        with (
            patch(
                "ops_pilot.consumers.log_consumer.asyncio.sleep",
                AsyncMock(side_effect=asyncio.CancelledError()),
            ),
            self.assertLogs("ops_pilot.consumers.log_consumer", level="WARNING"),
        ):
            with self.assertRaises(asyncio.CancelledError):
                await manager._consume_stream(uuid4(), environment_id, "http://localhost/stream")
        self.assertEqual(manager._flush_batch.call_count, 2)
        manager._flush_batch.assert_called_with([payload], environment_id)

    async def test_connect_timeout_preserves_unbounded_stream_reads(self):
        manager = LogConsumeManager()
        with patch.object(manager, "_sync_sources", AsyncMock()):
            await manager.start()
            client = manager.client
            try:
                self.assertIsNotNone(client)
                if client is None:
                    self.fail("Consumer did not initialize its HTTP client")
                self.assertEqual(client.timeout.connect, 10)
                self.assertIsNone(client.timeout.read)
            finally:
                await manager.stop()
            self.assertTrue(client.is_closed)

    async def test_successful_stream_still_reads_and_flushes_json_logs(self):
        manager = LogConsumeManager()
        manager._flush_batch = Mock()
        environment_id = uuid4()
        queue = []
        transport = httpx.MockTransport(
            lambda request: httpx.Response(200, content=b'{"message":"hello"}\n')
        )
        async with httpx.AsyncClient(transport=transport) as client:
            with self.assertLogs("ops_pilot.consumers.log_consumer", level="INFO") as logs:
                await manager._read_stream(
                    client, uuid4(), environment_id, "http://localhost/stream", queue
                )
        self.assertEqual(queue, [{"message": "hello"}])
        manager._flush_batch.assert_called_once_with(queue, environment_id)
        self.assertIn("connected", logs.output[0])


if __name__ == "__main__":
    unittest.main()
