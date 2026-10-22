# React + Vite

## Log history

Open **Log history** in the sidebar or **Browse log history** on the live logs
page. The protected `/logs/history` page reads stored database logs with
server-side pagination and 25/50/100 entries per page. Search messages and
structured payload fields using **Search** (or Enter), and filter by service,
environment, severity, and inclusive date/time bounds. Date inputs use your
local time zone and are sent as UTC; filtering and sorting use received time,
not the source payload timestamp. Each time the page opens, the date fields
default to the preceding 24 hours, ending at the time the page opened.
Click either date box to open the date-range dialog. Select **Done** to apply
the dates and reset to page one. Editing dates does not update filter state,
send requests, or change displayed logs. Both dates are required; clearing a
picker cannot erase the applied range. **Reset to last 24 hours** restores the
default range in the dialog; **Done** confirms it. **Cancel** or Escape discards
edits. Invalid ranges cannot be applied. Refresh reloads the applied
range without moving its bounds. Choose newest or oldest first.
Filters, sorting, and page-size changes reset pagination.
Use **Refresh** to reload the current page and expand **Inspect log** for IDs,
received time, source context (logger/event/module/function/line when present),
and the complete original JSON payload.
The `/logs` page continues to provide live streaming.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
