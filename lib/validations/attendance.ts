import { z } from 'zod';

export const manualAdjustmentSchema = z
  .object({
    logId: z.string().uuid().optional(), // if editing an existing log
    userId: z.string().uuid({ message: 'Please select an employee.' }),
    clockIn: z
      .string()
      .min(1, 'Clock-in time is required.')
      .refine((v) => !isNaN(Date.parse(v)), {
        message: 'Invalid clock-in time.',
      }),
    clockOut: z
      .string()
      .min(1, 'Clock-out time is required.')
      .refine((v) => !isNaN(Date.parse(v)), {
        message: 'Invalid clock-out time.',
      }),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters.')
      .max(500, 'Reason must be under 500 characters.'),
  })
  .refine((data) => new Date(data.clockOut) > new Date(data.clockIn), {
    message: 'Clock-out must be after clock-in.',
    path: ['clockOut'],
  });

export type ManualAdjustmentFormData = z.infer<typeof manualAdjustmentSchema>;
