-- Add recurring task support
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly'));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER NOT NULL DEFAULT 1; -- e.g., every 2 weeks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE; -- For tracking recurring task instances

-- Index for recurring tasks
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON public.tasks(is_recurring, parent_task_id) WHERE is_recurring = TRUE;

