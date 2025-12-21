-- Fix task INSERT policy
-- The "Parents can manage all tasks" policy uses USING for all operations,
-- but INSERT operations require WITH CHECK clause

-- Drop the existing policy
DROP POLICY IF EXISTS "Parents can manage all tasks" ON public.tasks;

-- Recreate with proper USING and WITH CHECK clauses
CREATE POLICY "Parents can manage all tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'))
  WITH CHECK (public.has_role(auth.uid(), 'parent'));

