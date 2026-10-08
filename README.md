# Birthday Wish Email System

A full-stack web application for IIM that automatically sends personalized birthday wish emails to employees on their birthdays.

For production deployment, follow the [Go-Live Runbook](GO_LIVE.md).

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Email:** Nodemailer + SMTP
- **Scheduler:** In-process daily timer
- **Excel:** ExcelJS

## Prerequisites

- Node.js >= 20.x
- PostgreSQL >= 12.x
- npm or yarn

## Installation

### 1. Clone and install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. PostgreSQL Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE birthday_wish_db;
```

Or using psql:

```bash
psql -U postgres -c "CREATE DATABASE birthday_wish_db;"
```

### 3. Environment Configuration

Create `server/.env` from the example, then set unique secrets and credentials:

```powershell
Copy-Item .env.example server/.env
```

Update `server/.env` with your settings:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/birthday_wish_db?schema=public"

JWT_SECRET="<unique-random-secret-at-least-32-characters>"
ADMIN_EMAIL="admin@example.org"
ADMIN_PASSWORD="<unique-password-at-least-12-characters>"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="IIM Admin <your-email@gmail.com>"
SMTP_SECURE=false

BIRTHDAY_CHECK_TIME="08:00"
CLIENT_URL="http://localhost:5173"
PORT=5001
```

Generate JWT secrets with a cryptographically secure random generator. For Gmail SMTP, enable 2FA and use an App Password (not your regular password). See [GO_LIVE.md](GO_LIVE.md) before production deployment.

### 4. Prisma Setup

```bash
cd server

# Format schema
npx prisma format

# Generate Prisma client
npx prisma generate

# Apply checked-in migrations
npx prisma migrate dev

# Create the configured admin account; an existing account is never overwritten
npx prisma db seed
```

For an existing database, rotate any legacy default password with `npm run prisma:admin-password` after setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`.

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173`
The backend API will be available at `http://localhost:5001`

## How to Use

### 1. Login

Open `http://localhost:5173` and log in using the administrator credentials configured in `server/.env` before seeding.

### 2. Upload Employee Excel

1. Go to **Upload Excel** page
2. Download the template
3. Fill in employee data with columns:
   - Name
   - Designation
   - Date of Birth (`DD/MM/YYYY` or `YYYY-MM-DD`)
   - Email
4. Upload the file

The system validates:
- Required columns exist
- Email format is valid
- Date of Birth format is valid
- No duplicate emails in file or database

### 3. Create Email Template

1. Go to **Templates** page
2. Click **Add Template**
3. Use variables: `{{employeeName}}`, `{{department}}`, `{{designation}}`
4. Activate the template

### 4. View Dashboard

The dashboard shows:
- Total active employees
- Today's birthdays with email status
- Emails sent today
- Failed emails today

### 5. Manual Birthday Processing

Use the API endpoint to manually trigger birthday emails:
```bash
POST /api/birthdays/send
Authorization: Bearer <token>
```

### 6. Email History

Go to **Email History** to view all sent/failed emails with filters for:
- Date range
- Status (PROCESSING/SENT/FAILED)
- Employee

### 7. Automatic Scheduling

The system automatically runs every day at the configured time (`BIRTHDAY_CHECK_TIME`, default: 08:00).

The scheduler uses the server's local timezone and checks once each day at `BIRTHDAY_CHECK_TIME`. Configure the host timezone to match the institution's intended birthday schedule.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password

### Employees
- `GET /api/employees` - List all employees (supports ?department=&isActive=)
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `POST /api/employees/upload` - Upload Excel file (multipart/form-data)

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Birthdays
- `GET /api/birthdays/today` - Get today's birthdays
- `GET /api/birthdays/upcoming?days=7` - Get upcoming birthdays
- `POST /api/birthdays/send` - Process today's active employees with birthdays

### Emails
- `GET /api/emails/history` - Get email history (supports ?startDate=&endDate=&status=&employeeId=)
- `POST /api/emails/test` - Send test email

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Database Schema

### User
- `id` - Primary key
- `email` - Unique email address
- `password` - Bcrypt hashed password
- `name` - User name
- `role` - User role (ADMIN)
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

### Employee
- `id` - Primary key
- `name` - Employee name
- `email` - Unique email address
- `department` - Department name
- `designation` - Job designation
- `dateOfBirth` - Date of birth
- `isActive` - Active status
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

### EmailTemplate
- `id` - Primary key
- `name` - Template name
- `subject` - Email subject with variables
- `body` - Email body with variables
- `isActive` - Active status
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

### EmailLog
- `id` - Primary key
- `employeeId` - Foreign key to Employee
- `templateId` - Foreign key to EmailTemplate
- `birthdayDate` - Birthday date (year set to current year)
- `recipientEmail` - Email address sent to
- `subject` - Email subject sent
- `status` - PROCESSING, SENT, or FAILED
- `sentAt` - Timestamp when sent
- `errorMessage` - Error message if failed
- `createdAt` - Creation timestamp
- `updatedAt` - Last attempt/state-change timestamp

**Unique constraint:** `(employeeId, birthdayDate)` prevents duplicate birthday emails.

## Common Troubleshooting

1. **Database connection error**: Ensure PostgreSQL is running and `DATABASE_URL` is correct.
2. **SMTP authentication failed**: For Gmail, enable 2FA and use an App Password.
3. **Excel upload fails**: Upload a valid `.xlsx` file with `Name`, `Email`, `Designation`, and `DOB` columns. Dates can use `DD/MM/YYYY` or `YYYY-MM-DD`.
4. **Scheduler did not run**: Check `BIRTHDAY_CHECK_TIME` and the operating-system timezone. The process must remain running for the in-process scheduler to fire.
5. **Port already in use**: Change `PORT` in `.env` or stop the conflicting service.

## Project Structure

```
birthday-wish-email-system/
├── client/
│   ├── src/
│   │   ├── components/       # Layout, Navbar
│   │   ├── pages/            # Login, Dashboard, Employees, Upload, Templates, EmailHistory
│   │   ├── services/         # API client
│   │   └── types/            # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Business logic
│   │   ├── jobs/             # In-process birthday scheduler
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── utils/            # Prisma client
│   │   └── server.ts         # Entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Admin seed
│   ├── temp/                 # Temporary upload storage
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Development Workflow

1. Start PostgreSQL
2. Run `npx prisma migrate dev` in `server/`
3. Run `npx prisma db seed` in `server/`
4. Start backend: `cd server && npm run dev`
5. Start frontend: `cd client && npm run dev`
6. Open `http://localhost:5173`
7. Login and explore

## Testing the Birthday Flow

1. Upload employees via Excel with today's birthdays
2. Create and activate an email template
3. Go to Dashboard
4. Trigger birthday send via API or wait for the configured daily schedule
5. Check Email History for PROCESSING/SENT/FAILED status
6. Verify duplicate prevention by triggering again
