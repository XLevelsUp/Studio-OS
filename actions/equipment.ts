'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { equipmentSchema } from '@/lib/validations/schemas';
import type { Database } from '@/lib/database.types';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type EquipmentInsert = Database['public']['Tables']['equipment']['Insert'];
type EquipmentUpdate = Database['public']['Tables']['equipment']['Update'];

// Get all equipment
export async function getEquipment() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('equipment')
    .select('*, categories(name), branches(name)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch equipment: ${error.message}`);
  }

  return data;
}

// Get equipment by ID
export async function getEquipmentById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('equipment')
    .select('*, categories(name), branches(name)')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch equipment: ${error.message}`);
  }

  return data;
}

// Create equipment
export async function createEquipment(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    name: formData.get('name') as string,
    serial_number: formData.get('serial_number') as string,
    category_id: formData.get('category_id') as string,
    branch_id: formData.get('branch_id') as string,
    rental_price: parseFloat(formData.get('rental_price') as string),
    description: (formData.get('description') as string) || null,
  };

  // Validate
  const validatedData = equipmentSchema.parse(rawData);

  const { data, error } = await supabase
    .from('equipment')
    .insert({
      ...validatedData,
      status: 'AVAILABLE',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create equipment: ${error.message}`);
  }

  revalidatePath('/dashboard/equipment');
  return data;
}

// Update equipment
export async function updateEquipment(id: string, formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    name: formData.get('name') as string,
    serial_number: formData.get('serial_number') as string,
    category_id: formData.get('category_id') as string,
    branch_id: formData.get('branch_id') as string,
    rental_price: parseFloat(formData.get('rental_price') as string),
    description: (formData.get('description') as string) || null,
  };

  // Validate
  const validatedData = equipmentSchema.parse(rawData);

  const { data, error } = await supabase
    .from('equipment')
    .update(validatedData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update equipment: ${error.message}`);
  }

  revalidatePath('/dashboard/equipment');
  revalidatePath(`/dashboard/equipment/${id}`);
  return data;
}

// Update equipment status
export async function updateEquipmentStatus(
  id: string,
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'LOST',
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('equipment')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update equipment status: ${error.message}`);
  }

  revalidatePath('/dashboard/equipment');
  revalidatePath(`/dashboard/equipment/${id}`);
  return data;
}

// Delete equipment
export async function deleteEquipment(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('equipment').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete equipment: ${error.message}`);
  }

  revalidatePath('/dashboard/equipment');
}

// Get all categories (for dropdowns)
export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data;
}

// Get all branches (for dropdowns)
export async function getBranches() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch branches: ${error.message}`);
  }

  return data;
}
