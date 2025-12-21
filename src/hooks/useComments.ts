import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Comment, Profile } from '@/types/database';

export interface CommentWithProfile extends Comment {
  userProfile?: Profile;
}

export function useComments(taskId?: string, shoppingListId?: string) {
  return useQuery({
    queryKey: ['comments', taskId, shoppingListId],
    queryFn: async () => {
      let query = supabase.from('comments').select('*');

      if (taskId) {
        query = query.eq('task_id', taskId);
      } else if (shoppingListId) {
        query = query.eq('shopping_list_id', shoppingListId);
      } else {
        return [];
      }

      const { data: comments, error: commentsError } = await query.order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Get profiles for comments
      const userIds = [...new Set(comments.map(c => c.user_id))];
      let profiles: Profile[] = [];

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        profiles = (profilesData || []) as Profile[];
      }

      // Combine comments with profiles
      const commentsWithProfiles: CommentWithProfile[] = comments.map(comment => ({
        ...comment,
        userProfile: profiles.find(p => p.id === comment.user_id),
      }));

      return commentsWithProfiles;
    },
    enabled: !!(taskId || shoppingListId),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: {
      content: string;
      task_id?: string;
      shopping_list_id?: string;
      attachments?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          ...comment,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

