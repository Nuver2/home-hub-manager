import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingList, ShoppingListItem, TaskPriority, ShoppingListStatus, ItemStatus, ChefConfirmation, Profile } from '@/types/database';

export interface ShoppingListWithRelations extends ShoppingList {
  items: ShoppingListItem[];
  createdByProfile?: Profile;
  assignedToProfile?: Profile;
}

export function useShoppingLists() {
  return useQuery({
    queryKey: ['shopping-lists'],
    queryFn: async () => {
      // Get shopping lists
      const { data: lists, error: listsError } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (listsError) throw listsError;
      
      // Get all items
      const { data: items, error: itemsError } = await supabase
        .from('shopping_list_items')
        .select('*');
      
      if (itemsError) throw itemsError;
      
      // Get profiles for created_by and assigned_to
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      // Combine data
      const listsWithRelations: ShoppingListWithRelations[] = lists.map(list => {
        const listItems = (items || []).filter(item => item.shopping_list_id === list.id) as ShoppingListItem[];
        const createdByProfile = profiles?.find(p => p.id === list.created_by) as Profile | undefined;
        const assignedToProfile = list.assigned_to ? profiles?.find(p => p.id === list.assigned_to) as Profile | undefined : undefined;
        
        return {
          ...list,
          items: listItems,
          createdByProfile,
          assignedToProfile,
        } as ShoppingListWithRelations;
      });
      
      return listsWithRelations;
    },
  });
}

export function useShoppingList(id: string | undefined) {
  return useQuery({
    queryKey: ['shopping-list', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id)
        .single();
      
      if (listError) throw listError;
      
      const { data: items } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('shopping_list_id', id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');
      
      const createdByProfile = profiles?.find(p => p.id === list.created_by) as Profile | undefined;
      const assignedToProfile = list.assigned_to ? profiles?.find(p => p.id === list.assigned_to) as Profile | undefined : undefined;
      
      return {
        ...list,
        items: (items || []) as ShoppingListItem[],
        createdByProfile,
        assignedToProfile,
      } as ShoppingListWithRelations;
    },
    enabled: !!id,
  });
}

export function useCreateShoppingList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (list: {
      title: string;
      priority?: TaskPriority;
      due_date?: string;
      notes?: string;
      project_id?: string;
      assigned_to?: string;
      items?: { name: string; quantity: number; details?: string }[];
    }) => {
      const { items, ...listData } = list;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({ ...listData, created_by: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create items
      if (items && items.length > 0) {
        const itemsWithListId = items.map(item => ({
          ...item,
          shopping_list_id: data.id,
        }));
        
        await supabase.from('shopping_list_items').insert(itemsWithListId);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
}

export function useUpdateShoppingList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShoppingList> & { id: string }) => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list', data.id] });
    },
  });
}

export function useUpdateShoppingListItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShoppingListItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });
}

export function useDeleteShoppingList() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
}
