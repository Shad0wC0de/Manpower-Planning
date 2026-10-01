# WFM Planner V2 — Self-Contained Validation Build

Static, client-side workforce planning application for GitHub Pages or local hosting.

## Privacy / network design
- No external CDNs, fonts, APIs, analytics, or third-party runtime dependencies.
- No fetch/XHR/WebSocket/beacon calls.
- No localStorage, sessionStorage, IndexedDB, cookies, or service-worker persistence.
- Planning, scenario, interval CSV, and validation data are held only in page memory.
- Refreshing or closing the page clears entered/imported data.
- CSV files are read locally with the browser File API and are not uploaded by the application.
- Excel-compatible export is generated locally with browser-native Blob APIs.

## Validation
Paste internal Planning File FTE values into the Validation tab. The app compares them to WFM Planner FTE and calculates:
- Mean Error
- MAE (Mean Absolute Error)
- MAPE (Mean Absolute Percentage Error)
- Minimum Error
- Maximum Error

No validation values are saved by the application.

## Deploy
Upload the folder contents to a static host such as GitHub Pages. `index.html` must remain at the project root.


## Packaging hardening
The runtime is intentionally bundled into a single local JavaScript file (`js/app.js`) so startup does not depend on ES-module imports or additional JavaScript libraries. All application assets are local to this package.
