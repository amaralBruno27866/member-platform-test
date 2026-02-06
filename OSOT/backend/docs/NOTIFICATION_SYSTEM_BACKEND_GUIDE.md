# Notification System - Backend Integration Guide

## Overview
The notification system displays important messages to users in the dashboard header. This document describes the data structure and properties required from the backend API.

## Data Structure

### Notification Object

```typescript
interface Notification {
  id: string;              // Unique identifier for the notification
  message: string;         // The notification text to display
  type: 'info' | 'warning' | 'error' | 'success';  // Notification type
  dismissible?: boolean;   // Optional: whether user can dismiss the notification (default: false)
}
```

## Properties

### 1. `id` (required)
- **Type:** `string`
- **Description:** Unique identifier for the notification
- **Example:** `"notif-001"`, `"renewal-warning-123"`
- **Purpose:** Used to dismiss individual notifications and prevent duplicates

### 2. `message` (required)
- **Type:** `string`
- **Description:** The notification message displayed to the user
- **Example:** `"Your membership renewal is due in 30 days"`
- **Guidelines:**
  - Keep messages concise and clear
  - Use action-oriented language when applicable
  - Maximum recommended length: 120 characters
  - Should be user-friendly and avoid technical jargon

### 3. `type` (required)
- **Type:** `'info' | 'warning' | 'error' | 'success'`
- **Description:** Determines the visual styling and urgency level of the notification
- **Options:**

#### `info` (Blue)
- **Color Scheme:** Blue background, blue text, blue border
- **CSS Classes:** `bg-blue-50 text-blue-800 border-blue-200`
- **Use Cases:**
  - General announcements
  - New features or updates
  - Informational messages
  - Non-urgent reminders
- **Example:** `"New training materials are now available"`

#### `warning` (Yellow/Orange)
- **Color Scheme:** Yellow background, yellow text, yellow border
- **CSS Classes:** `bg-yellow-50 text-yellow-800 border-yellow-200`
- **Use Cases:**
  - Upcoming deadlines
  - Renewal reminders
  - Action required (non-critical)
  - Important but not urgent information
- **Example:** `"Your membership renewal is due in 30 days"`

#### `error` (Red)
- **Color Scheme:** Red background, red text, red border
- **CSS Classes:** `bg-red-50 text-red-800 border-red-200`
- **Use Cases:**
  - Account issues
  - Payment failures
  - Critical actions required
  - System errors affecting the user
  - Expired credentials or memberships
- **Example:** `"Your payment method needs to be updated"`

#### `success` (Green)
- **Color Scheme:** Green background, green text, green border
- **CSS Classes:** `bg-green-50 text-green-800 border-green-200`
- **Use Cases:**
  - Successful actions
  - Completed processes
  - Positive confirmations
  - Achievements
- **Example:** `"Your membership has been successfully renewed"`

### 4. `dismissible` (optional)
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Whether the user can manually dismiss/close the notification
- **Behavior:**
  - If `true`: Shows an X button to close the notification
  - If `false` or omitted: No close button, notification persists
- **Guidelines:**
  - Set to `true` for informational messages that don't require action
  - Set to `false` for critical messages that must be acknowledged
  - Set to `true` for success messages after user actions

## API Endpoint Specification

### Recommended Endpoint
```
GET /api/notifications
```

### Response Format
```json
{
  "notifications": [
    {
      "id": "notif-001",
      "message": "Your membership renewal is due in 30 days",
      "type": "warning",
      "dismissible": true
    },
    {
      "id": "notif-002",
      "message": "Please update your contact information",
      "type": "info",
      "dismissible": false
    }
  ]
}
```

### Alternative: Multiple Endpoints by User Type
```
GET /api/notifications/person
GET /api/notifications/affiliate
```

## Frontend Integration

The frontend will:
1. Fetch notifications on dashboard load
2. Display notifications in the header area
3. Handle user dismissal (if `dismissible: true`)
4. Auto-refresh notifications periodically (configurable interval)

### Current Implementation Location
- Component: `src/components/layout/NotificationBar.tsx`
- Used in: `DashboardLayout.tsx` and `AffiliateDashboardLayout.tsx`

## Example Use Cases

### Membership Renewal Warning
```json
{
  "id": "renewal-warning-456",
  "message": "Your membership expires in 15 days. Renew now to avoid interruption.",
  "type": "warning",
  "dismissible": false
}
```

### System Maintenance Notice
```json
{
  "id": "maintenance-123",
  "message": "Scheduled maintenance on Dec 15, 2025 from 2-4 AM EST",
  "type": "info",
  "dismissible": true
}
```

### Payment Issue
```json
{
  "id": "payment-error-789",
  "message": "Payment failed. Please update your payment method.",
  "type": "error",
  "dismissible": false
}
```

### Event Registration Success
```json
{
  "id": "event-success-321",
  "message": "Successfully registered for Annual Conference 2025",
  "type": "success",
  "dismissible": true
}
```

## Visual Appearance

The notification bar appears in the header with:
- Bell icon on the left
- Notification message in the center
- Close button (X) on the right (if dismissible)
- Color-coded background based on type
- Rounded corners and border
- Responsive padding

## Behavior Notes

1. **Multiple Notifications:** The system can display multiple notifications simultaneously
2. **No Notifications:** If the array is empty, nothing is displayed (no placeholder)
3. **Dismissal:** When a user dismisses a notification, it's removed from the local state (backend should track dismissed notifications to avoid showing them again)
4. **Priority:** Consider implementing a priority system if multiple notifications need ordering

## Future Enhancements (Optional)

The backend could consider adding these optional fields:
- `priority`: number (for sorting)
- `createdAt`: timestamp
- `expiresAt`: timestamp (auto-hide after date)
- `actionUrl`: string (link for "Learn More" buttons)
- `actionLabel`: string (text for action button)
- `targetUserTypes`: array (to show only to specific user types)

## Questions for Backend Team

1. Should dismissed notifications be tracked per user in the database?
2. What's the preferred refresh interval for checking new notifications?
3. Should there be a maximum number of concurrent notifications displayed?
4. Are there user preferences for notification types (e.g., opt-out of certain types)?
5. Should notifications support rich text/HTML formatting in messages?
