import { z } from 'zod';

export const userRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']);

export const createEmployeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  role: userRoleSchema,
  branch_id: z.string().uuid('Invalid branch ID').optional(),
  manager_id: z.string().uuid('Invalid manager ID').optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateEmployeeSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  role: userRoleSchema,
  branch_id: z.string().uuid('Invalid branch ID').optional().nullable(),
  manager_id: z.string().uuid('Invalid manager ID').optional().nullable(),
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeFormData = z.infer<typeof updateEmployeeSchema>;
