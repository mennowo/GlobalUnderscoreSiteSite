# Global Underscore Vienna · site

A single-page site for the Global Underscore gathering on **20 June 2026** in Vienna.
Built with React + Vite + Tailwind on the front, a small Express server on the back
for editable content, signup collection, and admin auth.

## What it does

- **Public page** — hero, about the Underscore + Contact Improv, photo strip, event details, signup form.
- **Signups** — stored in SQLite. Admins get a CSV download button.
- **In-browser editing** — logged-in admins see a toolbar with an **✎ edit page** button. Headings, paragraphs, dates, address, price etc. become editable in place. **Save** writes to `data/content.json`.
- **Auth** — two options that can run side-by-side:
  - **Local auth** (username + password, stored in SQLite with scrypt-hashed passwords). First admin is bootstrapped from env vars; further admins are added via the UI.
  - **OIDC** via `express-openid-connect` — Auth0, Google, Keycloak, Authentik, Zitadel, or any standards-compliant provider.

## Stack

| layer      | choice                                          |
| ---------- | ----------------------------------------------- |
| UI         | React 18 + Vite 6 + TypeScript + Tailwind 3     |
| Server     | Node 22 + Express 4 + `express-openid-connect`  |
| Storage    | SQLite at `data/gu.sqlite` + `data/content.json` + `data/uploads/` |
| Deploy     | Dockerfile + docker-compose (Coolify-ready)     |

Data is intentionally file-based — for a small event site, a Postgres would be overkill. Back up the `/data` volume and you've backed up the site.

## Development

```bash
npm install
cp .env.example .env      # fill in SESSION_SECRET + BOOTSTRAP_ADMIN_* (and/or OIDC values)
npm run dev               # client on :5173 (proxies /api, /auth, /me to :3010)
```

Without `SESSION_SECRET` and without OIDC env vars, the app still runs — admin features are disabled and a small banner is shown.

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

| var                        | required      | notes                                                                |
| -------------------------- | ------------- | -------------------------------------------------------------------- |
| `PORT`                     | no            | defaults to 3010                                                     |
| `BASE_URL`                 | for OIDC      | public URL of the site (e.g. `https://gu.example.org`)               |
| `SESSION_SECRET`           | for any auth  | long random string (`openssl rand -hex 32`) — shared by local + OIDC |
| `BOOTSTRAP_ADMIN_EMAIL`    | for local     | email of the first admin                                             |
| `BOOTSTRAP_ADMIN_PASSWORD` | for local     | initial password of the first admin (min 8 chars)                    |
| `LOCAL_AUTH_DISABLED`      | no            | set to `1` to disable local auth even when `SESSION_SECRET` is set   |
| `OIDC_ISSUER`              | for OIDC      | e.g. `https://your-tenant.auth0.com`                                 |
| `OIDC_CLIENT_ID`           | for OIDC      |                                                                      |
| `OIDC_CLIENT_SECRET`       | for OIDC      |                                                                      |
| `ADMIN_EMAILS`             | for OIDC      | comma-separated, matches OIDC `email` claim (OIDC users only)        |

**Local auth** activates whenever `SESSION_SECRET` is set (and `LOCAL_AUTH_DISABLED` is not `1`).
**OIDC** activates when all four `OIDC_*`/`SESSION_SECRET` vars are set. Both can be enabled at the same time; the login screen will offer both.

In your OIDC app, set the redirect URI to `${BASE_URL}/auth/callback`.

## First-admin bootstrap

On startup, if `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD` are both set, the server ensures that user exists in the local `users` table:

- **First boot:** user is created with the env password and marked admin.
- **Env password changes between boots:** the password is reset to the new env value on the next boot. This is how you reset the first admin when you forget the password — just change the env var and restart.
- **Password changed via the UI:** the stored hash differs but the tracked env fingerprint still matches, so the UI-set password survives restarts. (Only a change to the env var itself triggers a reset.)
- **Env vars removed:** the user is left alone with whatever password they last set.

Additional admins are added via the **⚙ account** panel once you're logged in — no CLI needed.

## Auth model summary

- **Local admins** live in the SQLite `users` table. Their admin flag is stored in the row (`is_admin`).
- **OIDC admins** are recognized by matching the OIDC `email` claim against the `ADMIN_EMAILS` env list. They do not have a row in the `users` table and cannot change a password from the UI (managed by their identity provider).
- When both auth methods are enabled, the server prefers a local session over an OIDC session if both are present.
- Sessions use `httpOnly`, `SameSite=Lax` cookies, `Secure` in production. CSRF is handled via a required `X-Requested-With: fetch` header on all mutating requests, which same-origin browser forms and cross-origin sites cannot forge.

## Deploy on Coolify

1. In Coolify, create a new **Docker Compose** (or **Dockerfile**) resource pointing at this repo.
2. Add the environment variables from the table above in the Coolify UI. At minimum set `SESSION_SECRET` + `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD` for local auth, or the full OIDC set.
3. Add a **persistent volume** mounted at `/app/data` — this is where `content.json`, `gu.sqlite`, and uploads live.
4. Expose port `3010` (or any port — `PORT` env var controls what the server binds to) and let Coolify's proxy terminate TLS.
5. Set `BASE_URL` to the public HTTPS URL Coolify assigned (only required if using OIDC).
6. If using OIDC: add `${BASE_URL}/auth/callback` as a valid redirect URI in your OIDC provider.

`docker-compose.yml` in the repo is a starter — Coolify can consume it directly, or you can use the Dockerfile and let Coolify generate its own compose.

### Local Docker test

```bash
cp .env.example .env
docker compose up --build
# open http://localhost:3010
```

## Editing the page

1. Click **admin log in** (top right) and sign in with the local admin (or SSO if configured).
2. You'll see **✎ edit page** in the toolbar.
3. Click it — editable blocks get a coral outline. Click any text to edit. Press **Enter** to leave a single-line field, **Esc** or click elsewhere to commit.
4. Click **save**. Content is persisted to `data/content.json` and served to everyone.

## Collecting signups

- Submissions are stored in SQLite and shown in the **☰ signups** admin panel.
- Admins see a **↓ CSV** button that downloads all submissions.

## Replacing placeholder images

Gallery tiles use `picsum.photos` with stable seeds. Drop real photos into `public/`
and update `src/components/Gallery.tsx` — or swap image URLs there for any CDN.
The venue photo is `public/samdrubling.jpg`.

## Notes on the tone

The design is warm cream + coral + sage, with rounded cards slightly off-axis. That's
deliberate: focused enough for a real dance event, playful enough to remember we're
rolling around on the floor together for four hours.
