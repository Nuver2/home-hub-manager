import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLog, Profile } from '@/types/database';

export interface ActivityLogWithProfile extends ActivityLog {
  userProfile?: Profile;
}

export function useActivityLog() {
  return useQuery({
    queryKey: ['activity-log'],
    queryFn: async () => {
      const { data: logs, error: logsError } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (logsError) throw logsError;
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');
      
      const logsWithProfiles: ActivityLogWithProfile[] = logs.map(log => ({
        ...log,
        target_type: log.target_type as ActivityLog['target_type'],
        userProfile: profiles?.find(p => p.id === log.user_id) as Profile | undefined,
      }));
      
      return logsWithProfiles;
    },
  });
}

export function useCreateActivityLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: {
      action: string;
      target_type: 'task' | 'shopping_list' | 'suggestion' | 'user' | 'project';
      target_id: string;
      details?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('activity_log')
        .insert({ ...log, user_id: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
    },
  });
}
