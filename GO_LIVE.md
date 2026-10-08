# Go-Live Runbook

This runbook covers production configuration and the security fixes applied to this application. Do not expose the service publicly until each required gate below is complete.

## Requirements

- Node.js 20 or newer and PostgreSQL 12 or newer.
- A production database with automated backups and restore testing.
- A TLS-terminating reverse proxy or hosting platform for the browser app and API.
- A production SMTP account with a dedicated application password or equivalent credential.

The Vite development server is not a production web server. Build the client and serve `client/dist` from a production static host; proxy `/api` to the server on port `5001`.

## Environment

Create `server/.env` from `.env.example` for local setup. Production secrets should be provided by the deployment platform's secret manager, not committed to source control.

Required production values:

| Variable | Requirement |
| --- | --- |
| `NODE_ENV` | Set to `production`. |
| `DATABASE_URL` | PostgreSQL connection string with least-privilege database credentials. |
| `JWT_SECRET` | Unique random secret, at least 32 characters; do not reuse the developer secret. |
| `CLIENT_URL` | Exact HTTPS origin, without a path or trailing slash. CORS allows this origin only. |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Valid SMTP host, dedicated account credentials, and sender identity. |
| `SMTP_PORT` | Usually `587` for STARTTLS or `465` for implicit TLS. |
| `SMTP_SECURE` | `false` for port 587, `true` for port 465. |
| `PORT` | API port; defaults to `5001`. |
| `BIRTHDAY_CHECK_TIME` | Local server time in 24-hour `HH:MM` format. Defaults to `08:00`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Set for initial seed or explicit password rotation. Password must be at least 12 characters. |

If enabling the developer portal, configure all three values: `DEVELOPER_EMAIL`, `DEVELOPER_PASSWORD`, and a unique `DEVELOPER_JWT_SECRET` of at least 32 characters. The developer secret must differ from `JWT_SECRET`.

Generate each JWT secret independently on a trusted machine:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Do not paste real secrets into tickets, source files, or chat. Keep the server's operating-system timezone set to the institution's intended timezone; birthday matching and the scheduler use local time. Configure `TRUST_PROXY_HOPS` only when behind a known reverse proxy, with the exact number of trusted proxy hops.

## First Deployment

From the repository root, install locked dependencies and build both applications:

```powershell
npm ci --prefix server
npm ci --prefix client
npm --prefix server run build
npm --prefix client run build
```

Before starting the API, apply the checked-in database migrations and create the administrator account. Run these commands from `server/` so Prisma loads `server/.env`:

```powershell
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

The seed command creates a missing account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`; it does not overwrite an existing account. The old public `/api/auth/seed` endpoint has been removed. If an existing database still has the old `admin123` password, rotate it before exposing the app:

```powershell
npm run prisma:admin-password
```

The command updates only the account named by `ADMIN_EMAIL`; it requires a password of at least 12 characters and never prints the password.

Start the compiled API from `server/` with `npm start`, and serve the generated `client/dist` from the production web host. Terminate HTTPS at the trusted proxy, forward `/api` to the API, and do not expose the development server or database port publicly.

## Security Controls

- Admin authentication accepts only structurally valid `ADMIN` tokens. Developer tokens use a separate signing secret and cannot authenticate to the admin API.
- Developer access is optional. Its token can view developer diagnostics, but destructive database cleanup is administrator-only.
- Login endpoints are limited to 10 attempts per IP per 15 minutes per server process. The default limiter store is in-memory; multi-instance deployments need a shared rate-limit store and correctly configured proxy trust.
- API responses include Helmet security headers, JSON request bodies are limited to 100 KB, employee spreadsheets are limited to 5 MB and 5,000 rows, and CORS is restricted to `CLIENT_URL`.
- Spreadsheet uploads accept `.xlsx` only and use ExcelJS. Do not reintroduce the unmaintained `xlsx` package; its npm release has known vulnerabilities.
- Admin and developer JWTs expire after eight hours. The browser currently stores bearer tokens in `localStorage`; serve the client with a strict Content Security Policy and avoid loading untrusted scripts. An HttpOnly-cookie migration remains a worthwhile future hardening task.
- Run `npm audit` from both `server/` and `client/` before every release. The dependency trees were clean after these changes; recheck after updates.

## Birthday Email Behavior

- The scheduled and manual batch jobs process active employees whose birthday matches the server's local calendar date. A single-employee send is also restricted to an active employee whose birthday is today.
- Each employee/day send reserves a unique log row before contacting SMTP. Failed attempts can be retried; concurrent attempts are rejected. A `PROCESSING` attempt older than 15 minutes can be reclaimed.
- Email delivery cannot be made exactly-once across an SMTP provider and the database. If SMTP accepts a message and the API process crashes before recording `SENT`, reclaiming the stale attempt can send a duplicate. Monitor `PROCESSING` and `FAILED` rows and coordinate with the SMTP provider for stronger idempotency if available.
- Keep successful and in-progress email logs. The API refuses to delete those records because their unique keys prevent same-day duplicate sends.
- The in-process scheduler requires the API process to remain running. Do not run multiple scheduler instances unless the database lease behavior and operational monitoring are understood. A process restart recalculates the next local run; it does not replay a missed run automatically.

## Release Smoke Test

1. Confirm production startup refuses missing/weak JWT secrets and incomplete developer credentials.
2. Confirm `GET /api/health` responds through the HTTPS proxy and unrelated browser origins cannot read API responses.
3. Sign in with the rotated administrator credentials; verify a developer token receives `403` on an admin endpoint.
4. Upload a small valid `.xlsx` file, then verify malformed email, missing DOB, invalid dates, an invalid worksheet, and an oversized file are rejected without partial batch failure.
5. Send a test email to an approved test mailbox; confirm the sender, TLS mode, and delivery.
6. Run the birthday batch with a controlled test employee whose birthday is today. Trigger it a second time and verify no second email is sent. Verify an inactive or non-birthday employee cannot use the one-person send endpoint.
7. Verify a failed SMTP attempt can be retried and a concurrent attempt does not send a second message.
8. Confirm the scheduler's next-run time matches the institution's timezone and operating window.
9. Restore a recent database backup in a non-production environment and verify employee records, templates, and email history.

## Operations

- Alert on API process exits, database connectivity, SMTP delivery failures, stale `PROCESSING` rows, and missed scheduler runs.
- Restrict access to database backups and email history; employee names, dates of birth, and addresses are personal data.
- Use the cleanup controls cautiously. They permanently delete records; take a backup before administrative cleanup.
- Rotate JWT, database, and SMTP secrets through the deployment secret manager. Rotating either JWT signing secret invalidates existing tokens.
- Keep the API behind HTTPS and a firewall. The public health endpoint reports only basic API status; use authenticated developer diagnostics for deeper checks.