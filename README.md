# Birthday Wish Email System

A full-stack web application for IIM that automatically sends personalized birthday wish emails to employees on their birthdays.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Email:** Nodemailer + SMTP
- **Scheduler:** node-cron
- **Excel:** xlsx package

## Prerequisites

- Node.js >= 16.x
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

Create `server/.env` from the example:

```bash
cp ../.env.example server/.env
```

Update `server/.env` with your settings:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/birthday_wish_db?schema=public"

JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="IIM Admin <your-email@gmail.com>"

BIRTHDAY_CHECK_TIME="08:00"
CLIENT_URL="http://localhost:5173"
PORT=5000
```

**Note:** For Gmail SMTP, enable 2FA and use an App Password (not your regular password).

### 4. Prisma Setup

```bash
cd server

# Format schema
npx prisma format

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed admin user
npx prisma db seed
```

Default admin credentials:
- Email: `admin@iim.ac.in`
- Password: `admin123`

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
The backend API will be available at `http://localhost:5000`

## How to Use

### 1. Login

Open `http://localhost:5173` and login with:
- Email: `admin@iim.ac.in`
- Password: `admin123`

### 2. Upload Employee Excel

1. Go to **Upload Excel** page
2. Download the template
3. Fill in employee data with columns:
   - Employee Code
   - Name
   - Email
   - Department
   - Designation
   - Date of Birth (YYYY-MM-DD)
4. Upload the file

The system validates:
- Required columns exist
- Email format is valid
- Date of Birth format is valid
- No duplicate Employee Codes in file or database
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
- Status (SENT/FAILED)
- Employee

### 7. Automatic Scheduling

The system automatically runs every day at the configured time (`BIRTHDAY_CHECK_TIME`, default: 08:00).

**Note:** On Windows, the cron scheduler may show a startup error due to timezone/month parsing. The server still starts correctly and the birthday job can be triggered manually via the API.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/seed` - Seed admin user (development only)

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
- `POST /api/birthdays/send` - Manually trigger birthday emails

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
- `employeeCode` - Unique employee code
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
- `status` - SENT or FAILED
- `sentAt` - Timestamp when sent
- `errorMessage` - Error message if failed
- `createdAt` - Creation timestamp

**Unique constraint:** `(employeeId, birthdayDate)` prevents duplicate birthday emails.

## Common Troubleshooting

1. **Database connection error**: Ensure PostgreSQL is running and `DATABASE_URL` is correct.
2. **SMTP authentication failed**: For Gmail, enable 2FA and use an App Password.
3. **Excel upload fails**: Ensure the Excel file has exact column headers: `Employee Code`, `Name`, `Email`, `Department`, `Designation`, `Date of Birth`.
4. **Cron scheduler error on Windows**: The server may log a cron parsing error on startup. This is a known Windows limitation. Use the manual trigger endpoint `POST /api/birthdays/send` instead.
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
│   │   ├── jobs/             # Birthday cron job
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
2. Run `npx prisma migrate dev --name init` in `server/`
3. Run `npx prisma db seed` in `server/`
4. Start backend: `cd server && npm run dev`
5. Start frontend: `cd client && npm run dev`
6. Open `http://localhost:5173`
7. Login and explore

## Testing the Birthday Flow

1. Upload employees via Excel with today's birthdays
2. Create and activate an email template
3. Go to Dashboard
4. Trigger birthday send via API or wait for cron
5. Check Email History for SENT/FAILED status
6. Verify duplicate prevention by triggering again
