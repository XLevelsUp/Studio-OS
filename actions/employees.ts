'use server';

import { createClient } from '@/lib/supabase/server';
import { adminAuthClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  CreateEmployeeFormData,
  UpdateEmployeeFormData,
} from '@/lib/validations/employees';
import { redirect } from 'next/navigation';

export async function getEmployees(query?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check permissions - only ADMIN, SUPER_ADMIN, and the user themselves (handled in UI/logic) should access.
  // However, for the list, usually only admins see everyone.
  // We'll enforce that STAFF can only see themselves if they call this, or return empty/restricted.
  // Ideally, RLS protects the data, but we can also filter here.

  // Let's rely on RLS for data protection, but we'll add search logic.
  let dbQuery = supabase
    .from('profiles')
    .select('*, branches(name), manager:managerId(fullName)')
    .order('createdAt', { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike('fullName', `%${query}%`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('Error fetching employees:', error);
    throw new Error('Failed to fetch employees');
  }

  return data;
}

export async function getBranches() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching branches:', error);
    return [];
  }

  return data;
}

export async function getEmployee(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*, branches(name), manager:managerId(fullName)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    return null;
  }

  return data;
}

export async function createEmployee(data: CreateEmployeeFormData) {
  const supabase = await createClient(); // For auth check
  const {
    data: { user: requester },
  } = await supabase.auth.getUser();

  if (!requester) {
    return { error: 'Unauthorized' };
  }

  // Verify role
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', requester.id)
    .single();

  if (
    !requesterProfile ||
    (requesterProfile.role !== 'SUPER_ADMIN' &&
      requesterProfile.role !== 'ADMIN')
  ) {
    return { error: 'Insufficient permissions' };
  }

  const result = createEmployeeSchema.safeParse(data);

  if (!result.success) {
    return { error: 'Invalid data', details: result.error.flatten() };
  }

  const { email, password, full_name, role, branch_id, manager_id } =
    result.data;

  // 1. Create User in Auth (using Service Role)
  const { data: authUser, error: authError } =
    await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm
      user_metadata: { full_name },
    });

  if (authError || !authUser.user) {
    console.error('Error creating auth user:', authError);
    return { error: authError?.message || 'Failed to create user' };
  }

  // 2. Update Profile (Profile is auto-created by trigger, but we need to update role/branch/manager)
  // The trigger 'handle_new_user' sets role to 'EMPLOYEE' by default (updated from STAFF).

  const { error: profileError } = await adminAuthClient
    .from('profiles')
    .update({
      role: role,
      branch_id: branch_id || null,
      managerId: manager_id || null,
    })
    .eq('id', authUser.user.id);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    return { error: 'User created but failed to update profile details.' };
  }

  revalidatePath('/dashboard/employees');
  return { success: true };
}

export async function updateEmployee(id: string, data: UpdateEmployeeFormData) {
  const supabase = await createClient();
  const {
    data: { user: requester },
  } = await supabase.auth.getUser();

  if (!requester) {
    return { error: 'Unauthorized' };
  }

  // Verify role
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', requester.id)
    .single();

  if (!requesterProfile) {
    return { error: 'Profile not found' };
  }

  const result = updateEmployeeSchema.safeParse(data);

  if (!result.success) {
    return { error: 'Invalid data', details: result.error.flatten() };
  }

  const { full_name, role, branch_id, manager_id } = result.data;

  // Authorization Check Logic
  if (requesterProfile.role === 'EMPLOYEE') {
    // Employee can only update themselves...
    if (id !== requester.id) return { error: 'Unauthorized' };
    // Employee cannot change role, branch or manager
    if (role || branch_id !== undefined || manager_id !== undefined)
      return { error: 'Unauthorized to change restricted fields' };
  }

  if (requesterProfile.role === 'ADMIN') {
    // Admins cannot update Super Admins.
    const target = await getEmployee(id);
    if (target?.role === 'SUPER_ADMIN') {
      return { error: 'Cannot modify Super Admin' };
    }
    // Admins cannot promote to Super Admin
    if (role === 'SUPER_ADMIN') {
      return { error: 'Cannot promote to Super Admin' };
    }
  }

  // Update
  const { error } = await supabase
    .from('profiles')
    .update({
      fullName: full_name,
      // Only update role/branch/manager if provided and user has permission
      ...(role ? { role } : {}),
      ...(branch_id !== undefined ? { branch_id } : {}),
      ...(manager_id !== undefined ? { managerId: manager_id } : {}),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating employee:', error);
    return { error: 'Failed to update employee' };
  }

  revalidatePath('/dashboard/employees');
  revalidatePath(`/dashboard/employees/${id}`);
  return { success: true };
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient();
  const {
    data: { user: requester },
  } = await supabase.auth.getUser();

  if (!requester) {
    return { error: 'Unauthorized' };
  }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', requester.id)
    .single();

  // Only SUPER_ADMIN can delete
  if (!requesterProfile || requesterProfile.role !== 'SUPER_ADMIN') {
    return { error: 'Only Super Admin can delete employees' };
  }

  // Use admin client to delete from Auth (cascades to public.profiles)
  const { error } = await adminAuthClient.auth.admin.deleteUser(id);

  if (error) {
    console.error('Error deleting user:', error);
    return { error: 'Failed to delete user' };
  }

  revalidatePath('/dashboard/employees');
  return { success: true };
}

export async function getAdmins() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, fullName')
    .in('role', ['ADMIN', 'SUPER_ADMIN'])
    .order('fullName');

  if (error) {
    console.error('Error fetching admins:', error);
    return [];
  }

  return data;
}
