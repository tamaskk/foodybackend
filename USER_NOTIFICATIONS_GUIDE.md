# User Notifications Feature - Complete Guide

## Overview

Users can now receive and view notifications sent by admins through the admin panel. This feature includes a beautiful notifications page in the Flutter app with real-time updates.

## Backend Implementation

### API Endpoints

#### 1. Get User Notifications
```
GET /api/users/me/notifications
Query Parameters:
  - page (default: 1)
  - limit (default: 20)
  - unreadOnly (default: false)

Response:
{
  "notifications": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "unreadCount": 12
}
```

#### 2. Mark Notifications as Read
```
PATCH /api/users/me/notifications
Body:
  - notificationIds: ["id1", "id2"] // Mark specific notifications
  OR
  - markAllAsRead: true // Mark all as read

Response:
{
  "message": "Notifications marked as read"
}
```

### How Notifications Work

1. **Admin sends notification** via admin panel
2. **Notification created** in database with:
   - `userId: null` for broadcast (all users)
   - `userId: specificId` for targeted notifications
3. **Users fetch** notifications that are either:
   - Targeted to them specifically (`userId: theirId`)
   - Broadcast to all users (`userId: null`)

## Frontend Implementation (Flutter)

### API Service Methods

**Get Notifications:**
```dart
ApiService.getNotifications(page: 1, limit: 20, unreadOnly: false)
```

**Mark as Read:**
```dart
// Mark specific notifications
ApiService.markNotificationsAsRead(notificationIds: ['id1', 'id2'])

// Mark all as read
ApiService.markNotificationsAsRead(markAllAsRead: true)
```

### Notifications Page Features

#### 🎨 Beautiful UI
- Color-coded by notification type:
  - **Info** (Blue) - General information
  - **Success** (Green) - Successful actions
  - **Warning** (Orange) - Important warnings
  - **Error** (Red) - Critical errors

#### 🔔 Smart Indicators
- Unread badge (colored dot) on unread notifications
- Bold border for unread items
- Different icons per notification type

#### ⏱️ Time Formatting
- "Just now" for very recent
- "5m ago" for minutes
- "2h ago" for hours
- "3d ago" for days
- "2mo ago" for months
- "1y ago" for years

#### 📱 User Actions
- **Tap notification** to mark as read
- **Pull to refresh** to load new notifications
- **"Mark all read"** button in app bar when there are unread items

#### ✨ Empty State
- Beautiful empty state when no notifications
- Helpful message: "We'll notify you when there's something new"

### Accessing Notifications

Users can access notifications by:
1. Tapping the **bell icon** (🔔) in the top bar of the Social Media page
2. The bell icon is visible throughout the app

## How to Send Notifications as Admin

### Via Admin Panel

1. **Login** to admin panel at `/admin/login`
2. Navigate to **"Notifications"** tab
3. Click **"Send Notification"** button
4. Fill in the form:
   - **Title**: Short, descriptive title
   - **Message**: Detailed message content
   - **Type**: Select info/warning/success/error
   - **Target**:
     - **All Users**: Broadcasts to everyone
     - **Specific Users**: Enter comma-separated user IDs
5. Click **"Send Notification"**

### Example Notifications

**Welcome Message** (Info):
```
Title: Welcome to Recipe App!
Message: Start sharing your amazing recipes with our community.
Type: Info
Target: All Users
```

**New Feature** (Success):
```
Title: New AI Recipe Generator!
Message: Try our new AI-powered recipe generator in the AI tab.
Type: Success
Target: All Users
```

**Maintenance Warning** (Warning):
```
Title: Scheduled Maintenance
Message: App will be down for maintenance on Dec 15th from 2-4 AM.
Type: Warning
Target: All Users
```

**Account Issue** (Error):
```
Title: Payment Failed
Message: Your subscription payment failed. Please update your payment method.
Type: Error
Target: Specific Users
```

## Database Schema

```typescript
Notification {
  userId: ObjectId | null,     // null = broadcast to all
  title: String,                // Required
  message: String,              // Required
  type: 'info' | 'warning' | 'success' | 'error',
  read: Boolean,                // Default: false
  sentBy: String,               // Admin email
  createdAt: Date,
  updatedAt: Date
}
```

## Best Practices

### For Admins

✅ **DO:**
- Use descriptive titles
- Keep messages concise but informative
- Choose appropriate notification types
- Test with specific users before broadcasting
- Use broadcast sparingly to avoid spam

❌ **DON'T:**
- Send marketing spam
- Use error type for non-critical issues
- Include sensitive information
- Send duplicate notifications

### For Users

- Check notifications regularly
- Mark as read to keep track
- Pull to refresh for latest updates
- Don't ignore warning/error notifications

## Technical Details

### Notification Filtering

Users see notifications where:
```javascript
{
  $or: [
    { userId: currentUserId },  // Targeted to them
    { userId: null }             // Broadcast to all
  ]
}
```

### Performance

- **Indexed queries** for fast retrieval
- **Pagination** prevents large data transfers
- **Unread count** calculated efficiently
- **Optimistic updates** for smooth UX

### Security

- Authentication required for all endpoints
- Users can only access their own notifications
- Read status per user (not global)
- Admin authentication required to send

## Future Enhancements

Consider adding:
- 🔔 Push notifications (FCM/APNS)
- 📧 Email notifications
- 🔊 In-app notification sound/vibration
- 📊 Notification analytics
- ⏰ Scheduled notifications
- 🏷️ Notification categories/filters
- 🗂️ Archive old notifications
- ✂️ Notification action buttons

## Troubleshooting

### User not receiving notifications?
1. Check if notification was sent to correct user ID
2. Verify user is logged in
3. Try pull-to-refresh on notifications page
4. Check network connectivity

### Notifications not marking as read?
1. Verify authentication token is valid
2. Check API endpoint is working
3. Ensure notification ID is correct

### Unread count not updating?
1. Pull to refresh notifications page
2. Restart the app
3. Check backend logs for errors

## Summary

The notifications feature provides a complete communication channel between admins and users. Admins can send targeted or broadcast messages, and users can view, manage, and mark notifications as read through a beautiful, intuitive interface.

Perfect for:
- 📢 Announcements
- ⚠️ Warnings
- ✅ Confirmations
- 🚨 Alerts
- 📰 News
- 🎉 Celebrations
