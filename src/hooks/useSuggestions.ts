import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Suggestion, SuggestionStatus, Profile } from '@/types/database';

export interface SuggestionWithProfile extends Suggestion {
  createdByProfile?: Profile;
}

export function useSuggestions() {
  return useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (suggestionsError) throw suggestionsError;
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');
      
      const suggestionsWithProfiles: SuggestionWithProfile[] = suggestions.map(suggestion => ({
        ...suggestion,
        createdByProfile: profiles?.find(p => p.id === suggestion.created_by) as Profile | undefined,
      }));
      
      return suggestionsWithProfiles;
    },
  });
}

export function useCreateSuggestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (suggestion: {
      title: string;
      description: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('suggestions')
        .insert({ ...suggestion, created_by: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useUpdateSuggestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SuggestionStatus }) => {
      const { data, error } = await supabase
        .from('suggestions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}

export function useDeleteSuggestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });
}
