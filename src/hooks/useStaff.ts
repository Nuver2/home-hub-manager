import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  phone_number?: string;
  profile_picture?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  role: AppRole;
}

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (profilesError) throw profilesError;
      
      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      // Combine profiles with roles, excluding parents for staff list
      const staffMembers: StaffMember[] = profiles
        .map(profile => {
          const userRole = roles.find(r => r.user_id === profile.id);
          return {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            phone_number: profile.phone_number,
            profile_picture: profile.profile_picture,
            status: profile.status as 'active' | 'inactive',
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            role: (userRole?.role || 'other') as AppRole,
          };
        })
        .filter(member => member.role !== 'parent');
      
      return staffMembers;
    },
  });
}

export function useAllUsersWithRoles() {
  return useQuery({
    queryKey: ['all-users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (profilesError) throw profilesError;
      
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      const usersWithRoles: StaffMember[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          phone_number: profile.phone_number,
          profile_picture: profile.profile_picture,
          status: profile.status as 'active' | 'inactive',
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          role: (userRole?.role || 'other') as AppRole,
        };
      });
      
      return usersWithRoles;
    },
  });
}

export function useDeleteStaff() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete user roles first (foreign key constraint)
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      
      // Delete profile (this will cascade delete related data)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // Note: The auth user will remain in auth.users
      // To fully delete, you'd need an Edge Function with service role
      // For now, we just delete the profile and roles
    },
    onSuccess: () => {
      // Invalidate and refetch staff list
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['all-users-with-roles'] });
    },
  });
}
