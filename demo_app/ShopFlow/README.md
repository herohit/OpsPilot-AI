# ShopFlow

## Development

Run from this directory:

```powershell
uv run python -m shopflow.run
```

Or start Uvicorn directly with the same settings:

```powershell
uv run uvicorn shopflow.main:app --reload --port 8080 --timeout-graceful-shutdown 5
```

The log endpoint holds connections open to stream new log entries. Without a
graceful shutdown timeout, Uvicorn can wait indefinitely for these connections
when reloading or stopping. The development commands allow five seconds for
requests to finish, then cancel remaining requests so shutdown can proceed.
A cancellation message at that point is expected for an active stream.
OpsPilot's log consumer retries after the source disconnects.

For an already-stuck server, press Ctrl+C to force it to quit, then restart with
one of the commands above.