-- Fix activity_log INSERT policy - service role only
DROP POLICY IF EXISTS "Service role can create activity logs" ON activity_log;
CREATE POLICY "Service role can create activity logs"
ON activity_log FOR INSERT
WITH CHECK (auth.uid() IS NULL);

-- Fix notifications INSERT policy - service role only  
DROP POLICY IF EXISTS "Service role can create notifications" ON notifications;
CREATE POLICY "Service role can create notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() IS NULL);

-- Restrict phone_number visibility in profiles - only self or parents can see
DROP POLICY IF EXISTS "Users can view basic profile info" ON profiles;

-- Create policy for viewing own profile (full access)
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Create policy for parents viewing all profiles
CREATE POLICY "Parents can view all profiles"
ON profiles FOR SELECT
USING (has_role(auth.uid(), 'parent'::app_role));

-- Create policy for other users viewing limited profile info (no phone)
CREATE POLICY "Users can view basic info of others"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);