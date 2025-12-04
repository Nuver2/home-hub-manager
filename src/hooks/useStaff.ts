import { useQuery } from '@tanstack/react-query';
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
