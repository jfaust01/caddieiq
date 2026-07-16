# Admin Authorization System

## Overview

CaddieIQ implements a role-based authorization system with two roles:
- **USER** — Standard authenticated user (default)
- **ADMIN** — Administrator with access to operations dashboards and system tools

## Architecture

### Roles & Authorization

**User Model:**
- Field: `role: UserRole` (enum: USER, ADMIN)
- Default: USER
- Set at user creation or promotion

### Authorization Layers

1. **Database Layer** — Enforced by the User model and Prisma schema
2. **Server Components** — Using `isCurrentUserAdmin()` helper in `/admin/layout.tsx`
3. **Client Components** — Using `AdminGuard` component or direct role checks in client code
4. **Navigation** — Admin links filtered via `adminOnly` flag in `constants/navigation.ts`

## Core Components & Utilities

### Server-Side Protection

**`lib/session.ts`**
```typescript
/**
 * Returns true if current user is ADMIN, false otherwise.
 * Safe for guarding server actions and page components.
 * Re-reads role from database on every call (never trusts client).
 */
async function isCurrentUserAdmin(): Promise<boolean>
```

Used in `/admin/layout.tsx` to protect all `/admin/*` routes.

### Client-Side Guard

**`components/auth/admin-guard.tsx`**
```typescript
interface AdminGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Conditionally render content for admins only.
 * Checks session.user.role from Better Auth client.
 */
export function AdminGuard({ children, fallback }: AdminGuardProps)
```

Usage:
```tsx
<AdminGuard fallback={<p>Admin only</p>}>
  <AdminDashboard />
</AdminGuard>
```

### Navigation Integration

**`constants/navigation.ts`**
- Mark sections with `adminOnly: true` to hide them from non-admin users
- The `AppSidebar` component automatically filters based on `session.user.role === 'ADMIN'`

**User Menu** (`components/layout/user-menu.tsx`)
- Shows "Admin" badge when user is ADMIN
- Includes "Admin" link pointing to `/admin/database-health`

## Access Denied Flow

When a non-admin user attempts to access `/admin/*`:

1. **Admin Layout** (`app/(app)/admin/layout.tsx`) checks `isCurrentUserAdmin()`
2. If false → redirect to `/admin/access-denied`
3. **Access Denied Page** displays friendly message with options to go home or view settings
4. No infinite redirects — single clean UX

## Promoting a User to Admin

### Development (Recommended)

**Option 1: Database Query**
```bash
# Connect to your Neon database
psql $DATABASE_URL

# Promote user to ADMIN by email
UPDATE users SET role = 'ADMIN' WHERE email = 'user@example.com';

# Verify promotion
SELECT id, email, role FROM users WHERE email = 'user@example.com';
```

**Option 2: Prisma Studio (Visual)**
```bash
# Open Prisma Studio
npx prisma studio

# Navigate to User table → Find user → Edit role field → Set to ADMIN → Save
```

### In Application (Server Action - Future Enhancement)

Once admin controls are built, consider adding a server action:
```typescript
// features/admin/actions/promote-user.ts
'use server'

import { isCurrentUserAdmin } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function promoteUserToAdmin(targetUserId: string) {
  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) throw new Error('Unauthorized')

  await prisma.user.update({
    where: { id: targetUserId },
    data: { role: 'ADMIN' },
  })
}
```

## Security Considerations

### Always Revalidate

The `isCurrentUserAdmin()` function **always fetches from the database**, never trusting the client session. This prevents:
- Token tampering
- Session hijacking
- Role escalation via local changes

### Protected Routes

All `/admin/*` routes are protected by:
1. **Server-side check** in admin layout (cannot be bypassed by client)
2. **Access denied page** (no redirects to login, clear communication)
3. **Navigation filtering** (admin links hidden in UI for non-admins)

### No Weak Fallbacks

- Non-admins see `/admin/access-denied`, not a login redirect
- No "try again" or redirects that could loop
- Clear message explaining why access was denied

## Navigation & UI

### Sidebar Navigation

The `AppSidebar` component:
1. Fetches session from Better Auth
2. Extracts `user.role` (client-side convenience only)
3. Filters sections with `adminOnly: true`
4. Only admins see operations/admin sections

### User Menu Badge

In `components/layout/user-menu.tsx`:
- Admin users see "Admin" badge next to their name
- Admin users see "Admin" menu item linking to `/admin/database-health`

## Testing Authorization

### Test Admin Access
```bash
# 1. Promote your test user to ADMIN via database query
UPDATE users SET role = 'ADMIN' WHERE email = 'test@example.com';

# 2. Sign in as that user
# 3. Navigate to /admin/database-health
# 4. Verify dashboard loads

# 5. Check user menu
# → Should show "Admin" badge
# → Should show "Admin" menu item
```

### Test Non-Admin Access
```bash
# 1. Create a regular USER (default role)
# 2. Sign in as that user
# 3. Navigate to /admin/database-health
# 4. Should see "Access Denied" page

# 5. Check sidebar
# → Admin sections should be hidden

# 6. Check user menu
# → No "Admin" badge
# → No "Admin" menu item
```

## Future Enhancements

1. **Granular Roles** — Add MODERATOR, ANALYST, etc.
2. **Permissions** — Instead of roles, use capability-based permissions
3. **Audit Logs** — Track who promoted whom and when
4. **Admin Panel** — UI for promoting/demoting users without database access
5. **Session Invalidation** — Clear sessions on role change for immediate effect

## Related Files

- `lib/auth.ts` — Better Auth configuration
- `lib/session.ts` — `isCurrentUserAdmin()` helper
- `lib/auth-client.ts` — Client-side auth utilities
- `components/auth/admin-guard.tsx` — Client-side guard component
- `app/(app)/admin/layout.tsx` — Server-side protection
- `app/(app)/admin/access-denied/page.tsx` — Friendly error page
- `constants/navigation.ts` — Navigation structure with adminOnly flags
- `components/layout/app-sidebar.tsx` — Sidebar filtering logic
- `components/layout/user-menu.tsx` — User menu with admin badge
