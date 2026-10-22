# Linux VM Production Deployment

This guide deploys the application to a single Ubuntu 22.04/24.04 VM using Node.js, PostgreSQL, systemd, and Nginx. Nginx serves the built React app and terminates HTTPS; the API listens only on loopback. Do not expose PostgreSQL or port 5001 to the internet.

## 1. Provision the VM

Use a supported Ubuntu LTS VM with a DNS name and a static public IP. Allow inbound SSH, HTTP, and HTTPS in the cloud firewall. Install Node.js 22 LTS, PostgreSQL, Nginx, Git, and Certbot:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs certbot python3-certbot-nginx
node --version
npm --version
```

Create a dedicated, unprivileged runtime user and database:

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin birthdayapp
sudo -u postgres createuser --pwprompt birthdayapp
sudo -u postgres createdb --owner=birthdayapp birthday_wish_db
```

Use a unique database password. The database URL must use `127.0.0.1` and URL-encode any reserved characters in the password. Do not open PostgreSQL port 5432 in either the VM firewall or cloud firewall.

## 2. Install the Application

Clone the repository into the production path, then assign it to the runtime user:

```bash
sudo git clone <repository-url> /opt/birthday-wish-email-system
sudo chown -R birthdayapp:birthdayapp /opt/birthday-wish-email-system
```

Create the server environment file from the checked-in example and restrict its permissions:

```bash
sudo -u birthdayapp cp /opt/birthday-wish-email-system/.env.example /opt/birthday-wish-email-system/server/.env
sudo chmod 600 /opt/birthday-wish-email-system/server/.env
sudoedit /opt/birthday-wish-email-system/server/.env
```

Set production values. Do not leave example credentials in place:

```env
NODE_ENV=production
DATABASE_URL="postgresql://birthdayapp:<url-encoded-password>@127.0.0.1:5432/birthday_wish_db?schema=public&connection_limit=5"
JWT_SECRET="<unique-random-secret-at-least-32-characters>"
CLIENT_URL="https://birthdays.example.org"
PORT=5001
HOST=127.0.0.1
TRUST_PROXY_HOPS=1
BIRTHDAY_CHECK_TIME=09:00
SMTP_HOST=smtp.example.org
SMTP_PORT=587
SMTP_USER=birthday-sender@example.org
SMTP_PASSWORD=<smtp-credential>
SMTP_FROM="IIM Birthday Wishes <birthday-sender@example.org>"
SMTP_SECURE=false
ADMIN_EMAIL=admin@example.org
ADMIN_PASSWORD=<unique-password-at-least-12-characters>
```

`CLIENT_URL` must exactly match the public HTTPS origin. Use `SMTP_SECURE=true` with implicit TLS on port 465; use `false` with STARTTLS on port 587. Keep the VM timezone set to the institution's intended timezone because birthdays and the scheduler use local time.

Generate secrets on a trusted machine and enter them directly into the server environment file:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

If the optional developer portal is enabled, set `DEVELOPER_EMAIL`, `DEVELOPER_PASSWORD`, and a distinct strong `DEVELOPER_JWT_SECRET` together. Leave all three unset otherwise.

## 3. Build, Migrate, and Seed

Run the commands as the runtime user. Prisma reads `server/.env` from the server working directory.

```bash
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/server && npm ci && npm run prisma:generate && npx prisma migrate deploy && npm run prisma:seed && npm run build'
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/client && npm ci && npm run build'
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/server && npm prune --omit=dev'
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/client && npm prune --omit=dev'
```

The seed creates the configured administrator only when that email does not already exist. It never resets an existing password. After initial seeding, remove `ADMIN_PASSWORD` from `server/.env`; keep `ADMIN_EMAIL`. To intentionally rotate the password later, set the new value temporarily, reinstall the server's development tools, run the password command, then remove the password and prune development packages again:

```bash
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/server && npm ci && npm run prisma:admin-password'
```

After deleting `ADMIN_PASSWORD` from `server/.env`, remove development packages again:

```bash
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/server && npm prune --omit=dev'
```

The API requires `JWT_SECRET` and, in production, database, SMTP, and HTTPS client-origin settings. The server defaults to `127.0.0.1` in production; keep `HOST=127.0.0.1` so only the local reverse proxy can reach it.

## 4. Configure systemd

Install the supplied service unit and start the API:

```bash
sudo cp /opt/birthday-wish-email-system/deploy/birthday-wish-email-system.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now birthday-wish-email-system
sudo systemctl status birthday-wish-email-system
sudo journalctl -u birthday-wish-email-system -n 100 --no-pager
```

The unit runs as `birthdayapp`, restarts on failure, and reads secrets from `server/.env` through the application's dotenv initialization. Logs go to the system journal. Check `ExecStart` and `WorkingDirectory` in the unit if you install the repository somewhere other than `/opt/birthday-wish-email-system`.

Confirm the API is local before configuring the proxy:

```bash
curl -fsS http://127.0.0.1:5001/api/health
```

## 5. Configure Nginx and HTTPS

Replace `birthdays.example.org` in the supplied site configuration with the real DNS name. Install and enable it:

```bash
sudo cp /opt/birthday-wish-email-system/deploy/nginx.conf /etc/nginx/sites-available/birthday-wish-email-system
sudoedit /etc/nginx/sites-available/birthday-wish-email-system
sudo ln -s /etc/nginx/sites-available/birthday-wish-email-system /etc/nginx/sites-enabled/birthday-wish-email-system
sudo nginx -t
sudo systemctl reload nginx
```

Point the DNS A/AAAA record at the VM, then issue the certificate and enable HTTPS:

```bash
sudo certbot --nginx -d birthdays.example.org
sudo certbot renew --dry-run
```

Allow only SSH and web traffic in the host firewall; never allow ports 5001 or 5432 publicly:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Use the equivalent network firewall rules if UFW is not appropriate for the VM. The Nginx template serves the SPA, proxies `/api/` to loopback, limits request bodies to 6 MB, and sets a same-origin Content Security Policy. Revisit that policy if the frontend later loads scripts, fonts, images, or API calls from another origin.

## 6. Verify the Deployment

1. Check `https://birthdays.example.org/api/health` and confirm the certificate is valid.
2. Sign in with the seeded administrator and confirm a wrong password is rejected.
3. Confirm the application is inaccessible directly on public port 5001 and PostgreSQL port 5432.
4. Send a test message to an approved mailbox and verify SMTP delivery.
5. Upload a small valid `.xlsx` file; verify invalid input is rejected.
6. Test birthday processing with a controlled employee and verify a repeated trigger does not send a duplicate.
7. Confirm `BIRTHDAY_CHECK_TIME` matches the VM's timezone and inspect `journalctl` for scheduler startup.
8. Verify the database backup and restore procedure before storing production employee data.

## Release and Rollback

Take a database backup before applying migrations. Then deploy the intended release and rebuild from its lockfiles:

```bash
sudo systemctl stop birthday-wish-email-system
cd /opt/birthday-wish-email-system
sudo -u birthdayapp git fetch --tags
sudo -u birthdayapp git checkout <release-tag>
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/server && npm ci && npm run prisma:generate && npx prisma migrate deploy && npm run build'
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/client && npm ci && npm run build'
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/server && npm prune --omit=dev'
sudo -u birthdayapp -- sh -c 'cd /opt/birthday-wish-email-system/client && npm prune --omit=dev'
sudo systemctl start birthday-wish-email-system
sudo systemctl status birthday-wish-email-system
```

Do not use `prisma migrate dev` in production. Roll back application code only when the deployed schema remains compatible; database migrations may not be reversible. Restore a database backup only under an approved recovery procedure.

## Backups and Ongoing Operations

Create a restricted backup directory and take a PostgreSQL custom-format backup before releases and on a regular schedule:

```bash
sudo install -d -o postgres -g postgres -m 0700 /var/backups/birthday-wish-email
sudo -u postgres sh -c 'pg_dump -Fc birthday_wish_db > /var/backups/birthday-wish-email/backup-$(date +%F-%H%M%S).dump'
```

Copy backups to encrypted off-VM storage, define a retention policy, and regularly test restoring into a separate database/VM. Monitor systemd restarts, SMTP failures, failed/stale `PROCESSING` email logs, disk space, database backups, and missed scheduler runs.

## Production Limitations to Account For

- Run one API instance: the daily scheduler is in-process, and login rate limits use per-process memory. Multiple instances need coordinated scheduling and a shared rate-limit store.
- The browser stores bearer tokens in `localStorage`; the reverse proxy CSP reduces script sources but does not provide the isolation of HttpOnly cookies.
- SMTP and PostgreSQL cannot guarantee exactly-once delivery together. A crash after SMTP accepts a message but before the database records success can lead to a retry and duplicate.
- A process restart recalculates the next scheduled run; it does not automatically replay a missed run.
- `GET /api/health` is a basic API liveness response, not a database or SMTP readiness probe.
- Production dependencies currently pass `npm audit --omit=dev` in both projects. The full client development dependency audit reports high/moderate advisories in Tailwind CSS 3's build-time dependency tree; there is no compatible patched Tailwind 3 release in the current lockfile. Do not use `npm audit fix --force` as it upgrades Tailwind to v4; plan and test that migration separately. The deployment steps prune dev dependencies after building so those packages are not retained on the VM.
