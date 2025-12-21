# 📱 Push Notifications Setup Guide

This guide explains how to set up and use web push notifications in your Home Hub Manager app.

## Overview

The app supports browser push notifications that work even when the app is closed. Users can enable/disable them in Settings.

## Setup Steps

### 1. Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them once:

```bash
# Install web-push (one time)
npm install -g web-push

# Generate keys
node scripts/generate-vapid-keys.js
```

This will:
- Generate public and private VAPID keys
- Add them to your `.env` file automatically

### 2. Add to Environment Variables

Make sure your `.env` has:
```
VITE_VAPID_PUBLIC_KEY="your-public-key-here"
SUPABASE_VAPID_PRIVATE_KEY="your-private-key-here"
```

⚠️ **Keep the private key SECRET!** Never commit it to git.

### 3. Database Setup

The `push_subscriptions` table is created automatically when you run `setup-database.sql`.

### 4. User Enable Notifications

Users can enable push notifications:
1. Go to Settings → Notifications
2. Toggle "Push Notifications" ON
3. Browser will prompt for permission
4. Once granted, notifications are enabled

## How It Works

1. **User subscribes**: When they enable push notifications, their browser subscription is saved to `push_subscriptions` table
2. **Notification created**: When a notification is created in the database (via your app logic)
3. **Push sent**: A Supabase Edge Function or your backend sends the push notification
4. **User receives**: Browser shows the notification even if app is closed

## Sending Push Notifications

### Option 1: Supabase Edge Function (Recommended)

1. Deploy the example function:
   ```bash
   supabase functions deploy send-push-notification
   ```

2. Call it when creating a notification:
   ```typescript
   // After creating a notification in the database
   await supabase.functions.invoke('send-push-notification', {
     body: { notification }
   });
   ```

### Option 2: Database Trigger

Create a PostgreSQL trigger that automatically calls the Edge Function when a notification is inserted:

```sql
CREATE OR REPLACE FUNCTION notify_push()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_key')
    ),
    body := jsonb_build_object('notification', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_push();
```

### Option 3: Custom Backend

You can use any backend service to send push notifications:
- Firebase Cloud Messaging
- OneSignal
- Pusher Beams
- Custom Node.js server with `web-push` library

## Testing

1. Enable push notifications in Settings
2. Grant browser permission
3. Create a test notification in your database
4. You should receive a browser notification

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop)
- ✅ Safari (macOS 16.4+, iOS 16.4+)
- ❌ Safari (older versions)

## Troubleshooting

### "Push notifications are not configured"
- Make sure `VITE_VAPID_PUBLIC_KEY` is set in your `.env` file
- Restart your dev server after adding the key

### "Service Worker registration failed"
- Make sure `public/sw.js` exists
- Check browser console for errors
- Ensure you're using HTTPS (or localhost for development)

### Notifications not received
- Check browser notification permissions
- Verify subscription is saved in `push_subscriptions` table
- Check Edge Function logs in Supabase dashboard
- Ensure VAPID keys are correct

### "Permission denied"
- User needs to manually enable notifications in browser settings
- Some browsers require user interaction (button click) before requesting permission

## Security Notes

- VAPID private key must be kept secret
- Only store it in environment variables, never in code
- Use service role key for Edge Functions, not anon key
- Validate user permissions before sending notifications

## Next Steps

1. Set up VAPID keys
2. Test push notifications
3. Integrate with your notification creation logic
4. Customize notification content and behavior

