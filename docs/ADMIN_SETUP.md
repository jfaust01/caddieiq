# Admin User Setup

This document describes the development-only admin bootstrap flow for CaddieIQ.

## Overview

The admin setup flow allows creating the initial admin user during local development without manually hashing passwords or editing the database. This is essential for:

- First-time local development setup
- Setting up fresh database instances
- Creating test admin accounts in development environments

## How It Works

### Development Mode Only

The admin setup page and API are **only available in development mode** (`NODE_ENV === "development"`):

- In production, `/setup/*` routes return 404 (routes appear not to exist)
- The API endpoint refuses requests with a 403 error
- Middleware blocks all setup requests outside development

### Prerequisites

- Node.js development environment with `NODE_ENV=development`
- Local database with schema migrated
- Better Auth properly configured

## Using the Admin Setup

### Step 1: Start Your Local Dev Server

```bash
npm run dev
```

The app runs on `http://localhost:3000` by default.

### Step 2: Navigate to Admin Setup

Open your browser and go to:

```
http://localhost:3000/setup/admin
```

### Step 3: Create Admin User

Fill in the form with:

- **Full Name** (optional) — Your display name
- **Email Address** (required) — Admin account email (e.g., `admin@example.com`)
- **Password** (required) — Minimum 8 characters
- **Confirm Password** (required) — Must match password field

### Step 4: Submit

Click "Create Admin User". The page will:

1. Validate form inputs
2. Check if an admin already exists
3. Hash the password using argon2 (same algorithm as Better Auth)
4. Create the user with `role: ADMIN`
5. Create an Account record with the hashed password
6. Show a success message
7. Redirect to `/login` after 2 seconds

### Step 5: Log In

Use the email and password you created to log in at `/login`.

## Checking Setup Status

The setup page automatically checks if an admin already exists:

- If no admin exists: Shows the form
- If admin exists: Shows "Setup Already Completed" message

To check programmatically:

```bash
# Development only
curl http://localhost:3000/api/setup/admin

# Response:
# { "adminExists": true, "setupComplete": true }
```

## API Reference

### GET /api/setup/admin

Check if admin setup has been completed.

**Returns:**
```json
{
  "adminExists": boolean,
  "setupComplete": boolean
}
```

**Errors:**
- 403: Not in development mode
- 500: Database error

### POST /api/setup/admin

Create the initial admin user.

**Request:**
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "id": "user_id",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**Errors:**
- 400: Admin exists, email in use, or validation failed
- 403: Not in development mode
- 500: Database error

## Technical Details

### Password Hashing

Passwords are hashed using **argon2** with the same parameters Better Auth uses:

```typescript
hash(password, {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
})
```

This is done server-side using the `@node-rs/argon2` package.

### Database Records

The setup creates two records:

1. **User** table:
   - `id`: CUID generated ID
   - `email`: Admin email
   - `name`: Admin name
   - `role`: "ADMIN"
   - `emailVerified`: true
   - Standard timestamps

2. **Account** table:
   - `id`: `email_${email}` format
   - `accountId`: Email address
   - `providerId`: "credential" (password auth)
   - `password`: Hashed password
   - `userId`: Foreign key to User

### Validation

The endpoint validates:

- Email is provided
- Password is at least 8 characters
- Passwords match (client-side + server-side validation)
- Email is not already in use
- No admin already exists

## Security

### Production Protection

- Middleware blocks `/setup/*` with 404 in production
- API endpoint returns 403 if not in development
- Setup page renders but middleware blocks before reaching it

### Password Security

- Passwords never logged to console
- Hashed with strong argon2 parameters
- Stored in database only as hash
- Never transmitted in plain text outside HTTPS context

### Admin Access

Created users have the `ADMIN` role, which grants:

- Access to `/admin/*` pages
- Database Health Dashboard
- System Operations panels
- Admin menu in user dropdown

## Troubleshooting

### "Admin setup is only available in development mode"

**Issue:** Trying to access setup in production

**Solution:** This is by design. Setup is disabled in production for security.

### "An admin user already exists"

**Issue:** Tried to create second admin through setup page

**Solution:** Only one admin can be created through the setup page. To create additional admins:

```bash
# Use Prisma Studio
npx prisma studio

# Find user → Edit role → Set to ADMIN
```

Or use SQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'user@example.com';
```

### "Email already in use"

**Issue:** Tried to create admin with existing email

**Solution:** Use a different email address, or delete the existing user first:

```bash
npx prisma studio
# Find user → Delete
```

### Password validation errors

**Issue:** "Password must be at least 8 characters"

**Solution:** Use a password with 8+ characters. Spaces and special characters are allowed.

## After Setup

Once admin is created, you can:

1. **Log in** with admin credentials
2. **Access admin dashboard** at `/admin/database-health`
3. **Create additional admins** by editing user roles in:
   - Prisma Studio: `npx prisma studio`
   - Database: Update `role` field directly

4. **Modify admin** (e.g., add to other roles):
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE id = 'user_id';
   ```

## Development Workflow

Typical first-time setup:

```bash
# 1. Clone repo
git clone <repo>
cd caddieiq

# 2. Install dependencies
npm install

# 3. Set up database (create .env.local with DATABASE_URL)
npx prisma migrate deploy

# 4. Start dev server
npm run dev

# 5. Open browser
open http://localhost:3000/setup/admin

# 6. Create admin user via form

# 7. Log in and explore
# Navigate to /admin/database-health to see system health
```

## Related Documentation

- [Admin Authorization](./ADMIN_AUTHORIZATION.md) — Role-based access control
- [Database Health Dashboard](./DATABASE_HEALTH_DASHBOARD.md) — Admin features
- Better Auth docs: https://www.better-auth.com/
