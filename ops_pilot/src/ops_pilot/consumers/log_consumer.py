import asyncio
import json
import logging
from datetime import datetime, timezone
from time import monotonic
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from ops_pilot.database import SessionLocal
from ops_pilot.models.log_model import Log, LogSource
from ops_pilot.services.log_stream import log_stream_hub


logger = logging.getLogger(__name__)


class LogConsumeManager:
    def __init__(self):
        self.tasks: dict[str, asyncio.Task] = {}
        self.source_configs: dict[str, tuple[str, str]] = {}
        self.sync_task: asyncio.Task | None = None
        self.client: httpx.AsyncClient | None = None

    async def start(self) -> None:
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(None, connect=10, write=10, pool=10)
        )
        self.sync_task = asyncio.create_task(self._sync_sources())

    async def stop(self) -> None:
        if self.sync_task is not None:
            self.sync_task.cancel()
            await asyncio.gather(self.sync_task, return_exceptions=True)
            self.sync_task = None

        for task in self.tasks.values():
            task.cancel()
        await asyncio.gather(*self.tasks.values(), return_exceptions=True)
        self.tasks.clear()
        self.source_configs.clear()

        if self.client is not None:
            await self.client.aclose()
            self.client = None

    async def _sync_sources(self) -> None:
        while True:
            with SessionLocal() as db:
                sources = db.scalars(
                    select(LogSource).where(LogSource.is_active.is_(True))
                ).all()
                current_configs = {
                    str(source.id): (str(source.environment_id), source.stream_url)
                    for source in sources
                }

            for source_id, task in list(self.tasks.items()):
                if self.source_configs.get(source_id) != current_configs.get(source_id):
                    task.cancel()
                    await asyncio.gather(task, return_exceptions=True)
                    self.tasks.pop(source_id, None)
                    self.source_configs.pop(source_id, None)

            for source_id, (environment_id, stream_url) in current_configs.items():
                if source_id not in self.tasks:
                    self.source_configs[source_id] = (
                        environment_id, stream_url)
                    self.tasks[source_id] = asyncio.create_task(
                        self._consume_stream(UUID(source_id), UUID(
                            environment_id), stream_url)
                    )

            await asyncio.sleep(5)

    async def _consume_stream(
        self,
        source_id: UUID,
        environment_id: UUID,
        stream_url: str,
    ) -> None:
        queue: list[dict] = []
        client = self.client
        if client is None:
            raise RuntimeError("HTTP client is not initialized")
        retry_delay = 2
        try:
            while True:
                attempt_started = monotonic()
                try:
                    try:
                        await self._read_stream(
                            client, source_id, environment_id, stream_url, queue
                        )
                    finally:
                        if monotonic() - attempt_started >= 60:
                            retry_delay = 2
                except (httpx.HTTPError, OSError) as error:
                    try:
                        self._flush_batch(queue, environment_id)
                    except SQLAlchemyError:
                        logger.exception(
                            "Could not flush logs for source %s", source_id)
                    logger.warning(
                        "Log source %s disconnected: %s; retrying in %ss",
                        source_id, error, retry_delay,
                    )
                except SQLAlchemyError:
                    logger.exception(
                        "Could not save logs for source %s; retrying in %ss",
                        source_id, retry_delay,
                    )
                else:
                    logger.warning(
                        "Log source %s ended; retrying in %ss",
                        source_id, retry_delay,
                    )
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 60)
        except asyncio.CancelledError:
            try:
                self._flush_batch(queue, environment_id)
            except SQLAlchemyError:
                logger.exception(
                    "Could not flush logs while stopping source %s", source_id)
            raise

    async def _read_stream(
        self,
        client: httpx.AsyncClient,
        source_id: UUID,
        environment_id: UUID,
        stream_url: str,
        queue: list[dict],
    ) -> None:
        async with client.stream("GET", stream_url) as response:
            response.raise_for_status()
            logger.info("Log source %s connected", source_id)
            flush_task = asyncio.create_task(
                self._flush_periodically(queue, environment_id)
            )
            try:
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        payload = json.loads(line)
                    except json.JSONDecodeError:
                        logger.warning(
                            "Skipping invalid JSON from log source %s", source_id
                        )
                        continue
                    if not isinstance(payload, dict):
                        logger.warning(
                            "Skipping non-object log from source %s", source_id
                        )
                        continue
                    queue.append(payload)
                    if len(queue) >= 20:
                        self._flush_batch(queue, environment_id)
            finally:
                flush_task.cancel()
                await asyncio.gather(flush_task, return_exceptions=True)
            self._flush_batch(queue, environment_id)

    @staticmethod
    async def _flush_periodically(
        queue: list[dict], environment_id: UUID
    ) -> None:
        while True:
            await asyncio.sleep(1)
            try:
                LogConsumeManager._flush_batch(queue, environment_id)
            except SQLAlchemyError:
                logger.exception(
                    "Could not flush pending logs for environment %s", environment_id)

    @staticmethod
    def _flush_batch(queue: list[dict], environment_id: UUID) -> None:
        if not queue:
            return

        received_at = datetime.now(timezone.utc)
        rows = [
            Log(
                environment_id=environment_id,
                payload=payload,
                received_at=received_at,
            )
            for payload in queue
        ]
        with SessionLocal() as db:
            db.add_all(rows)
            db.flush()
            events = [
                {
                    "id": str(log.id),
                    "environment_id": str(log.environment_id),
                    "payload": log.payload,
                    "received_at": log.received_at.isoformat(),
                }
                for log in rows
            ]
            db.commit()
        queue.clear()
        log_stream_hub.publish(events)
