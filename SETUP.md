# 🏠 Home Hub Manager - Setup Guide

## Quick Setup for New Supabase Project

### Step 1: Set Up Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open the file `setup-database.sql` in this project
6. Copy **ALL** the SQL code
7. Paste it into the Supabase SQL Editor
8. Click **Run** (or press Cmd/Ctrl + Enter)

✅ You should see "Success. No rows returned" - this means all tables, policies, and functions were created!

### Step 2: Add Service Role Key to .env

1. In Supabase Dashboard, go to **Settings** → **API**
2. Find the **service_role** key (it's a secret key, different from the anon key)
3. Copy it
4. Add this line to your `.env` file:
   ```
   SUPBASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

### Step 3: Create Admin Account

Run this command:
```bash
npm run create-admin
```

Enter:
- **Email**: Your admin email
- **Password**: Min 8 chars, must include uppercase, lowercase, and number
- **Full Name**: Your name
- **Username**: Your username

✅ Done! You can now log in to your app.

---

## Troubleshooting

### "Could not find the table 'public.profiles'"
→ You haven't run Step 1 yet. Run the SQL setup first!

### "SUPBASE_SERVICE_ROLE_KEY not found"
→ You haven't added the service role key to your `.env` file. Do Step 2.

### "Email already exists"
→ The user was created but profile/role failed. You can either:
- Use a different email
- Or manually create the profile in Supabase Dashboard

---

## Step 4: Set Up Push Notifications (Optional)

To enable browser push notifications:

1. **Generate VAPID Keys:**
   ```bash
   # Install web-push globally (one time)
   npm install -g web-push
   
   # Generate keys
   node scripts/generate-vapid-keys.js
   ```

2. **Add keys to .env:**
   The script will automatically add them, or add manually:
   ```
   VITE_VAPID_PUBLIC_KEY="your-public-key"
   SUPBASE_VAPID_PRIVATE_KEY="your-private-key"
   ```

3. **Enable in Settings:**
   - Users can enable push notifications in Settings → Notifications
   - They'll be prompted to allow notifications in their browser

4. **Send Push Notifications:**
   - Create a Supabase Edge Function to send push notifications
   - Or use a service like OneSignal, Firebase Cloud Messaging, etc.

---

## What Gets Created

The SQL setup creates:
- ✅ All database tables (profiles, tasks, shopping_lists, push_subscriptions, etc.)
- ✅ All enums (app_role, task_status, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Security functions
- ✅ Triggers for updated_at timestamps
- ✅ Indexes for performance
- ✅ Realtime subscriptions

