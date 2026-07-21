# Rider Management Backend

Express + TypeScript API for motorcycle riding group registration, admin login, rider review, exports, and site logo management.

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- JWT authentication
- Multer memory uploads
- Cloudinary file storage
- Zod validation

## Setup

Install dependencies:

```powershell
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your local MongoDB, JWT, admin, and Cloudinary values:

```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/rider-management
JWT_SECRET=replace-with-at-least-16-characters
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=ror_admin_session
AUTH_COOKIE_MAX_AGE_MS=604800000
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
TRUST_PROXY=false
FRONTEND_URL=http://localhost:3000,http://localhost:3001
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
EMAIL_ENABLED=false
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=rebelsonroads@gmail.com
BREVO_SENDER_NAME=Rebels on Roads
BREVO_REPLY_TO_EMAIL=rebelsonroads@gmail.com
```

The configured admin account is created or synchronized automatically whenever the API starts. You can also seed it manually:

```powershell
npm run seed:admin
```

Start development server:

```powershell
npm run dev
```

Default API URL:

```text
http://localhost:8000/api
```

## Scripts

```powershell
npm run dev          # Start API in watch mode
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled production server
npm run seed:admin   # Create/update admin user from .env
npm test             # Run Vitest tests
```

## Public Routes

```text
GET  /api/settings
POST /api/riders
```

## Admin Routes

Admin login issues an HttpOnly session cookie. Browser clients must send credentials with API requests.

```text
POST   /api/admin/login
GET    /api/admin/me
POST   /api/admin/logout
GET    /api/admin/stats
GET    /api/admin/riders
GET    /api/admin/riders/:id
PATCH  /api/admin/riders/:id/status
DELETE /api/admin/riders/:id
PATCH  /api/admin/settings/logo
GET    /api/admin/riders/export/csv
GET    /api/admin/riders/export/excel
GET    /api/admin/partner-enquiries
PATCH  /api/admin/partner-enquiries/:id
DELETE /api/admin/partner-enquiries/:id
GET    /api/admin/emails
POST   /api/admin/emails/send
```

## Brevo email delivery

Verify `BREVO_SENDER_EMAIL` as a sender in Brevo, add the API key, then set `EMAIL_ENABLED=true`. New registrations receive a pending-review receipt; the membership welcome email is sent only on the first transition to `approved`. Admins can use `/admin/email-center` for approved-rider updates, brand collaboration/thanks messages, combined announcements, and custom recipients. Email delivery failures are logged and never undo rider registration or approval.

## Upload Rules

Rider documents:

- Fields: `aadhaarFront`, `aadhaarBack`, optional `dlFront`, optional `dlBack`
- Types: `jpg`, `jpeg`, `png`, `pdf`
- Max size: `5MB`

Logo upload:

- Field: `logo`
- Types: `jpg`, `jpeg`, `png`, `webp`
- Max size: `2MB`

## Build

```powershell
npm run build
```
