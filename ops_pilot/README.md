# Log history

`GET /logs/history` returns authenticated, owner-scoped database logs, newest
first (received time, then ID). Unlike the live snapshot, history has no time
window or 5,000-record cutoff.

Optional query parameters:

- `service_id`, `environment_id`: UUID filters.
- `page`: 1-based page number (default `1`).
- `page_size`: entries per page, `1` through `100` (default `50`).

The response contains `items`, `total`, `page`, `page_size`, and `total_pages`.
Empty results have zero total pages; pages beyond the last page return empty
items while retaining the total. Existing `/logs` and `/logs/stream` responses
are unchanged. Pagination uses offsets; new or deleted records can shift page
boundaries between requests.

## Log source connection failures

`Log source <id> disconnected: All connection attempts failed` means OpsPilot
cannot connect to the configured source endpoint. Check that the source
application is running and its host and port are reachable from OpsPilot.
For the ShopFlow demo, start it from `demo_app\ShopFlow`:

```powershell
uv run python -m shopflow.run
```

Its stream URL is `http://127.0.0.1:8080/logs/stream`. If OpsPilot runs on
another machine or in a container, use an address reachable from that runtime
instead of its own loopback address. Update or deactivate unused log sources
through the log-source API.

The consumer reconnects automatically with delays of 2, 4, 8, 16, 32, then
60 seconds, capped at 60 seconds until recovery. A stream lasting at least
60 seconds resets the delay to 2 seconds. Clean stream endings also back off.
Warnings include the next retry delay, and successful connections are logged
at INFO level. Connection establishment times out after 10 seconds; reads
remain unbounded so quiet streams stay connected.

## API rate limits

Login, registration, profile updates, and create/update/delete operations for
projects, services, environments, deployments, and log sources are limited to
five requests per minute per client IP and endpoint. Each operation has its
own allowance; this is not a shared five-request budget for the whole API.
The sixth request within the window returns HTTP 429 with a `Retry-After`
header and `error.retry_after_seconds` in the response body.

All GET endpoints (including current-user lookup, lists, details, log history,
and live log streaming), token refresh, and logout are deliberately not subject
to this limit so navigation, polling, reconnects, and session handling are not
blocked by a five-per-minute budget.

Limits currently use process-local memory: restarting resets them, and multiple
workers do not share counters. Clients sharing an IP share each endpoint's
allowance. For multi-worker production deployments, use a shared limiter store
and configure trusted proxy handling so client IPs are identified correctly.