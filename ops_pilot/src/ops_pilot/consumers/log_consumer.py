import asyncio
import json
import logging
from uuid import UUID

import httpx
from sqlalchemy import select

from ops_pilot.database import SessionLocal
from ops_pilot.models.log_model import Log, LogSource


logger = logging.getLogger(__name__)


class LogConsumeManager:
    def __init__(self):
        self.tasks: dict[str, asyncio.Task] = {}
        self.source_configs: dict[str, tuple[str, str]] = {}
        self.sync_task: asyncio.Task | None = None
        self.client: httpx.AsyncClient | None = None

    async def start(self) -> None:
        self.client = httpx.AsyncClient(timeout=None)
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
                    self.source_configs[source_id] = (environment_id, stream_url)
                    self.tasks[source_id] = asyncio.create_task(
                        self._consume_stream(UUID(source_id), UUID(environment_id), stream_url)
                    )

            await asyncio.sleep(5)

    async def _consume_stream(
        self,
        source_id: UUID,
        environment_id: UUID,
        stream_url: str,
    ) -> None:
        if self.client is None:
            raise RuntimeError("HTTP client is not initialized")
        while True:
            try:
                async with self.client.stream("GET", stream_url) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            payload = json.loads(line)
                        except json.JSONDecodeError:
                            logger.warning("Skipping invalid JSON from log source %s", source_id)
                            continue
                        if not isinstance(payload, dict):
                            logger.warning("Skipping non-object log from source %s", source_id)
                            continue

                        with SessionLocal() as db:
                            db.add(Log(environment_id=environment_id, payload=payload))
                            db.commit()
            except asyncio.CancelledError:
                raise
            except (httpx.HTTPError, OSError) as error:
                logger.warning("Log source %s disconnected: %s", source_id, error)
                await asyncio.sleep(2)