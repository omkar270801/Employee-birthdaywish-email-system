# Birthday Wish Email System

A full-stack application for managing employees and sending personalized birthday emails. The application uses React, Express, PostgreSQL, Prisma, SMTP, and an in-process daily scheduler.

For production on an Ubuntu/Linux VM, follow the [Linux Deployment Guide](GO_LIVE.md). Do not use the Vite development server in production.

## Requirements

- Node.js 22 LTS and npm
- PostgreSQL 12 or newer
- SMTP credentials for a sender account

## Local Development

Install dependencies from the repository root:

```bash
npm run install:all
```

Create a PostgreSQL database, then create `server/.env` from the root example:

```bash
createdb birthday_wish_db
cp .env.example server/.env
```

Set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`. The JWT secret must be a unique random value of at least 32 characters. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Apply migrations and seed the initial administrator:

```bash
cd server
npm run prisma:generate
npx prisma migrate dev
npm run prisma:seed
```

Start the API and frontend in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

Open `http://localhost:5173`. The API runs on `http://localhost:5001`.

## Application Workflow

1. Sign in with the administrator account configured before seeding.
2. Add employees individually or upload an `.xlsx` spreadsheet. Required employee data includes name, email, designation, and date of birth.
3. Create and activate a birthday email template. Supported variables include `{{employeeName}}`, `{{department}}`, and `{{designation}}`.
4. Review delivery results in Email History. The scheduler processes birthdays at `BIRTHDAY_CHECK_TIME` in the server's local timezone.

## Useful Commands

Run these from `server/` unless otherwise noted:

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile the API to `server/dist/` |
| `npm start` | Start the compiled API |
| `npm run prisma:generate` | Generate the Prisma client |
| `npx prisma migrate deploy` | Apply checked-in migrations without creating new ones |
| `npm run prisma:seed` | Create the configured admin if it does not exist |
| `npm run prisma:admin-password` | Explicitly reset the configured admin password |

Build the browser app with `npm --prefix client run build`; production assets are written to `client/dist/`.

## Operational Notes

- The API uses bearer JWTs; the browser stores the token in `localStorage`.
- Birthday matching uses the server's local calendar date and timezone.
- The scheduler runs inside the API process. Run exactly one API instance unless duplicate scheduler execution is otherwise prevented.
- Email delivery is not exactly-once across SMTP and PostgreSQL. Inspect failed or stale processing records and monitor delivery.
- Back up PostgreSQL regularly and test restoration. Employee names, dates of birth, and email addresses are personal data.

See [GO_LIVE.md](GO_LIVE.md) for Linux VM installation, Nginx/TLS, systemd, deployment, backups, and release checks.