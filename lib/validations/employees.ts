import { z } from 'zod';

export const userRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF']);

export const createEmployeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  role: userRoleSchema,
  branch_id: z.string().uuid('Invalid branch ID').optional(), // Optional for now, can be mandatory later
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateEmployeeSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  role: userRoleSchema,
  branch_id: z.string().uuid('Invalid branch ID').optional().nullable(),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>;
