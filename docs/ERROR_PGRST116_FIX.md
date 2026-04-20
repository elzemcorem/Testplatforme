# 🚨 URGENT: Error PGRST116 - RLS Policy Blocking Update

## Error Details
```
[FutureBookingsService] Error updating booking status: {
  code: 'PGRST116',
  details: 'The result contains 0 rows',
  message: 'Cannot coerce the result to a single JSON object'
}
```

## Meaning
La RLS policy **bloque l'UPDATE** - le contrôleur n'a pas les droits pour mettre à jour les réservations.

## Root Cause
Les RLS policies n'ont pas été corrigées. Elles utilisent probablement encore `auth.jwt()->>'role'` qui ne fonctionne pas.

## ⚠️ IMMEDIATE ACTION REQUIRED

### Step 1: Verify RLS Policies (takes 30 seconds)
1. Go to Supabase → SQL Editor
2. Create a new query
3. Copy-paste **URGENT_RLS_CHECK.sql** (in project root)
4. Click Run (Ctrl+Enter)
5. Look at the results:

   **❌ If you see policies with `auth.jwt()` condition:**
   - They're broken and blocking controller updates
   
   **✅ If you see policies with `allowed_users` and `auth.email()` condition:**
   - They should work (if not, check Step 2)

### Step 2: Fix RLS Policies (if still broken)
1. Go to Supabase → SQL Editor → New query
2. Copy-paste **FIX_RLS_ROLE_CHECK.sql** (in project root)
3. Click Run (Ctrl+Enter)
4. Should see: `✅ RLS Policies fixed to check role from allowed_users table`

### Step 3: Verify Controller Account
```sql
-- Run this in Supabase SQL Editor
-- Replace 'controller@beninpetro.com' with your email
SELECT email, role, noms FROM allowed_users 
WHERE email = 'controller@beninpetro.com';
```

**Must show:**
- email: `controller@beninpetro.com` (or your email)
- role: `controller` (MUST be 'controller', not 'user' or anything else)
- noms: Your full name

**If role is wrong:**
```sql
UPDATE allowed_users 
SET role = 'controller' 
WHERE email = 'controller@beninpetro.com';
```

### Step 4: Test Again
1. Reload the React app (F5)
2. Login as controller
3. Click "Valider" or "Refuser" on a future booking
4. Should work now! 🎉

## Debugging Steps

### Console Logs to Check (F12 → Console)
```
✅ Should see: "[FutureBookingsPage] Current user role: controller"
✅ Should see: "[FutureBookingsService] Booking found: {...}"
✅ Should see: "[FutureBookingsService] Update successful"
❌ Should NOT see: "You don't have permissions for..."
```

### If Still Getting Error

Run this to diagnose:
```sql
-- Check what the CURRENT issue is
SELECT 'Current RLS Policy Status' as check;
SELECT policyname, qual FROM pg_policies 
WHERE tablename = 'future_bookings' LIMIT 5;

-- Manual permission test
SELECT 'Can I (current user) update?' as check;
UPDATE future_bookings 
SET status = 'confirmed' 
WHERE id = 'BOOKING-ID-HERE'
RETURNING id, status;
-- This will error if RLS denies access
```

## Checklist

Before testing, verify:

- [ ] Executed **FIX_RLS_ROLE_CHECK.sql** in Supabase (no errors)
- [ ] Ran **URGENT_RLS_CHECK.sql** and saw policies with `allowed_users` condition
- [ ] Controller email is in `allowed_users` table
- [ ] Controller role is set to `'controller'` (exact case)
- [ ] Refreshed browser (F5)
- [ ] Logged in as controller again

## Questions?

If the problem persists:

1. **Run URGENT_RLS_CHECK.sql** and share the results
2. **Check browser console (F12)** and note any errors
3. **Verify controller email and role** in allowed_users table
4. Make sure you clicked "Run" in Supabase SQL Editor (not just open/close)

## Technical Details

### What Changed in Code
- Updated `updateFutureBookingStatus()` to:
  1. First verify the booking exists (to distinguish "not found" from "access denied")
  2. Use `.update()` without `.single()` (avoid PGRST116 when UPDATE succeeds)
  3. Check for error code 'PGRST116' specifically (RLS policy block)
  4. Show helpful error messages pointing to FIX_RLS_ROLE_CHECK.sql

### SQL Policies (what needs to work)
```sql
-- CORRECT (new policy format):
CREATE POLICY "Only controllers can update" ON future_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  );

-- WRONG (old broken format):
FOR UPDATE USING (auth.jwt()->>'role' = 'controller')
-- ❌ This doesn't work because role is not in JWT custom claims
```

## Next Steps

1. Execute the SQL files above
2. Test again with the corrected code
3. Contact support if problems persist
