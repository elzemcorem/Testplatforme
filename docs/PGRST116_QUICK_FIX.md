# PGRST116 Error - QUICK FIX (3 minutes)

## The Problem
Error: `PGRST116 - Cannot coerce the result to a single JSON object`

Translation: **Your controller cannot update future bookings because RLS policy is blocking it.**

## The 3-Step Fix

### Step 1: Execute SQL in Supabase (1 minute)
```
1. Go to: https://app.supabase.com
2. Select your project
3. Go to: SQL Editor → New Query
4. Paste this ENTIRE code:
```

```sql
-- Drop old broken policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only controllers can update future bookings" ON future_bookings;
  DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
  DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create correct policies
CREATE POLICY "Only controllers can update future bookings" ON future_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  );

CREATE POLICY "Controllers can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'controller'
    )
  );

CREATE POLICY "Admins can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM allowed_users 
      WHERE allowed_users.email = auth.email() 
      AND allowed_users.role = 'admin'
    )
  );

SELECT '✅ Policies fixed!' as status;
```

5. Click **"Run"** button (Ctrl+Enter)
6. Should see: `✅ Policies fixed!`

### Step 2: Verify Controller Role (30 seconds)
```
1. In same SQL Editor, paste:
```

```sql
-- Check if your email has role = 'controller'
SELECT email, role FROM allowed_users WHERE email = 'YOUR_EMAIL_HERE';
```

2. Replace `'YOUR_EMAIL_HERE'` with your actual email
3. Click Run
4. **MUST show `role = 'controller'`**

**If role is 'user' or something else:**
```sql
UPDATE allowed_users 
SET role = 'controller' 
WHERE email = 'YOUR_EMAIL_HERE';
```

### Step 3: Test in React App (1 minute)
```
1. Refresh browser: F5
2. Login as controller
3. Go to "Réservations Futures"
4. Click "Valider" on any booking
5. Should now work! ✅
```

## Verification Checklist

Before Step 3, verify in Supabase SQL Editor:

```sql
-- Run these 3 queries to confirm everything is ready:

-- 1. Controller exists
SELECT COUNT(*) as controller_count FROM allowed_users WHERE role = 'controller';

-- 2. Policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'future_bookings';

-- 3. Future bookings exist
SELECT COUNT(*) as booking_count FROM future_bookings;
```

Results should show:
- `controller_count` > 0 ✅
- `policyname` includes "Only controllers can update..." ✅  
- `booking_count` > 0 ✅

## Still Getting PGRST116?

If error persists after these steps:

1. **Check browser console (F12):**
   ```
   Should NOT see: "RLS policy"
   Should see: "✅ Réservation validée"
   ```

2. **Verify in Supabase SQL:**
   ```sql
   -- This should work without error (if you're logged in as controller)
   SELECT * FROM future_bookings LIMIT 1;
   ```

3. **If still failing:**
   - Make absolutely sure role = 'controller' (check case)
   - Make sure you refreshed browser (F5, not just close tab)
   - Clear browser cache (Ctrl+Shift+Delete)
   - Try incognito/private window

## Need More Help?

If you've done all 3 steps and still get PGRST116:

Run this diagnostic SQL to get detailed info:
```sql
-- Show current RLS setup
SELECT policyname, qual FROM pg_policies 
WHERE tablename = 'future_bookings' AND schemaname = 'public';

-- Show your account
SELECT email, role FROM allowed_users WHERE email = 'YOUR_EMAIL';

-- Try manual update test
UPDATE future_bookings 
SET status = 'confirmed' 
WHERE id = (SELECT id FROM future_bookings LIMIT 1);
-- If this errors → your RLS policy isn't right
-- If this succeeds → the problem is in the app code
```

Share the results and we can debug further.
