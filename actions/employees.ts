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
    .select('*, branches(name)')
    .order('created_at', { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike('full_name', `%${query}%`);
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
    .select('*, branches(name)')
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

  const { email, password, full_name, role, branch_id } = result.data;

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

  // 2. Update Profile (Profile is auto-created by trigger, but we need to update role/branch)
  // The trigger 'handle_new_user' sets role to 'STAFF' by default.
  // We need to update it to the selected role and set branch.

  // Wait a moment for trigger... or just update upsert style.
  // Since we have the ID, we can update directly using the admin client to bypass RLS if needed,
  // OR use the regular client if RLS allows ADMINs to update profiles (which it does based on our policies).

  // Using admin user to update profile to ensure it succeeds regardless of specific RLS lag or restrictions on 'insert'.

  const { error: profileError } = await adminAuthClient
    .from('profiles')
    .update({
      role: role,
      branch_id: branch_id || null,
    })
    .eq('id', authUser.user.id);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    // Cleanup auth user if profile update fails?
    // Ideally yes, but for now we'll return error.
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

  const { full_name, role, branch_id } = result.data;

  // Authorization Check Logic
  if (requesterProfile.role === 'STAFF') {
    // Staff can only update themselves... but this action is typically for admin updates.
    // If we want to allow staff to update their own name, we'd check id === requester.id
    if (id !== requester.id) return { error: 'Unauthorized' };
    // Staff cannot change role or branch
    if (role || branch_id !== undefined)
      return { error: 'Unauthorized to change role/branch' };
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
      full_name,
      // Only update role/branch if provided and user has permission
      ...(role ? { role } : {}),
      ...(branch_id !== undefined ? { branch_id } : {}),
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
