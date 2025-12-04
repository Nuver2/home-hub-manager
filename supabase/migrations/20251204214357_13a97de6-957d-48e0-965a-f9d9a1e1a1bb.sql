-- =============================================
-- HOUSEHOLD STAFF MANAGEMENT DATABASE SCHEMA
-- =============================================

-- 1. CREATE ENUMS
-- =============================================

-- Role enum (critical for security)
CREATE TYPE public.app_role AS ENUM ('parent', 'driver', 'chef', 'cleaner', 'other');

-- Task enums
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('to_do', 'in_progress', 'completed', 'on_hold');
CREATE TYPE public.task_category AS ENUM ('cleaning', 'kitchen', 'driving', 'shopping', 'maintenance', 'other');

-- Shopping list enums
CREATE TYPE public.shopping_list_status AS ENUM ('draft', 'assigned', 'in_progress', 'delivered', 'waiting_confirmation', 'completed', 'returned_for_fix');
CREATE TYPE public.item_status AS ENUM ('pending', 'found', 'not_found', 'alternative');
CREATE TYPE public.chef_confirmation AS ENUM ('pending', 'ok', 'not_ok');

-- Other enums
CREATE TYPE public.suggestion_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.notification_type AS ENUM ('task_assigned', 'task_status_changed', 'shopping_list_assigned', 'shopping_list_status_changed', 'suggestion_approved', 'suggestion_rejected', 'new_comment');

-- 2. CREATE TABLES
-- =============================================

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  profile_picture TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User roles table (CRITICAL: separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'to_do',
  category public.task_category NOT NULL DEFAULT 'other',
  due_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  attachments TEXT[],
  assigned_roles public.app_role[],
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Task assignments (many-to-many: tasks to users)
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, user_id)
);

-- Shopping lists table
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  status public.shopping_list_status NOT NULL DEFAULT 'draft',
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Shopping list items table
CREATE TABLE public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  details TEXT,
  status public.item_status NOT NULL DEFAULT 'pending',
  driver_comment TEXT,
  driver_attachment TEXT,
  chef_confirmation public.chef_confirmation NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Suggestions table
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.suggestion_status NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT comment_target CHECK (task_id IS NOT NULL OR shopping_list_id IS NOT NULL)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type public.notification_type NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT CHECK (related_type IN ('task', 'shopping_list', 'suggestion')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Activity log table
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('task', 'shopping_list', 'suggestion', 'user', 'project')),
  target_id UUID NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. CREATE SECURITY DEFINER FUNCTION
-- =============================================

-- Function to check if user has a specific role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
-- =============================================

-- PROFILES POLICIES
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Parents can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'parent'));

-- USER ROLES POLICIES
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Parents can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'));

-- PROJECTS POLICIES (Parent only)
CREATE POLICY "Parents can manage projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'));

CREATE POLICY "All users can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (TRUE);

-- TASKS POLICIES
CREATE POLICY "Parents can manage all tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Users can view assigned tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent') OR
    id IN (SELECT task_id FROM public.task_assignments WHERE user_id = auth.uid()) OR
    public.get_user_role(auth.uid()) = ANY(assigned_roles)
  );

CREATE POLICY "Users can update assigned tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent') OR
    id IN (SELECT task_id FROM public.task_assignments WHERE user_id = auth.uid()) OR
    public.get_user_role(auth.uid()) = ANY(assigned_roles)
  );

-- TASK ASSIGNMENTS POLICIES
CREATE POLICY "Parents can manage task assignments"
  ON public.task_assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Users can view own assignments"
  ON public.task_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'parent'));

-- SHOPPING LISTS POLICIES
CREATE POLICY "Parents can manage all shopping lists"
  ON public.shopping_lists FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Chefs can create shopping lists"
  ON public.shopping_lists FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'chef') OR public.has_role(auth.uid(), 'parent'));

CREATE POLICY "Users can view relevant shopping lists"
  ON public.shopping_lists FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent') OR
    created_by = auth.uid() OR
    assigned_to = auth.uid()
  );

CREATE POLICY "Chefs can update own lists"
  ON public.shopping_lists FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'parent') OR
    created_by = auth.uid() OR
    assigned_to = auth.uid()
  );

-- SHOPPING LIST ITEMS POLICIES
CREATE POLICY "Users can view shopping list items"
  ON public.shopping_list_items FOR SELECT
  TO authenticated
  USING (
    shopping_list_id IN (
      SELECT id FROM public.shopping_lists 
      WHERE public.has_role(auth.uid(), 'parent') OR created_by = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Parents and chefs can manage items"
  ON public.shopping_list_items FOR INSERT
  TO authenticated
  WITH CHECK (
    shopping_list_id IN (
      SELECT id FROM public.shopping_lists 
      WHERE public.has_role(auth.uid(), 'parent') OR created_by = auth.uid()
    )
  );

CREATE POLICY "Drivers can update item status"
  ON public.shopping_list_items FOR UPDATE
  TO authenticated
  USING (
    shopping_list_id IN (
      SELECT id FROM public.shopping_lists 
      WHERE public.has_role(auth.uid(), 'parent') OR created_by = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Parents can delete items"
  ON public.shopping_list_items FOR DELETE
  TO authenticated
  USING (
    shopping_list_id IN (
      SELECT id FROM public.shopping_lists 
      WHERE public.has_role(auth.uid(), 'parent') OR created_by = auth.uid()
    )
  );

-- SUGGESTIONS POLICIES
CREATE POLICY "All users can view suggestions"
  ON public.suggestions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent') OR created_by = auth.uid());

CREATE POLICY "Non-parents can create suggestions"
  ON public.suggestions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own suggestions"
  ON public.suggestions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent') OR created_by = auth.uid());

CREATE POLICY "Users can delete own suggestions"
  ON public.suggestions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent') OR created_by = auth.uid());

-- COMMENTS POLICIES
CREATE POLICY "Users can view comments on accessible items"
  ON public.comments FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'parent'));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- ACTIVITY LOG POLICIES
CREATE POLICY "Parents can view all activity"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'parent'));

CREATE POLICY "System can create activity logs"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- 6. CREATE UPDATED_AT TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON public.shopping_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at
  BEFORE UPDATE ON public.shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at
  BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_task_assignments_user_id ON public.task_assignments(user_id);
CREATE INDEX idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX idx_shopping_lists_status ON public.shopping_lists(status);
CREATE INDEX idx_shopping_lists_created_by ON public.shopping_lists(created_by);
CREATE INDEX idx_shopping_lists_assigned_to ON public.shopping_lists(assigned_to);
CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items(shopping_list_id);
CREATE INDEX idx_suggestions_status ON public.suggestions(status);
CREATE INDEX idx_suggestions_created_by ON public.suggestions(created_by);
CREATE INDEX idx_comments_task_id ON public.comments(task_id);
CREATE INDEX idx_comments_shopping_list_id ON public.comments(shopping_list_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_target_type ON public.activity_log(target_type);

-- 8. ENABLE REALTIME FOR KEY TABLES
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list_items;