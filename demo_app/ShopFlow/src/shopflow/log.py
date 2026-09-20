import logging
from threading import Lock
from typing import Any, Mapping, MutableMapping, cast


class ContextLoggerAdapter(logging.LoggerAdapter):
	"""Logger adapter that supports context binding and context-aware messages."""

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

		if merged_context:
			msg = f"{msg} | context={merged_context}"

		kwargs["extra"] = merged_context
		return msg, kwargs


_LOGGER_LOCK = Lock()
_LOGGER_CACHE: dict[str, logging.Logger] = {}
_ADAPTER_CACHE: dict[str, ContextLoggerAdapter] = {}


def _build_logger(logger_name: str) -> logging.Logger:
	logger = logging.getLogger(logger_name)
	logger.setLevel(logging.INFO)

	if not logger.handlers:
		handler = logging.StreamHandler()
		formatter = logging.Formatter(
			"%(asctime)s | %(name)s | %(levelname)s | %(filename)s | %(funcName)s:%(lineno)d | %(message)s"
		)
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


