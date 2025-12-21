import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskStatus, TaskPriority, TaskCategory, AppRole, Profile } from '@/types/database';

export interface TaskWithAssignees extends Task {
  assignedUsers: Profile[];
}

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      // Get tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tasksError) throw tasksError;
      
      // Get task assignments with profiles
      const { data: assignments, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('task_id, user_id');
      
      if (assignmentsError) throw assignmentsError;
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      // Combine data
      const tasksWithAssignees: TaskWithAssignees[] = tasks.map(task => {
        const taskAssignmentUserIds = assignments
          .filter(a => a.task_id === task.id)
          .map(a => a.user_id);
        
        const assignedUsers = profiles.filter(p => taskAssignmentUserIds.includes(p.id)) as Profile[];
        
        return {
          ...task,
          assignedUsers,
        } as TaskWithAssignees;
      });
      
      return tasksWithAssignees;
    },
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();
      
      if (taskError) throw taskError;
      
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('user_id')
        .eq('task_id', id);
      
      const userIds = assignments?.map(a => a.user_id) || [];
      
      let assignedUsers: Profile[] = [];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        assignedUsers = (profiles || []) as Profile[];
      }
      
      return {
        ...task,
        assignedUsers,
      } as TaskWithAssignees;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      category?: TaskCategory;
      due_date?: string;
      location?: string;
      assigned_roles?: AppRole[];
      project_id?: string;
      assigned_user_ids?: string[];
      attachments?: string[];
    }) => {
      const { assigned_user_ids, ...taskData } = task;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...taskData, created_by: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create task assignments
      if (assigned_user_ids && assigned_user_ids.length > 0) {
        const assignments = assigned_user_ids.map(userId => ({
          task_id: data.id,
          user_id: userId,
        }));
        
        await supabase.from('task_assignments').insert(assignments);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, assigned_user_ids, ...updates }: Partial<Task> & { id: string; assigned_user_ids?: string[] }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update assignments if provided
      if (assigned_user_ids !== undefined) {
        // Remove old assignments
        await supabase.from('task_assignments').delete().eq('task_id', id);
        
        // Add new assignments
        if (assigned_user_ids.length > 0) {
          const assignments = assigned_user_ids.map(userId => ({
            task_id: id,
            user_id: userId,
          }));
          await supabase.from('task_assignments').insert(assignments);
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
