# WFM Planner V2

Static, client-side WFM manpower planning prototype derived from the concepts in ErlangC-laude.

## Included in this first build
- Sunday-Saturday HOOP with open/close times
- 15/30/60 minute interval selector; 30 minutes default
- 12/18/24 month planning horizon
- Months as columns and planning metrics as rows
- Erlang C staffing engine with SL, ASA, occupancy cap, and shrinkage
- Representative interval CSV import and interval calculation table
- A/B scenario comparison
- Excel (.xlsx) export of values using SheetJS in the browser
- GitHub Pages-compatible static structure

## Important current limitation
Monthly calculations currently assume volume is uniformly distributed across all open HOOP intervals. Imported interval data is calculated and displayed, but is not yet transformed into a normalized day-of-week/intraday profile and applied to every forecast month. That is the next modeling phase.

## Run locally
Because JavaScript modules are used, serve the folder rather than opening index.html directly:

    python3 -m http.server 8000

Then open http://localhost:8000

## Deploy to GitHub Pages
Upload the folder contents to a repository/branch and configure GitHub Pages to publish from the repository root.
