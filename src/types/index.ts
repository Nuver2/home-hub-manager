// User Types
export type UserRole = 'parent' | 'driver' | 'chef' | 'cleaner' | 'other';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  status: 'active' | 'inactive';
  phoneNumber?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

// Task Types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'to_do' | 'in_progress' | 'completed' | 'on_hold';
export type TaskCategory = 'cleaning' | 'kitchen' | 'driving' | 'shopping' | 'maintenance' | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate?: string;
  location?: string;
  attachments?: string[];
  assignedUsers: User[];
  assignedRoles?: UserRole[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

// Project Types
export interface Project {
  id: string;
  title: string;
  description?: string;
  date: string;
  tasks: Task[];
  shoppingLists: ShoppingList[];
  createdAt: string;
  updatedAt: string;
}

// Shopping List Types
export type ShoppingListStatus = 
  | 'draft' 
  | 'assigned' 
  | 'in_progress' 
  | 'delivered' 
  | 'waiting_confirmation' 
  | 'completed' 
  | 'returned_for_fix';

export type ItemStatus = 'pending' | 'found' | 'not_found' | 'alternative';
export type ChefConfirmation = 'pending' | 'ok' | 'not_ok';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  details?: string;
  status: ItemStatus;
  driverComment?: string;
  driverAttachment?: string;
  chefConfirmation: ChefConfirmation;
}

export interface ShoppingList {
  id: string;
  title: string;
  createdBy: User;
  assignedTo?: User;
  priority: TaskPriority;
  dueDate?: string;
  status: ShoppingListStatus;
  notes?: string;
  projectId?: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

// Suggestion Types
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  createdBy: User;
  status: SuggestionStatus;
  createdAt: string;
  updatedAt: string;
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  user: User;
  taskId?: string;
  shoppingListId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export type NotificationType = 
  | 'task_assigned' 
  | 'task_status_changed' 
  | 'shopping_list_assigned' 
  | 'shopping_list_status_changed'
  | 'suggestion_approved'
  | 'suggestion_rejected'
  | 'new_comment';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedId?: string;
  relatedType?: 'task' | 'shopping_list' | 'suggestion';
  read: boolean;
  createdAt: string;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  user: User;
  action: string;
  targetType: 'task' | 'shopping_list' | 'suggestion' | 'user' | 'project';
  targetId: string;
  details?: string;
  createdAt: string;
}

// Auth Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
