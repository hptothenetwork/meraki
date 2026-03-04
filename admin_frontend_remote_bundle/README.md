# Admin Frontend (Remote Backend)

This bundle is frontend-only:
- Admin UI routes: `/admin`, `/admin/subscribers`
- No local `/api` routes
- No backend code

It proxies all `/api/*` calls to your backend service using Next rewrites.

## Architecture

1. Deploy `admin_backend_bundle` as backend service (API + DB access)
2. Deploy this folder as admin frontend app
3. Set `ADMIN_API_ORIGIN` in this frontend app to backend URL

## Setup

```bash
npm install
```

Copy env:

```bash
cp .env.example .env.local
```

Set:
- `ADMIN_API_ORIGIN=https://your-backend-domain`

Run:

```bash
npm run dev
```

Open: `http://localhost:3001/admin`

## Notes

- Keep backend and frontend on HTTPS in production.
- Because requests are proxied through this app (`/api/*`), browser CORS issues are avoided.
