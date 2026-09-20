import uvicorn
from shopflow import log as logger_module

logger = logger_module.get_logger(logger_name="shopflow.run")

# PS E:\2026\OpsPilot AI\demo_app\ShopFlow> uv run uvicorn shopflow.main:app --reload   
if __name__ == "__main__":
    logger.info("Starting uvicorn server", extra={"app": "shopflow.main:app", "reload": True})
    uvicorn.run("shopflow.main:app",reload=True)    