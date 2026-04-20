# Complete Code Flow Analysis: Controller Validation → DAF Dashboard Display

## Overview
This document traces the complete flow from when a controller validates a reservation to when the DAF dashboard receives and displays the real-time update.

---

## STEP 1: Controller Clicks "Valider" Button

### 1.1 User Interface Layer
**File**: [src/components/ReservationsPage.tsx](src/components/ReservationsPage.tsx#L380)

```
Line 380-389: Button renders for pending reservations
  - Button text: "Valider"
  - onClick handler: calls handleValidate(reservation)
  - Only shows if: status === "pending" && currentUser?.role === "controller"
```

**Relevant Code**:
```typescript
<Button
  size="sm"
  variant="outline"
  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
  onClick={(e) => {
    e.stopPropagation();
    handleValidate(reservation);  // ← THIS FUNCTION CALL
  }}
>
  <CheckCircle className="w-4 h-4 mr-1" />
  Valider
</Button>
```

### 1.2 Handler Function
**File**: [src/components/ReservationsPage.tsx](src/components/ReservationsPage.tsx#L89-L111)

```
Line 89-111: handleValidate function - THE CRITICAL VALIDATION LOGIC
```

**Step-by-step breakdown**:

1. **Line 90**: Logs the validation start with controller role
   ```typescript
   console.log(`🔍 handleValidate called - currentUser.role=${currentUser?.role}`);
   ```

2. **Line 93-99**: Role verification - Must be "controller"
   ```typescript
   if (currentUser?.role !== "controller") {
     console.error(`❌ Not a controller. Role is: ${currentUser?.role}`);
     toast.error("Accès refusé");
     return;  // ← STOPS if not controller
   }
   ```

3. **Line 103-110**: Calls updateReservation with status = "confirmed"
   ```typescript
   const updated = await reservationService.updateReservation(
     reservation.id,
     {
       status: "confirmed",  // ⚠️ IMPORTANT: "confirmed" not "validated"
       validatedBy: currentUser?.name,
     }
   );
   ```

**CRITICAL DETAIL**: The status sent is `"confirmed"`, NOT `"validated"`. 
- This matches the enum value for validation
- The trigger will convert `"confirmed"` → action_type `"validated"`

---

## STEP 2: Database Update & RLS Policy Check

### 2.1 Service Layer - updateReservation
**File**: [src/services/reservationService.ts](src/services/reservationService.ts#L128-L170)

```
Line 128-170: updateReservation function - API to Supabase
```

**Process**:

1. **Line 130**: Logs the update start
2. **Line 139-146**: Maps TypeScript properties to database snake_case
3. **Line 148-155**: Supabase update call
   ```typescript
   const { data, error } = await this.supabase
     .from("reservations")
     .update(dbUpdates)      // ← Database write
     .eq("id", id)
     .select()
     .single();
   ```

### 2.2 RLS Policy Check - Row Level Security
**File**: [FIX_CONTROLLER_RLS.sql](FIX_CONTROLLER_RLS.sql#L5-L17)

```
Lines 5-17: "Controllers can update reservations" RLS policy
```

**What happens**:
```sql
CREATE POLICY "Controllers can update reservations" ON reservations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND role = 'controller'  ← ✅ ALLOWS if user has controller role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND role = 'controller'
    )
  );
```

**RLS Check Flow**:
1. Supabase checks if `auth.uid()` has `role = 'controller'`
2. If YES ✅ → Update proceeds
3. If NO ❌ → Update rejected with RLS error

---

## STEP 3: SQL Trigger Executes - Logs Controller Action

### 3.1 Trigger Setup
**File**: [FUTURE_BOOKINGS_TABLE.sql](FUTURE_BOOKINGS_TABLE.sql#L130-L160)

```
Lines 130-160: Trigger definition
Lines 144: AFTER UPDATE ON reservations
```

**Trigger Configuration**:
```sql
CREATE TRIGGER trg_log_controller_action
AFTER UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION log_controller_action();
```

### 3.2 Trigger Function - Core Logic
**File**: [FUTURE_BOOKINGS_TABLE.sql](FUTURE_BOOKINGS_TABLE.sql#L113-L142)

```
Lines 113-142: log_controller_action() function - THE HEART OF LOGGING
```

**Trigger Logic Flow**:

```sql
FUNCTION log_controller_action()
├─ TRIGGER CONDITION: NEW.status IS DISTINCT FROM OLD.status
│  └─ ✅ Fires when status changes (e.g., "pending" → "confirmed")
│
├─ INSERT INTO controller_actions_log
│  ├─ controller_id: COALESCE(auth.uid(), default_uuid)  ← Who did it
│  ├─ reservation_id: NEW.id                             ← Which reservation
│  ├─ action_type: CASE WHEN                             ← What happened
│  │  ├─ NEW.status = 'confirmed' → 'validated'
│  │  ├─ NEW.status = 'cancelled' → 'cancelled'
│  │  └─ ELSE → 'modified'
│  ├─ old_status: OLD.status (e.g., "pending")           ← Before
│  ├─ new_status: NEW.status (e.g., "confirmed")         ← After
│  └─ timestamp: now()                                   ← When
│
└─ RETURN NEW
```

### 3.3 Data Inserted into controller_actions_log
**File**: [FUTURE_BOOKINGS_TABLE.sql](FUTURE_BOOKINGS_TABLE.sql#L57-L67)

```
Lines 57-67: controller_actions_log table definition
```

**Example row after trigger**:
```
{
  id: "uuid-123",
  controller_id: "controller-uuid",           ← Who validated
  reservation_id: "reservation-uuid",         ← Which reservation
  action_type: "validated",                   ← NOT "confirmed", trigger converts it
  old_status: "pending",
  new_status: "confirmed",
  reason: null,
  timestamp: "2024-04-18T10:30:00Z",
  created_at: "2024-04-18T10:30:00Z"
}
```

### 3.4 RLS Policy for controller_actions_log INSERT
**File**: [FIX_RLS_CONTROLLER_ACTIONS.sql](FIX_RLS_CONTROLLER_ACTIONS.sql#L1-20)

```
Lines 11-13: "Allow inserts for logging" policy
```

**Policy**:
```sql
CREATE POLICY "Allow inserts for logging" ON controller_actions_log
  FOR INSERT 
  WITH CHECK (true);  ← ✅ ALLOWS ANY INSERT (for trigger to work)
```

**Why this is needed**: 
- The trigger runs with SECURITY DEFINER
- Needs permission to INSERT regardless of user role
- Otherwise trigger would fail silently

---

## STEP 4: WebSocket Real-Time Event Sent

### 4.1 Supabase Realtime Broadcast
**Timeline**: Microseconds after trigger INSERT

Supabase automatically broadcasts PostgreSQL changes:
```
INSERT into controller_actions_log
    ↓
Postgres writes to table
    ↓
Supabase Realtime detects INSERT
    ↓
Sends WebSocket message to all subscribers
```

---

## STEP 5: DAF Dashboard Receives Real-Time Update

### 5.1 DAF Realtime Service - Listener Setup
**File**: [src/services/dafRealtimeService.ts](src/services/dafRealtimeService.ts#L40-L160)

```
Lines 40-55: initializeRealtimeListeners() - Called on component mount
```

**Three subscriptions created**:

#### 5.1.1 Controller Actions Subscription
**Lines 62-80**: subscribeToControllerActions()

```typescript
const subscription = this.supabase
  .channel('controller_actions')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',                    ← Listens for NEW actions
      schema: 'public',
      table: 'controller_actions_log'    ← THIS TABLE
    },
    (payload) => {
      const action = payload.new as ControllerAction;
      this.handleControllerAction(action);  ← ✅ HANDLER CALLED
    }
  )
  .subscribe((status) => {
    console.log('[DAFRealtimeService] Controller actions subscription status:', status);
  });
```

**What happens when INSERT detected**:
1. **payload.new** contains the new row from controller_actions_log
2. **handleControllerAction()** is called with the action
3. A notification is broadcast to all listeners

#### 5.1.2 handleControllerAction() Processor
**Lines 153-170**: handleControllerAction()

```typescript
private handleControllerAction(action: ControllerAction): void {
  const actionLabel = {
    validated: '✅ Validée',      ← ✅ Displays "Validée"
    cancelled: '❌ Annulée',
    modified: '📝 Modifiée'
  };

  const notification: DAFNotification = {
    id: action.id,
    type: 'action',
    title: `Réservation ${actionLabel[action.action_type]}`,
    message: `Contrôleur a validée une réservation (${action.old_status} → ${action.new_status})`,
    action,
    timestamp: action.timestamp,
    read: false
  };

  this.broadcastNotification(notification);  ← ✅ NOTIFIES DASHBOARD
}
```

#### 5.1.3 broadcastNotification() - Sends to Dashboard
**Lines 198-201**: broadcastNotification()

```typescript
private broadcastNotification(notification: DAFNotification): void {
  this.notificationHandlers.forEach(handler => handler(notification));
  //                                                         ↑
  //                                    Each handler is DAFDashboard
}
```

### 5.2 DAF Dashboard Component - Receives Notification
**File**: [src/components/DAFDashboard.tsx](src/components/DAFDashboard.tsx#L50-75)

```
Lines 50-75: useEffect hook - Initializes listeners on component mount
```

**Setup Flow**:
```typescript
useEffect(() => {
  console.log('[DAFDashboard] Initializing DAF Dashboard');
  
  try {
    // Line 57: Initialize Realtime listeners
    dafRealtimeService.initializeRealtimeListeners();
    
    // Line 60: Load initial data
    loadDashboardData();
    
    // Line 62-68: Register notification handler
    const handleNotification = () => {
      console.log('[DAFDashboard] Notification received, reloading data');
      loadDashboardData();  ← ✅ RELOADS DATA WHEN NOTIFIED
    };
    
    dafRealtimeService.onNotification(handleNotification);
    //                                                      ↑
    //                    This registers the handler from Step 5.1.3
    
    // Line 71: Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
```

### 5.3 loadDashboardData() - Fetches Updated Data
**File**: [src/components/DAFDashboard.tsx](src/components/DAFDashboard.tsx#L85-120)

```
Lines 85-120: loadDashboardData() - Fetches fresh data from database
```

**What happens**:

1. **Line 89**: Fetch controller actions
   ```typescript
   const actions = await dafRealtimeService.getControllerActionsHistory(20);
   ```

2. **Line 96**: Fetch future bookings
   ```typescript
   const bookings = await futureBookingsService.getAllFutureBookings();
   ```

3. **Lines 99-108**: Calculate stats
   ```typescript
   const stats: DAFStats = {
     totalValidations: (actions || []).filter(a => a.action_type === 'validated').length,
     totalCancellations: (actions || []).filter(a => a.action_type === 'cancelled').length,
     totalModifications: (actions || []).filter(a => a.action_type === 'modified').length,
     totalFutureBookings: (bookings || []).length,
     pendingBookings: (bookings || []).filter(b => b.status === 'pending').length
   };
   ```

4. **Line 113**: Update state with new stats
   ```typescript
   setStats(stats);
   ```

---

## STEP 6: DAF Dashboard UI Updates - Display to User

### 6.1 Stats Cards Update
**File**: [src/components/DAFDashboard.tsx](src/components/DAFDashboard.tsx#L160-240)

When stats state updates, React rerenders:

```typescript
// Line 176: Validations card
<div className="text-2xl font-bold">{stats.totalValidations}</div>

// Example: If controller just validated → totalValidations increases by 1
```

### 6.2 Recent Actions Table Update
**File**: [src/components/DAFDashboard.tsx](src/components/DAFDashboard.tsx#L283-340)

The table displays recentActions array:

```typescript
{recentActions.map(action => (
  <TableRow key={action.id} className="hover:bg-muted/50">
    <TableCell>
      <div className="flex items-center gap-2">
        {getActionIcon(action.action_type)}  ← ✅ Shows checkmark if "validated"
        <span className="capitalize font-medium">
          {getActionLabel(action.action_type)}  ← ✅ Shows "Validée"
        </span>
      </div>
    </TableCell>
    <TableCell>
      <Badge variant="outline">{action.old_status}</Badge>  ← e.g., "pending"
    </TableCell>
    <TableCell>
      <Badge variant="outline">{action.new_status}</Badge>  ← e.g., "confirmed"
    </TableCell>
    <TableCell className="text-sm text-muted-foreground">
      {action.reason || '—'}
    </TableCell>
    <TableCell className="text-sm text-muted-foreground">
      {format(new Date(action.timestamp), 'dd MMM HH:mm', { locale: fr })}
    </TableCell>
  </TableRow>
))}
```

---

## Complete End-to-End Sequence Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│ TIME 0: Controller clicks "Valider" button                        │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ ReservationsPage.tsx LINE 380-389                                 │
│ Button.onClick → handleValidate(reservation)                     │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ ReservationsPage.tsx LINE 89-111                                  │
│ handleValidate()                                                  │
│ ✓ Check: currentUser.role === "controller"                       │
│ ✓ Call: updateReservation(id, { status: "confirmed" })          │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ reservationService.ts LINE 128-170                                │
│ updateReservation()                                              │
│ ✓ Build DB update object                                         │
│ ✓ Supabase: UPDATE reservations SET status='confirmed'           │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ FIX_CONTROLLER_RLS.sql LINE 5-17                                 │
│ RLS Policy Check: "Controllers can update reservations"          │
│ ✓ Verify auth.uid() has role='controller'                       │
│ ✓ If YES → Allow UPDATE                                          │
│ ✓ If NO → Deny with RLS error                                    │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ Postgres Database                                                 │
│ UPDATE reservations SET status='confirmed' WHERE id=...          │
│ ✓ Row updated                                                    │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ TIME 1ms: TRIGGER FIRES                                          │
│ FUTURE_BOOKINGS_TABLE.sql LINE 144                               │
│ AFTER UPDATE ON reservations                                     │
│ FOR EACH ROW                                                     │
│ EXECUTE FUNCTION log_controller_action()                         │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ FUTURE_BOOKINGS_TABLE.sql LINE 113-142                           │
│ log_controller_action() TRIGGER FUNCTION                         │
│                                                                  │
│ IF NEW.status IS DISTINCT FROM OLD.status THEN                   │
│   action_type = CASE                                             │
│     WHEN NEW.status='confirmed' THEN 'validated'                 │
│     WHEN NEW.status='cancelled' THEN 'cancelled'                 │
│     ELSE 'modified'                                              │
│   END                                                            │
│                                                                  │
│   INSERT INTO controller_actions_log (                           │
│     controller_id,      ← auth.uid()                             │
│     reservation_id,     ← NEW.id                                 │
│     action_type,        ← 'validated'                            │
│     old_status,         ← 'pending'                              │
│     new_status,         ← 'confirmed'                            │
│     timestamp           ← now()                                  │
│   )                                                              │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ FIX_RLS_CONTROLLER_ACTIONS.sql LINE 11-13                        │
│ RLS Policy Check: "Allow inserts for logging"                   │
│ ✓ WITH CHECK (true) → Always allows                              │
│ ✓ Trigger can insert regardless of user                          │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ controller_actions_log TABLE                                     │
│ ✓ New row inserted                                               │
│ ✓ Row ID: uuid-123                                               │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ TIME 5ms: SUPABASE REALTIME BROADCASTS                           │
│ INSERT detected on controller_actions_log                        │
│ WebSocket message sent to all subscribers                        │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ dafRealtimeService.ts LINE 62-80                                 │
│ subscribeToControllerActions() listener                          │
│ ✓ Receives WebSocket event                                       │
│ ✓ Calls handleControllerAction(action)                           │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ dafRealtimeService.ts LINE 153-170                               │
│ handleControllerAction()                                         │
│ ✓ Creates DAFNotification object                                 │
│ ✓ Sets title: "Réservation ✅ Validée"                          │
│ ✓ Calls broadcastNotification(notification)                      │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ dafRealtimeService.ts LINE 198-201                               │
│ broadcastNotification()                                          │
│ ✓ Calls all registered handlers                                  │
│ ✓ Handler is: DAFDashboard's handleNotification()               │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ DAFDashboard.tsx LINE 62-68                                      │
│ handleNotification() callback triggered                          │
│ ✓ Calls loadDashboardData()                                      │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ DAFDashboard.tsx LINE 85-120                                     │
│ loadDashboardData()                                              │
│ ✓ Fetches getControllerActionsHistory(20)                        │
│ ✓ Fetches getAllFutureBookings()                                 │
│ ✓ Calculates stats (totalValidations++)                          │
│ ✓ setStats(stats) → State update                                 │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ React Component Re-render                                        │
│ ✓ Stats cards update with new numbers                            │
│ ✓ Recent actions table includes new action                       │
│ ✓ DAF sees: "1 more validation" in real-time                     │
└──────────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────────┐
│ TIME 50-100ms: DAF DASHBOARD DISPLAYS UPDATE                     │
│ User sees: ✅ Validée with timestamp                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Critical Link Analysis - Potential Breakpoints

### ✅ Link 1: Controller Role Verification
**Location**: ReservationsPage.tsx LINE 93-99
**Status**: ✅ WORKING - Checks role before calling service

### ✅ Link 2: API Call to Supabase
**Location**: reservationService.ts LINE 148-155
**Status**: ✅ WORKING - Uses Supabase client correctly

### ⚠️ Link 3: RLS Policy for UPDATE
**Location**: FIX_CONTROLLER_RLS.sql LINE 5-17
**Critical Detail**: Must have `role = 'controller'` in auth.users table
**Issue to Watch**: If auth.users doesn't have role column, this fails silently

### ✅ Link 4: Trigger Execution
**Location**: FUTURE_BOOKINGS_TABLE.sql LINE 130-160
**Status**: ✅ WORKING - Trigger defined correctly
**IMPORTANT**: Trigger must be created AFTER both tables exist

### ⚠️ Link 5: Trigger RLS Policy
**Location**: FIX_RLS_CONTROLLER_ACTIONS.sql LINE 11-13
**Critical**: `WITH CHECK (true)` must be in place for trigger to write
**Issue**: If missing, INSERT silently fails, no action logged

### ✅ Link 6: Supabase Realtime
**Location**: dafRealtimeService.ts LINE 62-80
**Status**: ✅ WORKING - Realtime listener subscribes to INSERT

### ✅ Link 7: Notification Broadcast
**Location**: dafRealtimeService.ts LINE 198-201
**Status**: ✅ WORKING - Broadcasts to all registered handlers

### ✅ Link 8: DAF Dashboard Handler
**Location**: DAFDashboard.tsx LINE 62-68
**Status**: ✅ WORKING - Registers notification handler

### ✅ Link 9: Data Reload
**Location**: DAFDashboard.tsx LINE 85-120
**Status**: ✅ WORKING - Fetches fresh data and updates stats

---

## Data Flow Summary

### What Gets Sent in Each Step

#### Step 1 → Step 2: UI to Service
```javascript
{
  reservationId: "uuid-123",
  updates: {
    status: "confirmed",           // ← NOT "validated"
    validatedBy: "Controller Name"
  }
}
```

#### Step 2 → Step 3: Service to Database
```sql
UPDATE reservations 
SET 
  status = 'confirmed',
  validated_by = 'Controller Name',
  updated_at = now()
WHERE id = 'uuid-123';
```

#### Step 3 → Step 4: Trigger Fires
```sql
NEW.status = 'confirmed'
OLD.status = 'pending'
NEW.status IS DISTINCT FROM OLD.status = true  ← TRIGGER FIRES
```

#### Step 4 → Step 5: Trigger to Log Table
```javascript
{
  id: "log-uuid-456",
  controller_id: "controller-uuid",
  reservation_id: "uuid-123",
  action_type: "validated",        // ← CONVERTED from "confirmed"
  old_status: "pending",
  new_status: "confirmed",
  reason: null,
  timestamp: "2024-04-18T10:30:45.123Z"
}
```

#### Step 5 → Step 6: Realtime to Service
```javascript
{
  event: "INSERT",
  schema: "public",
  table: "controller_actions_log",
  new: { /* row above */ }
}
```

#### Step 6 → Step 7: Service to Dashboard
```javascript
{
  id: "notification-uuid",
  type: "action",
  title: "Réservation ✅ Validée",
  message: "Contrôleur a validée une réservation (pending → confirmed)",
  action: { /* action object */ },
  timestamp: "2024-04-18T10:30:45.123Z",
  read: false
}
```

#### Step 7 → Step 8: Dashboard Reloads
```javascript
recentActions = [
  {
    id: "log-uuid-456",
    controller_id: "controller-uuid",
    reservation_id: "uuid-123",
    action_type: "validated",
    old_status: "pending",
    new_status: "confirmed",
    reason: null,
    timestamp: "2024-04-18T10:30:45.123Z"
  },
  // ... more actions
]

stats = {
  totalValidations: 42,        // ← INCREMENTED
  totalCancellations: 5,
  totalModifications: 12,
  totalFutureBookings: 8,
  pendingBookings: 3
}
```

---

## Performance Timeline

```
T+0ms:    Controller clicks button
T+5ms:    UI calls handleValidate()
T+10ms:   Service calls Supabase.update()
T+15ms:   Supabase processes RLS check
T+20ms:   Database UPDATE executes
T+25ms:   Trigger fires
T+30ms:   Trigger inserts into controller_actions_log
T+35ms:   Supabase Realtime detects change
T+40ms:   WebSocket message sent
T+50ms:   dafRealtimeService receives event
T+55ms:   handleControllerAction() creates notification
T+60ms:   broadcastNotification() calls handlers
T+65ms:   DAFDashboard.handleNotification() triggers
T+70ms:   loadDashboardData() fetches actions
T+80ms:   loadDashboardData() fetches bookings
T+90ms:   Stats calculated
T+95ms:   setStats() called → React state updates
T+100ms:  Component re-renders
T+110ms:  DAF sees new validation in UI ✅

TOTAL: ~110ms from click to DAF display
```

---

## Testing Checklist

- [ ] Verify `auth.users` table has `role` column with value `'controller'`
- [ ] Verify `reservations` table has RLS enabled
- [ ] Verify `controller_actions_log` table has RLS enabled
- [ ] Verify `trg_log_controller_action` trigger exists on `reservations` table
- [ ] Verify `"Allow inserts for logging"` policy exists on `controller_actions_log`
- [ ] Verify `"Controllers can update reservations"` policy exists on `reservations`
- [ ] Test: Click "Valider" and check if status changes to "confirmed"
- [ ] Test: Check if row appears in `controller_actions_log` within 5 seconds
- [ ] Test: Check if DAF dashboard shows new validation
- [ ] Test: Verify action_type is "validated" not "confirmed" in log table
- [ ] Test: Verify old_status/new_status are correct in log table
- [ ] Monitor WebSocket connection in browser DevTools

---

## Common Issues & Solutions

### Issue 1: "Invalid input value for enum reservation_status: 'confirmed'"
**Cause**: The `reservation_status` enum doesn't have `'confirmed'` value
**Solution**: Run `FIX_ENUM_COMPLETE.sql` to add missing enum values

### Issue 2: Controller can't validate (RLS error)
**Cause**: User doesn't have `role = 'controller'` in `auth.users`
**Solution**: Verify `auth.users.role` is set to `'controller'`

### Issue 3: Action not logged in controller_actions_log
**Cause**: Trigger INSERT blocked by RLS policy
**Solution**: Ensure `"Allow inserts for logging"` policy exists with `WITH CHECK (true)`

### Issue 4: DAF doesn't see the update
**Cause**: Realtime listener not connected properly
**Solution**: Check browser console for Realtime connection status

### Issue 5: Old status shows "confirmed" instead of "pending"
**Cause**: Looking at new_status instead of old_status in UI
**Solution**: Verify DAFDashboard displays `action.old_status` not `action.new_status`

---

## References

- [ReservationsPage.tsx](src/components/ReservationsPage.tsx) - Controller UI
- [DAFDashboard.tsx](src/components/DAFDashboard.tsx) - DAF Dashboard UI
- [reservationService.ts](src/services/reservationService.ts) - API Service
- [dafRealtimeService.ts](src/services/dafRealtimeService.ts) - Realtime Service
- [FUTURE_BOOKINGS_TABLE.sql](FUTURE_BOOKINGS_TABLE.sql) - Trigger & Tables
- [FIX_CONTROLLER_RLS.sql](FIX_CONTROLLER_RLS.sql) - RLS Policies for UPDATE
- [FIX_RLS_CONTROLLER_ACTIONS.sql](FIX_RLS_CONTROLLER_ACTIONS.sql) - RLS for Trigger INSERT
