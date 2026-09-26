import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Mapping, MutableMapping, cast

_RESERVED_LOG_RECORD_KEYS = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "message",
    "module",
    "msecs",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "task",
    "taskName",
    "thread",
    "threadName",
}


def _derive_event(message: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", message.lower()).strip("_")
    if not normalized:
        return "log_event"

    words = normalized.split("_")
    if "creating" in words:
        words = ["created" if word == "creating" else word for word in words]
    if "updating" in words:
        words = ["updated" if word == "updating" else word for word in words]
    if "deleting" in words:
        words = ["deleted" if word == "deleting" else word for word in words]
    if "fetching" in words:
        words = ["fetched" if word == "fetching" else word for word in words]

    return "_".join(word for word in words if word)


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        message = record.getMessage()
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": message,
            "event": record.__dict__.get("event") or _derive_event(message),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        for key, value in record.__dict__.items():
            if key in _RESERVED_LOG_RECORD_KEYS or key.startswith("_") or key == "event":
                continue
            payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        if record.stack_info:
            payload["stack_info"] = self.formatStack(record.stack_info)

        return json.dumps(payload, default=str, ensure_ascii=False)


class ContextLoggerAdapter(logging.LoggerAdapter):
    """Logger adapter that supports context binding and context-aware messages."""

    @staticmethod
    def _sanitize_context(context: Mapping[str, Any]) -> dict[str, Any]:
        sanitized: dict[str, Any] = {}
        for key, value in context.items():
            safe_key = key if key not in _RESERVED_LOG_RECORD_KEYS else f"context_{key}"
            sanitized[safe_key] = value
        return sanitized

    def bind(self, **context: Any) -> "ContextLoggerAdapter":
        base_context = cast(dict[str, Any], self.extra)
        merged_context = {**base_context, **context}
        return ContextLoggerAdapter(self.logger, merged_context)

    def process(
            self,
            msg: str,
            kwargs: MutableMapping[str, Any],
    ) -> tuple[str, MutableMapping[str, Any]]:
        call_extra_raw = kwargs.get("extra")
        call_extra: Mapping[str, Any] = (
            call_extra_raw if isinstance(call_extra_raw, Mapping) else {}
        )
        base_context = cast(dict[str, Any], self.extra)
        merged_context = {**base_context, **call_extra}
        safe_context = self._sanitize_context(merged_context)

        kwargs["extra"] = safe_context
        return msg, kwargs


_LOGGER_LOCK = Lock()
_LOGGER_CACHE: dict[str, logging.Logger] = {}
_ADAPTER_CACHE: dict[str, ContextLoggerAdapter] = {}


def _build_logger(logger_name: str) -> logging.Logger:
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        log_dir = Path(__file__).resolve().parents[2] / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "app.log"

        stream_handler = logging.StreamHandler()
        file_handler = logging.FileHandler(log_path)
        formatter = JSONFormatter()
        for handler in (stream_handler, file_handler):
            handler.setFormatter(formatter)
            logger.addHandler(handler)

    logger.propagate = False
    return logger


def get_logger(
        logger_name: str = "shopflow",
        **context: Any,
) -> ContextLoggerAdapter:
    """Return a singleton contextual logger adapter by logger name.

    If context is provided, a bound adapter is returned with merged context.
    """

    with _LOGGER_LOCK:
        if logger_name not in _LOGGER_CACHE:
            _LOGGER_CACHE[logger_name] = _build_logger(logger_name)

        if logger_name not in _ADAPTER_CACHE:
            _ADAPTER_CACHE[logger_name] = ContextLoggerAdapter(
                _LOGGER_CACHE[logger_name], {}
            )

        base_adapter = _ADAPTER_CACHE[logger_name]

    if context:
        return base_adapter.bind(**context)

    return base_adapter
