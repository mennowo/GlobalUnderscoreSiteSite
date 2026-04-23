# Global Underscore Vienna · site

A single-page site for the Global Underscore gathering on **20 June 2026** in Vienna.
Built with React + Vite + Tailwind on the front, a small Express server on the back
for editable content, signup collection, and OIDC-protected admin.

## What it does

- **Public page** — hero, about the Underscore + Contact Improv, photo strip, event details, signup form.
- **Signups** — appended to `data/signups.jsonl`. Admins get a CSV download button.
- **In-browser editing** — logged-in admins see a toolbar with an **✎ edit page** button. Headings, paragraphs, dates, address, price etc. become editable in place. **Save** writes to `data/content.json`.
- **OIDC auth** — via `express-openid-connect`. Works with Auth0, Google, Keycloak, Authentik, Zitadel, or any standards-compliant OIDC provider.

## Stack

| layer      | choice                                          |
| ---------- | ----------------------------------------------- |
| UI         | React 18 + Vite 6 + TypeScript + Tailwind 3     |
| Server     | Node 22 + Express 4 + `express-openid-connect`  |
| Storage    | Two files in `/data`: `content.json`, `signups.jsonl` |
| Deploy     | Dockerfile + docker-compose (Coolify-ready)     |

Data is intentionally file-based — for a small event site, a Postgres would be overkill. Back up the `/data` volume and you've backed up the site.

## Development

```bash
npm install
cp .env.example .env      # fill in OIDC values
npm run dev               # client on :5173 (proxies /api, /auth, /me to :3010)
```

Without OIDC env vars set, the app still runs — admin features are disabled and a small banner is shown.

Run the server alone:

```bash
npm run dev:server
```

## Production build

```bash
npm run build     # bundles client to /dist
npm start         # Express serves /dist + APIs on :3010
```

## Environment variables

| var                    | required | notes                                                 |
| ---------------------- | -------- | ----------------------------------------------------- |
| `PORT`                 | no       | defaults to 3010                                      |
| `BASE_URL`             | yes*     | public URL of the site (e.g. `https://gu.example.org`) |
| `SESSION_SECRET`       | yes*     | long random string (`openssl rand -hex 32`)           |
| `OIDC_ISSUER`          | yes*     | e.g. `https://your-tenant.auth0.com`                  |
| `OIDC_CLIENT_ID`       | yes*     |                                                       |
| `OIDC_CLIENT_SECRET`   | yes*     |                                                       |
| `ADMIN_EMAILS`         | yes*     | comma-separated, matches OIDC `email` claim           |

*required only if you want auth / admin editing enabled.

In your OIDC app, set the redirect URI to `${BASE_URL}/auth/callback`.

## Deploy on Coolify

1. In Coolify, create a new **Docker Compose** (or **Dockerfile**) resource pointing at this repo.
2. Add the environment variables from the table above in the Coolify UI.
3. Add a **persistent volume** mounted at `/app/data` — this is where `content.json` and `signups.jsonl` live.
4. Expose port `3010` (or any port — `PORT` env var controls what the server binds to) and let Coolify's proxy terminate TLS.
5. Set `BASE_URL` to the public HTTPS URL Coolify assigned.
6. In your OIDC provider, add `${BASE_URL}/auth/callback` as a valid redirect URI.

`docker-compose.yml` in the repo is a starter — Coolify can consume it directly, or you can use the Dockerfile and let Coolify generate its own compose.

### Local Docker test

```bash
cp .env.example .env
docker compose up --build
# open http://localhost:3010
```

## Editing the page

1. Click **admin log in** (top right).
2. After OIDC completes, if your email is in `ADMIN_EMAILS` you'll see **✎ edit page**.
3. Click it — editable blocks get a coral outline. Click any text to edit. Press **Enter** to leave a single-line field, **Esc** or click elsewhere to commit.
4. Click **save**. Content is persisted to `data/content.json` and served to everyone.

## Collecting signups

- Every submission is appended as one JSON line to `data/signups.jsonl`.
- Admins see a **↓ signups.csv** button that downloads all submissions as CSV.
- Columns: `timestamp, name, email, did_underscore_before`.

## Replacing placeholder images

Gallery tiles use `picsum.photos` with stable seeds. Drop real photos into `public/`
and update `src/components/Gallery.tsx` — or swap image URLs there for any CDN.
The venue photo is `public/samdrubling.jpg`.

## Notes on the tone

The design is warm cream + coral + sage, with rounded cards slightly off-axis. That's
deliberate: focused enough for a real dance event, playful enough to remember we're
rolling around on the floor together for four hours.
