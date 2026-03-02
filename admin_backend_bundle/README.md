# Admin Backend Bundle

This folder is a standalone export of:
- Admin dashboard UI (`/admin`, `/admin/subscribers`)
- Admin APIs (`/api/admin/*`)
- Required backend modules (`/backend/*`)

It excludes the storefront frontend.

## 1. Install

```bash
npm install
```

## 2. Configure env

1. Copy `.env.example` to `.env.local`
2. Fill the required values:
- Firebase admin credentials
- `ADMIN_SECRET` and `ADMIN_SECRET_SALT`
- `ADMIN_PASSWORD` (or Cloudflare password store envs)
- `IMAGEKIT_PRIVATE_KEY` and `IMAGEKIT_URL_ENDPOINT` (recommended media upload provider)
- R2 credentials only if you want a fallback upload provider
- `STOREFRONT_REVALIDATE_URL` and `STOREFRONT_REVALIDATE_SECRET` (to refresh storefront after admin changes)

## 3. Run

```bash
npm run dev
```

Open: `http://localhost:4000/admin`

## 4. Deploy with your other frontend

- Deploy this folder as a separate app (recommended subdomain: `admin.yourdomain.com`)
- Keep your customer frontend in its own app
- Both can use the same Firestore/backend data

## Notes

- Admin login uses secure cookie session from `/api/admin/login`.
- `ALLOW_LEGACY_ADMIN_HEADER` should stay `false` in production.
- Newsletter worker route needs EmailJS env vars.
- `firestore.indexes.json` is included for required Firestore indexes.
