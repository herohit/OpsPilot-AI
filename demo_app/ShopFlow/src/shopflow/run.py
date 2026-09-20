import uvicorn

# PS E:\2026\OpsPilot AI\demo_app\ShopFlow> uv run uvicorn shopflow.main:app --reload   
if __name__ == "__main__":
    uvicorn.run("shopflow.main:app",reload=True)    