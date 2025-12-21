# Deploy Supabase Edge Function

The `create-user` Edge Function needs to be deployed to your Supabase project to enable staff creation.

## Option 1: Deploy via Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase Dashboard → Settings → General → Reference ID)

4. **Deploy the function**:
   ```bash
   supabase functions deploy create-user
   ```

5. **Set environment variables** (if not already set):
   ```bash
   supabase secrets set SUPBASE_URL=your-supabase-url
   supabase secrets set SUPBASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Option 2: Deploy via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** in the sidebar
3. Click **Create a new function**
4. Name it: `create-user`
5. Copy the contents of `supabase/functions/create-user/index.ts`
6. Paste it into the function editor
7. Click **Deploy**

**Important**: After deploying, you need to set the environment variables:
- Go to **Edge Functions** → **Settings** → **Secrets**
- Add:
  - `SUPBASE_URL` = Your Supabase project URL
  - `SUPBASE_SERVICE_ROLE_KEY` = Your service role key (from Settings → API)

## Verify Deployment

After deploying, test the function:
1. Go to your app
2. Try to create a staff member
3. Check the browser console - you should no longer see 404 errors

## Troubleshooting

### Still getting 404?
- Make sure the function name is exactly `create-user` (case-sensitive)
- Verify the function is deployed in your Supabase Dashboard
- Check that you're using the correct Supabase project

### Getting CORS errors?
- The function includes CORS headers, but make sure it's deployed correctly
- Check Supabase Dashboard → Edge Functions → `create-user` → Logs

### Getting authentication errors?
- Make sure you're logged in as a parent user
- Verify the function has access to `SUPBASE_SERVICE_ROLE_KEY` secret

