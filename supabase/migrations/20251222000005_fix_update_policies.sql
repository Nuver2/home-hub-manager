-- Fix UPDATE policies to include WITH CHECK clause
-- UPDATE operations require both USING (for existing rows) and WITH CHECK (for modified rows)

-- Fix tasks UPDATE policy
DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.tasks;

CREATE POLICY "Users can update assigned tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent') OR
    id IN (SELECT task_id FROM public.task_assignments WHERE user_id = auth.uid()) OR
    (assigned_roles IS NOT NULL AND public.get_user_role(auth.uid()) IS NOT NULL AND public.get_user_role(auth.uid()) = ANY(assigned_roles))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'parent') OR
    id IN (SELECT task_id FROM public.task_assignments WHERE user_id = auth.uid()) OR
    (assigned_roles IS NOT NULL AND public.get_user_role(auth.uid()) IS NOT NULL AND public.get_user_role(auth.uid()) = ANY(assigned_roles))
  );

-- Fix shopping lists UPDATE policy
DROP POLICY IF EXISTS "Chefs can update own lists" ON public.shopping_lists;

CREATE POLICY "Chefs can update own lists"
  ON public.shopping_lists FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent') OR
    created_by = auth.uid() OR
    assigned_to = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'parent') OR
    created_by = auth.uid() OR
    assigned_to = auth.uid()
  );

-- Note: "Parents can manage all tasks" policy was already fixed in migration 20251222000003
-- It already has both USING and WITH CHECK, so it's fine for UPDATE operations

-- Fix "Parents can manage all shopping lists" policy
DROP POLICY IF EXISTS "Parents can manage all shopping lists" ON public.shopping_lists;

CREATE POLICY "Parents can manage all shopping lists"
  ON public.shopping_lists FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'))
  WITH CHECK (public.has_role(auth.uid(), 'parent'));

