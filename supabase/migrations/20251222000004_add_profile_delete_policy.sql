-- Add DELETE policy for profiles (parents only)
CREATE POLICY "Parents can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'));

