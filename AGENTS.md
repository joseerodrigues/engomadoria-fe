<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project context

- This project is the frontend for an app that lets customers manage their ironing packages.
- Packages can be configured by garment capacity, for example, 30 pieces per month.
- Customers can switch among active package plans; a plan change takes effect immediately and must preserve prior package and delivery history.
- Package plans can have a finite duration measured from each package activation date; expired packages stop being available for delivery registration.
- Every database insert, update, or delete on app-owned customer, delivery, package, garment, and auth-user data must be captured in restricted audit logs.
- Garments can consume different numbers of package slots; the slot value is configurable per garment type.
- Customers can view their package usage for the current period and register new usage by choosing garment types and quantities in each ironing drop-off.
- Delivery writes must enforce the package's monthly credit limit; reject any write that would exceed it and offer plan switching as the path to more capacity.
- Customers can review historical usage statistics by garment category over a selected time period.
- Customers can edit or delete their recorded deliveries.
- The customer experience must work well in desktop web browsers and on mobile devices. Mobile uses distinct tab-navigated screens, readable text sizes, and full-screen flows instead of popup dialogs.
- Database migrations must account for existing data and be safe to re-run against an initialized schema: use idempotent DDL, explicit backfills or deterministic upserts when replacing catalog/configuration rows, preserve customer history by default, and never assume production tables are empty.
- These requirements are an initial project description and are expected to evolve. Update this section as requirements change, and follow the latest user-provided requirements.
