import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShoppingListTemplate {
  id: string;
  name: string;
  description?: string;
  items: Array<{ name: string; quantity: number; details?: string }>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useShoppingListTemplates() {
  return useQuery({
    queryKey: ['shopping-list-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_list_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ShoppingListTemplate[];
    },
  });
}

export function useCreateShoppingListTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      items: Array<{ name: string; quantity: number; details?: string }>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('shopping_list_templates')
        .insert({
          ...template,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-templates'] });
    },
  });
}

export function useDeleteShoppingListTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shopping_list_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-templates'] });
    },
  });
}

