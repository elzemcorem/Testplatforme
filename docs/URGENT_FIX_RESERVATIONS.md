# 🚨 URGENT: Normal Reservations Broken - FIX REQUIRED

## Problem
Users can no longer create normal reservations. Error: Permission denied or no rows returned.

## Root Cause
In `FIX_RLS_ROLE_CHECK.sql`, we:
- ✅ Dropped ALL reservation policies (including user INSERT policy)
- ✅ Created controller UPDATE policy
- ✅ Created admin UPDATE policy
- ❌ **FORGOT to recreate the user INSERT policy!**

Result: Normal users have NO INSERT policy → Cannot create reservations!

## Solution (IMMEDIATE)

### Step 1: Execute the Fix SQL in Supabase
1. Go to: https://app.supabase.com → Your Project → SQL Editor → New Query
2. **Copy and paste ALL of this code:**

```sql
-- Drop broken policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Controllers can update reservations" ON reservations;
  DROP POLICY IF EXISTS "Admins can update reservations" ON reservations;
  DROP POLICY IF EXISTS "Users can read reservations" ON reservations;
  DROP POLICY IF EXISTS "Users can insert reservations" ON reservations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create COMPLETE reservation policies

-- 1. Everyone can view all non-cancelled reservations
CREATE POLICY "Users can view all reservations" ON reservations
  FOR SELECT USING (status != 'cancelled');

-- 2. NORMAL USERS can create their own reservations
CREATE POLICY "Users can create reservations" ON reservations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Users can update their own pending reservations
CREATE POLICY "Users can update own reservations" ON reservations
  FOR UPDATE USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- 4. CONTROLLERS can update any reservation
CREATE POLICY "Controllers can update any reservation" ON reservations
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

-- 5. ADMINS can also update any reservation
CREATE POLICY "Admins can update any reservation" ON reservations
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

-- 6. Users can delete their own reservations
CREATE POLICY "Users can delete own reservations" ON reservations
  FOR DELETE USING (user_id = auth.uid() AND status = 'pending');
```

3. Click **"Run"** (Ctrl+Enter)

### Step 2: Test
1. Refresh browser (F5)
2. Login as normal user
3. Try to create a reservation
4. Should work now! ✅

## Complete Policy Structure

### For `reservations` table:

| User Type | SELECT | INSERT | UPDATE | DELETE |
|-----------|--------|--------|--------|--------|
| **Normal User** | ✅ All non-cancelled | ✅ Own only | ✅ Own pending | ✅ Own pending |
| **Controller** | ✅ All | ❌ No | ✅ Any | ❌ No |
| **Admin** | ✅ All | ❌ No | ✅ Any | ❌ No |

### For `future_bookings` table:

| User Type | SELECT | INSERT | UPDATE | DELETE |
|-----------|--------|--------|--------|--------|
| **Normal User** | ✅ All non-cancelled | ✅ Own only | ❌ No | ✅ Own |
| **Controller** | ✅ All | ❌ No | ✅ Any | ❌ No |
| **Admin** | ✅ All | ❌ No | ❌ No | ❌ No |

## Verification

After running the SQL, verify policies are correct:

```sql
SELECT policyname, qual, with_check
FROM pg_policies 
WHERE tablename = 'reservations'
ORDER BY policyname;
```

Should show:
- ✅ "Users can create reservations" (INSERT)
- ✅ "Users can view all reservations" (SELECT)
- ✅ "Users can update own reservations" (UPDATE)
- ✅ "Controllers can update any reservation" (UPDATE)
- ✅ "Admins can update any reservation" (UPDATE)
- ✅ "Users can delete own reservations" (DELETE)

## Prevention

For future SQL changes:
1. Always backup existing policies first
2. Test with normal user account
3. Test with controller account
4. Test with admin account
5. Verify all CRUD operations work

## File to Run

**File**: `FIX_RESERVATIONS_POLICIES.sql` (in project root)

Or use the SQL code above directly in Supabase SQL Editor.

## Status

- 🚨 Problem Identified: User INSERT policy missing
- ⚠️ Fix Created: `FIX_RESERVATIONS_POLICIES.sql`
- ⏳ Awaiting User: Execute the SQL in Supabase

After fix:
- Normal users → Create reservations ✅
- Controllers → Validate reservations ✅
- Admins → Manage reservations ✅
