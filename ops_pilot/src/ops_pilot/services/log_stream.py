import asyncio
from collections.abc import Iterable


class LogStreamHub:
    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[dict]] = set()

    def subscribe(self) -> asyncio.Queue[dict]:
        subscriber: asyncio.Queue[dict] = asyncio.Queue(maxsize=1000)
        self._subscribers.add(subscriber)
        return subscriber

    def unsubscribe(self, subscriber: asyncio.Queue[dict]) -> None:
        self._subscribers.discard(subscriber)

    def publish(self, events: Iterable[dict]) -> None:
        for event in events:
            for subscriber in tuple(self._subscribers):
                if subscriber.full():
                    try:
                        subscriber.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                try:
                    subscriber.put_nowait(event)
                except asyncio.QueueFull:
                    continue


log_stream_hub = LogStreamHub()