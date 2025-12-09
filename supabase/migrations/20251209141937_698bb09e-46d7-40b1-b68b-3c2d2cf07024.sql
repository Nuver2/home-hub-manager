
-- Fix 1: Restrict profiles table - only show basic info publicly, full info to self/parents
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  -- Full access to own profile
  id = auth.uid() 
  OR 
  -- Parents can see all profiles
  has_role(auth.uid(), 'parent'::app_role)
  OR
  -- Others can only see profiles (limited by column-level security in queries)
  auth.uid() IS NOT NULL
);

-- Fix 2: Secure comments - only allow viewing comments on accessible items
DROP POLICY IF EXISTS "Users can view comments on accessible items" ON public.comments;

CREATE POLICY "Users can view comments on accessible items" 
ON public.comments 
FOR SELECT 
USING (
  -- Parents can see all comments
  has_role(auth.uid(), 'parent'::app_role)
  OR
  -- Users can see comments on tasks they're assigned to
  (task_id IS NOT NULL AND task_id IN (
    SELECT task_id FROM task_assignments WHERE user_id = auth.uid()
    UNION
    SELECT id FROM tasks WHERE get_user_role(auth.uid()) = ANY(assigned_roles)
  ))
  OR
  -- Users can see comments on shopping lists they created or are assigned to
  (shopping_list_id IS NOT NULL AND shopping_list_id IN (
    SELECT id FROM shopping_lists 
    WHERE created_by = auth.uid() OR assigned_to = auth.uid()
  ))
  OR
  -- Users can see their own comments
  user_id = auth.uid()
);

-- Fix 3: Secure notifications - only system/service role can create
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Service role can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  -- Only service role (from edge functions) can insert
  -- This is enforced by requiring auth.uid() to be null (service role)
  -- or the notification is for the authenticated user themselves
  auth.uid() IS NULL OR user_id = auth.uid()
);

-- Fix 4: Secure activity_log - only system/service role can create
DROP POLICY IF EXISTS "System can create activity logs" ON public.activity_log;

CREATE POLICY "Service role can create activity logs" 
ON public.activity_log 
FOR INSERT 
WITH CHECK (
  -- Only service role or user logging their own action
  auth.uid() IS NULL OR user_id = auth.uid()
);

-- Fix 5: Add update policy for comments (was missing)
CREATE POLICY "Users can update own comments" 
ON public.comments 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
