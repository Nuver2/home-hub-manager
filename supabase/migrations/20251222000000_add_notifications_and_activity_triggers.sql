-- Automatic Notifications and Activity Log Triggers
-- This migration adds database triggers to automatically create notifications and activity logs

-- =============================================
-- NOTIFICATION TRIGGERS
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
  -- Determine notification type and message based on table and operation
  IF TG_TABLE_NAME = 'tasks' THEN
    related_type_val := 'task';
    related_id_val := NEW.id;
    
    IF TG_OP = 'INSERT' THEN
      notification_type_val := 'task_assigned';
      notification_message := 'New task assigned: ' || NEW.title;
      
      -- Notify assigned users
      IF NEW.assigned_roles IS NOT NULL AND array_length(NEW.assigned_roles, 1) > 0 THEN
        -- Get users with assigned roles
        FOR assigned_user_id IN 
          SELECT user_id FROM user_roles 
          WHERE role = ANY(NEW.assigned_roles)
        LOOP
          INSERT INTO notifications (user_id, type, message, related_id, related_type)
          VALUES (assigned_user_id, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
        END LOOP;
      END IF;
      
      -- Notify directly assigned users (via task_assignments - will be created after task)
      -- This will be handled by a separate trigger on task_assignments
      
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      notification_type_val := 'task_status_changed';
      notification_message := 'Task status changed: ' || NEW.title || ' (' || OLD.status || ' → ' || NEW.status || ')';
      
      -- Notify assigned users
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
      
      -- Notify assigned user
      IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, related_id, related_type)
        VALUES (NEW.assigned_to, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
      END IF;
      
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      notification_type_val := 'shopping_list_status_changed';
      notification_message := 'Shopping list status changed: ' || NEW.title || ' (' || OLD.status || ' → ' || NEW.status || ')';
      
      -- Notify creator and assigned user
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
      
      -- Notify creator
      IF NEW.created_by IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, message, related_id, related_type)
        VALUES (NEW.created_by, notification_type_val::notification_type, notification_message, related_id_val, related_type_val);
      END IF;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      notification_type_val := 'new_comment';
      
      -- Determine related type and ID
      IF NEW.task_id IS NOT NULL THEN
        related_type_val := 'task';
        related_id_val := NEW.task_id;
        
        -- Get task title
        SELECT title INTO notification_message FROM tasks WHERE id = NEW.task_id;
        notification_message := 'New comment on task: ' || COALESCE(notification_message, 'Task');
        
        -- Notify task creator and assigned users (except comment author)
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
        
        -- Get shopping list title
        SELECT title INTO notification_message FROM shopping_lists WHERE id = NEW.shopping_list_id;
        notification_message := 'New comment on shopping list: ' || COALESCE(notification_message, 'Shopping List');
        
        -- Notify shopping list creator and assigned user (except comment author)
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

-- Create triggers for notifications
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

-- Trigger for task assignments (notify when user is assigned)
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

CREATE TRIGGER task_assignment_notification_trigger
  AFTER INSERT ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

-- =============================================
-- ACTIVITY LOG TRIGGERS
-- =============================================

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
  -- Get current user (from auth context)
  user_id_val := auth.uid();
  
  -- Skip if no user (service role operations)
  IF user_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determine action and target
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
    ELSIF TG_OP = 'DELETE' THEN
      action_text := 'deleted';
      details_text := 'Deleted task: ' || OLD.title;
      target_id_val := OLD.id;
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
    ELSIF TG_OP = 'DELETE' THEN
      action_text := 'deleted';
      details_text := 'Deleted shopping list: ' || OLD.title;
      target_id_val := OLD.id;
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
    ELSIF TG_OP = 'DELETE' THEN
      action_text := 'deleted';
      details_text := 'Deleted suggestion: ' || OLD.title;
      target_id_val := OLD.id;
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
    ELSIF TG_OP = 'DELETE' THEN
      action_text := 'deleted';
      details_text := 'Deleted user profile: ' || OLD.name;
      target_id_val := OLD.id;
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
    ELSIF TG_OP = 'DELETE' THEN
      action_text := 'deleted';
      details_text := 'Deleted project: ' || OLD.title;
      target_id_val := OLD.id;
    END IF;
  END IF;
  
  -- Insert activity log (only for INSERT and UPDATE - DELETE handled separately)
  IF TG_OP != 'DELETE' THEN
    INSERT INTO activity_log (user_id, action, target_type, target_id, details)
    VALUES (user_id_val, action_text, target_type_val, target_id_val, details_text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for DELETE operations (needs OLD record)
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

-- Create triggers for activity logs
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

