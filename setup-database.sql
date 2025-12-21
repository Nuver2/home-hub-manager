-- =============================================
-- HOME HUB MANAGER - COMPLETE DATABASE SETUP
-- Run this in your Supabase SQL Editor
-- =============================================

-- Migration 1: Initial Schema
-- =============================================

-- 1. CREATE ENUMS
CREATE TYPE public.app_role AS ENUM ('parent', 'driver', 'chef', 'cleaner', 'other');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('to_do', 'in_progress', 'completed', 'on_hold');
CREATE TYPE public.task_category AS ENUM ('cleaning', 'kitchen', 'driving', 'shopping', 'maintenance', 'other');
CREATE TYPE public.shopping_list_status AS ENUM ('draft', 'assigned', 'in_progress', 'delivered', 'waiting_confirmation', 'completed', 'returned_for_fix');
CREATE TYPE public.item_status AS ENUM ('pending', 'found', 'not_found', 'alternative');
CREATE TYPE public.chef_confirmation AS ENUM ('pending', 'ok', 'not_ok');
CREATE TYPE public.suggestion_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.notification_type AS ENUM ('task_assigned', 'task_status_changed', 'shopping_list_assigned', 'shopping_list_status_changed', 'suggestion_approved', 'suggestion_rejected', 'new_comment');

-- 2. CREATE TABLES
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

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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

CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, user_id)
);

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

CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.suggestion_status NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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

CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('task', 'shopping_list', 'suggestion', 'user', 'project')),
  target_id UUID NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. CREATE FUNCTIONS
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. CREATE TRIGGERS
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

-- 5. CREATE INDEXES
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

-- 6. ENABLE ROW LEVEL SECURITY
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

-- 7. CREATE RLS POLICIES
-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Parents can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'parent'::app_role));
CREATE POLICY "Users can view basic info of others" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Parents can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'parent'));

-- User Roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'parent'));
CREATE POLICY "Parents can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'parent'));

-- Projects
CREATE POLICY "Parents can manage projects" ON public.projects FOR ALL USING (public.has_role(auth.uid(), 'parent'));
CREATE POLICY "All users can view projects" ON public.projects FOR SELECT USING (TRUE);

-- Tasks
CREATE POLICY "Parents can manage all tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(), 'parent'));
CREATE POLICY "Users can view assigned tasks" ON public.tasks FOR SELECT USING (
  public.has_role(auth.uid(), 'parent') OR
  id IN (SELECT task_id FROM public.task_assignments WHERE user_id = auth.uid()) OR
  public.get_user_role(auth.uid()) = ANY(assigned_roles)
);
CREATE POLICY "Users can update assigned tasks" ON public.tasks FOR UPDATE USING (
  public.has_role(auth.uid(), 'parent') OR
  id IN (SELECT task_id FROM public.task_assignments WHERE user_id = auth.uid()) OR
  public.get_user_role(auth.uid()) = ANY(assigned_roles)
);

-- Task Assignments
CREATE POLICY "Parents can manage task assignments" ON public.task_assignments FOR ALL USING (public.has_role(auth.uid(), 'parent'));
CREATE POLICY "Users can view own assignments" ON public.task_assignments FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'parent'));

-- Shopping Lists
CREATE POLICY "Parents can manage all shopping lists" ON public.shopping_lists FOR ALL USING (public.has_role(auth.uid(), 'parent'));
CREATE POLICY "Chefs can create shopping lists" ON public.shopping_lists FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'chef') OR public.has_role(auth.uid(), 'parent'));
CREATE POLICY "Users can view relevant shopping lists" ON public.shopping_lists FOR SELECT USING (
  public.has_role(auth.uid(), 'parent') OR
  created_by = auth.uid() OR
  assigned_to = auth.uid()
);
CREATE POLICY "Chefs can update own lists" ON public.shopping_lists FOR UPDATE USING (
  public.has_role(auth.uid(), 'parent') OR
  created_by = auth.uid() OR
  assigned_to = auth.uid()
);

-- Shopping List Items
CREATE POLICY "Users can view shopping list items" ON public.shopping_list_items FOR SELECT USING (
  shopping_list_id IN (
    SELECT id FROM public.shopping_lists 
    WHERE public.has_role(auth.uid(), 'parent') OR created_by = auth.uid() OR assigned_to = auth.uid()
  )
);
CREATE POLICY "Parents and chefs can manage items" ON public.shopping_list_items FOR INSERT WITH CHECK (
  shopping_list_id IN (
    SELECT id FROM public.shopping_lists 
    WHERE public.has_role(auth.uid(), 'parent') OR created_by = auth.uid()
  )
);
CREATE POLICY "Drivers can update item status" ON public.shopping_list_items FOR UPDATE USING (
  shopping_list_id IN (
    SELECT id FROM public.shopping_lists 
    WHERE public.has_role(auth.uid(), 'parent') OR created_by = auth.uid() OR assigned_to = auth.uid()
  )
);
CREATE POLICY "Parents can delete items" ON public.shopping_list_items FOR DELETE USING (
  shopping_list_id IN (
    SELECT id FROM public.shopping_lists 
    WHERE public.has_role(auth.uid(), 'parent') OR created_by = auth.uid()
  )
);

-- Suggestions
CREATE POLICY "All users can view suggestions" ON public.suggestions FOR SELECT USING (public.has_role(auth.uid(), 'parent') OR created_by = auth.uid());
CREATE POLICY "Non-parents can create suggestions" ON public.suggestions FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own suggestions" ON public.suggestions FOR UPDATE USING (public.has_role(auth.uid(), 'parent') OR created_by = auth.uid());
CREATE POLICY "Users can delete own suggestions" ON public.suggestions FOR DELETE USING (public.has_role(auth.uid(), 'parent') OR created_by = auth.uid());

-- Comments
CREATE POLICY "Users can view comments on accessible items" ON public.comments FOR SELECT USING (
  public.has_role(auth.uid(), 'parent'::app_role)
  OR
  (task_id IS NOT NULL AND task_id IN (
    SELECT task_id FROM task_assignments WHERE user_id = auth.uid()
    UNION
    SELECT id FROM tasks WHERE get_user_role(auth.uid()) = ANY(assigned_roles)
  ))
  OR
  (shopping_list_id IS NOT NULL AND shopping_list_id IN (
    SELECT id FROM shopping_lists 
    WHERE created_by = auth.uid() OR assigned_to = auth.uid()
  ))
  OR
  user_id = auth.uid()
);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'parent'));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Activity Log
CREATE POLICY "Parents can view all activity" ON public.activity_log FOR SELECT USING (public.has_role(auth.uid(), 'parent'));
CREATE POLICY "Service role can create activity logs" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions FOR ALL USING (user_id = auth.uid());

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list_items;

-- 9. AUTOMATIC NOTIFICATIONS AND ACTIVITY LOGS
-- =============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_message TEXT;
  notification_type_val TEXT;
  related_type_val TEXT;
  related_id_val UUID;
  assigned_user_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'tasks' THEN
    related_type_val := 'task';
    related_id_val := NEW.id;
    
    IF TG_OP = 'INSERT' THEN
      notification_type_val := 'task_assigned';
      notification_message := 'New task assigned: ' || NEW.title;
      
      IF NEW.assigned_roles IS NOT NULL AND array_length(NEW.assigned_roles, 1) > 0 THEN
        FOR assigned_user_id IN 
          SELECT user_id FROM user_roles 
          WHERE role = ANY(NEW.assigned_roles)
        LOOP
          INSERT INTO notifications (user_id, type, message, related_id, related_type)
          VALUES (assigned_user_id, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
        END LOOP;
      END IF;
      
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      notification_type_val := 'task_status_changed';
      notification_message := 'Task status changed: ' || NEW.title || ' (' || OLD.status || ' → ' || NEW.status || ')';
      
      FOR assigned_user_id IN 
        SELECT user_id FROM task_assignments WHERE task_id = NEW.id
        UNION
        SELECT user_id FROM user_roles WHERE role = ANY(COALESCE(NEW.assigned_roles, ARRAY[]::app_role[]))
      LOOP
        INSERT INTO notifications (user_id, type, message, related_id, related_type)
        VALUES (assigned_user_id, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
      END LOOP;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'shopping_lists' THEN
    related_type_val := 'shopping_list';
    related_id_val := NEW.id;
    
    IF TG_OP = 'INSERT' THEN
      notification_type_val := 'shopping_list_assigned';
      notification_message := 'New shopping list assigned: ' || NEW.title;
      
      IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, related_id, related_type)
        VALUES (NEW.assigned_to, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
      END IF;
      
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      notification_type_val := 'shopping_list_status_changed';
      notification_message := 'Shopping list status changed: ' || NEW.title || ' (' || OLD.status || ' → ' || NEW.status || ')';
      
      IF NEW.created_by IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, related_id, related_type)
        VALUES (NEW.created_by, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
      END IF;
      
      IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != NEW.created_by THEN
        INSERT INTO notifications (user_id, type, message, related_id, related_type)
        VALUES (NEW.assigned_to, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
      END IF;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'suggestions' THEN
    related_type_val := 'suggestion';
    related_id_val := NEW.id;
    
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'approved' THEN
        notification_type_val := 'suggestion_approved';
        notification_message := 'Your suggestion was approved: ' || NEW.title;
      ELSIF NEW.status = 'rejected' THEN
        notification_type_val := 'suggestion_rejected';
        notification_message := 'Your suggestion was rejected: ' || NEW.title;
      END IF;
      
      IF NEW.created_by IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, related_id, related_type)
        VALUES (NEW.created_by, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
      END IF;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      notification_type_val := 'new_comment';
      
      IF NEW.task_id IS NOT NULL THEN
        related_type_val := 'task';
        related_id_val := NEW.task_id;
        SELECT title INTO notification_message FROM tasks WHERE id = NEW.task_id;
        notification_message := 'New comment on task: ' || COALESCE(notification_message, 'Task');
        
        FOR assigned_user_id IN 
          SELECT DISTINCT user_id FROM task_assignments WHERE task_id = NEW.task_id AND user_id != NEW.user_id
          UNION
          SELECT created_by FROM tasks WHERE id = NEW.task_id AND created_by IS NOT NULL AND created_by != NEW.user_id
        LOOP
          INSERT INTO notifications (user_id, type, message, related_id, related_type)
          VALUES (assigned_user_id, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
        END LOOP;
        
      ELSIF NEW.shopping_list_id IS NOT NULL THEN
        related_type_val := 'shopping_list';
        related_id_val := NEW.shopping_list_id;
        SELECT title INTO notification_message FROM shopping_lists WHERE id = NEW.shopping_list_id;
        notification_message := 'New comment on shopping list: ' || COALESCE(notification_message, 'Shopping List');
        
        FOR assigned_user_id IN 
          SELECT created_by FROM shopping_lists WHERE id = NEW.shopping_list_id AND created_by IS NOT NULL AND created_by != NEW.user_id
          UNION
          SELECT assigned_to FROM shopping_lists WHERE id = NEW.shopping_list_id AND assigned_to IS NOT NULL AND assigned_to != NEW.user_id AND assigned_to != (SELECT created_by FROM shopping_lists WHERE id = NEW.shopping_list_id)
        LOOP
          INSERT INTO notifications (user_id, type, message, related_id, related_type)
          VALUES (assigned_user_id, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
        END LOOP;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task assignments
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
BEGIN
  SELECT title INTO task_title FROM tasks WHERE id = NEW.task_id;
  
  INSERT INTO notifications (user_id, type, message, related_id, related_type)
  VALUES (
    NEW.user_id,
    'task_assigned'::notification_type,
    'You have been assigned to task: ' || COALESCE(task_title, 'Task'),
    NEW.task_id,
    'task'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity log
CREATE OR REPLACE FUNCTION create_activity_log()
RETURNS TRIGGER AS $$
DECLARE
  action_text TEXT;
  target_type_val TEXT;
  target_id_val UUID;
  user_id_val UUID;
  details_text TEXT;
BEGIN
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF TG_TABLE_NAME = 'tasks' THEN
    target_type_val := 'task';
    target_id_val := NEW.id;
    IF TG_OP = 'INSERT' THEN
      action_text := 'created';
      details_text := 'Created task: ' || NEW.title;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'updated';
      details_text := 'Updated task: ' || NEW.title;
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        details_text := details_text || ' (status: ' || OLD.status || ' → ' || NEW.status || ')';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'shopping_lists' THEN
    target_type_val := 'shopping_list';
    target_id_val := NEW.id;
    IF TG_OP = 'INSERT' THEN
      action_text := 'created';
      details_text := 'Created shopping list: ' || NEW.title;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'updated';
      details_text := 'Updated shopping list: ' || NEW.title;
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        details_text := details_text || ' (status: ' || OLD.status || ' → ' || NEW.status || ')';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'suggestions' THEN
    target_type_val := 'suggestion';
    target_id_val := NEW.id;
    IF TG_OP = 'INSERT' THEN
      action_text := 'created';
      details_text := 'Created suggestion: ' || NEW.title;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'updated';
      details_text := 'Updated suggestion: ' || NEW.title;
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        details_text := details_text || ' (status: ' || OLD.status || ' → ' || NEW.status || ')';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    target_type_val := 'user';
    target_id_val := NEW.id;
    IF TG_OP = 'INSERT' THEN
      action_text := 'created';
      details_text := 'Created user profile: ' || NEW.name;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'updated';
      details_text := 'Updated user profile: ' || NEW.name;
    END IF;
  ELSIF TG_TABLE_NAME = 'projects' THEN
    target_type_val := 'project';
    target_id_val := NEW.id;
    IF TG_OP = 'INSERT' THEN
      action_text := 'created';
      details_text := 'Created project: ' || NEW.title;
    ELSIF TG_OP = 'UPDATE' THEN
      action_text := 'updated';
      details_text := 'Updated project: ' || NEW.title;
    END IF;
  END IF;
  
  IF TG_OP != 'DELETE' THEN
    INSERT INTO activity_log (user_id, action, target_type, target_id, details)
    VALUES (user_id_val, action_text, target_type_val, target_id_val, details_text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_activity_log_delete()
RETURNS TRIGGER AS $$
DECLARE
  action_text TEXT;
  target_type_val TEXT;
  target_id_val UUID;
  user_id_val UUID;
  details_text TEXT;
BEGIN
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RETURN OLD;
  END IF;
  
  IF TG_TABLE_NAME = 'tasks' THEN
    target_type_val := 'task';
    target_id_val := OLD.id;
    action_text := 'deleted';
    details_text := 'Deleted task: ' || OLD.title;
  ELSIF TG_TABLE_NAME = 'shopping_lists' THEN
    target_type_val := 'shopping_list';
    target_id_val := OLD.id;
    action_text := 'deleted';
    details_text := 'Deleted shopping list: ' || OLD.title;
  ELSIF TG_TABLE_NAME = 'suggestions' THEN
    target_type_val := 'suggestion';
    target_id_val := OLD.id;
    action_text := 'deleted';
    details_text := 'Deleted suggestion: ' || OLD.title;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    target_type_val := 'user';
    target_id_val := OLD.id;
    action_text := 'deleted';
    details_text := 'Deleted user profile: ' || OLD.name;
  ELSIF TG_TABLE_NAME = 'projects' THEN
    target_type_val := 'project';
    target_id_val := OLD.id;
    action_text := 'deleted';
    details_text := 'Deleted project: ' || OLD.title;
  END IF;
  
  INSERT INTO activity_log (user_id, action, target_type, target_id, details)
  VALUES (user_id_val, action_text, target_type_val, target_id_val, details_text);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification triggers
CREATE TRIGGER task_notifications_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_notification();

CREATE TRIGGER shopping_list_notifications_trigger
  AFTER INSERT OR UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION create_notification();

CREATE TRIGGER suggestion_notifications_trigger
  AFTER UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION create_notification();

CREATE TRIGGER comment_notifications_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_notification();

CREATE TRIGGER task_assignment_notification_trigger
  AFTER INSERT ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

-- Create activity log triggers
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER task_activity_delete_trigger
  AFTER DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log_delete();

CREATE TRIGGER shopping_list_activity_trigger
  AFTER INSERT OR UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER shopping_list_activity_delete_trigger
  AFTER DELETE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log_delete();

CREATE TRIGGER suggestion_activity_trigger
  AFTER INSERT OR UPDATE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER suggestion_activity_delete_trigger
  AFTER DELETE ON suggestions
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log_delete();

CREATE TRIGGER profile_activity_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER profile_activity_delete_trigger
  AFTER DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log_delete();

CREATE TRIGGER project_activity_trigger
  AFTER INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log();

CREATE TRIGGER project_activity_delete_trigger
  AFTER DELETE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_activity_log_delete();

