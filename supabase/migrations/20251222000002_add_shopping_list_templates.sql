-- Shopping List Templates
CREATE TABLE IF NOT EXISTS public.shopping_list_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL, -- Array of {name, quantity, details}
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shopping_list_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all templates"
  ON public.shopping_list_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create templates"
  ON public.shopping_list_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates"
  ON public.shopping_list_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON public.shopping_list_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list_templates;

