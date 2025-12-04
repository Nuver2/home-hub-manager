// Database types that map to Supabase enums
export type AppRole = 'parent' | 'driver' | 'chef' | 'cleaner' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'to_do' | 'in_progress' | 'completed' | 'on_hold';
export type TaskCategory = 'cleaning' | 'kitchen' | 'driving' | 'shopping' | 'maintenance' | 'other';
export type ShoppingListStatus = 'draft' | 'assigned' | 'in_progress' | 'delivered' | 'waiting_confirmation' | 'completed' | 'returned_for_fix';
export type ItemStatus = 'pending' | 'found' | 'not_found' | 'alternative';
export type ChefConfirmation = 'pending' | 'ok' | 'not_ok';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type NotificationType = 'task_assigned' | 'task_status_changed' | 'shopping_list_assigned' | 'shopping_list_status_changed' | 'suggestion_approved' | 'suggestion_rejected' | 'new_comment';

// Database table types
export interface Profile {
  id: string;
  name: string;
  username: string;
  phone_number?: string;
  profile_picture?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  due_date?: string;
  location?: string;
  attachments?: string[];
  assigned_roles?: AppRole[];
  project_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
}

export interface ShoppingList {
  id: string;
  title: string;
  priority: TaskPriority;
  status: ShoppingListStatus;
  due_date?: string;
  notes?: string;
  project_id?: string;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity: number;
  details?: string;
  status: ItemStatus;
  driver_comment?: string;
  driver_attachment?: string;
  chef_confirmation: ChefConfirmation;
  created_at: string;
  updated_at: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  task_id?: string;
  shopping_list_id?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  related_id?: string;
  related_type?: 'task' | 'shopping_list' | 'suggestion';
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  target_type: 'task' | 'shopping_list' | 'suggestion' | 'user' | 'project';
  target_id: string;
  details?: string;
  created_at: string;
}

// Extended types with relations
export interface TaskWithAssignees extends Task {
  task_assignments?: (TaskAssignment & { profiles?: Profile })[];
  profiles?: Profile; // created_by profile
}

export interface ShoppingListWithRelations extends ShoppingList {
  shopping_list_items?: ShoppingListItem[];
  created_by_profile?: Profile;
  assigned_to_profile?: Profile;
}

export interface SuggestionWithProfile extends Suggestion {
  profiles?: Profile;
}

export interface CommentWithProfile extends Comment {
  profiles?: Profile;
}

export interface ActivityLogWithProfile extends ActivityLog {
  profiles?: Profile;
}

// User with role (for auth context)
export interface UserWithRole extends Profile {
  role: AppRole;
}
