import uvicorn

if __name__ == "__main__":
    uvicorn.run("ops_pilot.main:app", reload=True)