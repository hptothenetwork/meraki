# Environment Variables To Finalize Later

This file tracks env vars that are used in code but are not yet documented in their local `.env.example`.

## Storefront (`mrk/.env.example`)

- None pending after adding `ORDER_API_ADMIN_SECRET`.
- `NODE_ENV` is used by Next.js runtime and is normally provided automatically.

## Admin Backend (`mrk/admin_backend_bundle/.env.example`)

- `ADMIN_UPLOAD_MAX_MB`
  - Used to control max upload size in `src/app/api/admin/upload/route.ts`.
  - Current code default is `50` if unset.

## Admin Frontend (`mrk/admin_frontend_remote_bundle/.env.example`)

- No missing `process.env.*` variables detected in `src/`.
