import uvicorn
from shopflow import log as logger_module

logger = logger_module.get_logger(logger_name="shopflow.run")

# uv run uvicorn shopflow.main:app --reload --port 8080 --timeout-graceful-shutdown 5
if __name__ == "__main__":
    logger.info("Starting uvicorn server", extra={"app": "shopflow.main:app", "reload": True})
    uvicorn.run(
        "shopflow.main:app",
        reload=True,
        port=8080,
        timeout_graceful_shutdown=5,
    )