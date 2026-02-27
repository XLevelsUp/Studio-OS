'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertCircle, CheckCircle2, Settings2, X } from 'lucide-react';
import {
  manualAdjustmentSchema,
  type ManualAdjustmentFormData,
} from '@/lib/validations/attendance';
import { requestManualAdjustment } from '@/actions/attendance';

interface Employee {
  id: string;
  fullName: string | null;
}

interface ManualAdjustmentDialogProps {
  employees: Employee[];
}

export default function ManualAdjustmentDialog({
  employees,
}: ManualAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualAdjustmentFormData>({
    resolver: zodResolver(manualAdjustmentSchema),
  });

  function onSubmit(data: ManualAdjustmentFormData) {
    setServerError(null);
    setServerSuccess(false);
    startTransition(async () => {
      const result = await requestManualAdjustment(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        setServerSuccess(true);
        reset();
        setTimeout(() => setOpen(false), 1500);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className='flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-4 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/15'>
          <Settings2 className='h-4 w-4' />
          Manual Adjustment
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <Dialog.Content className='fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-primary/15 bg-[rgba(17,17,22,0.98)] p-6 shadow-2xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'>
          {/* Header */}
          <div className='mb-5 flex items-center justify-between'>
            <div>
              <Dialog.Title className='text-base font-semibold text-foreground'>
                Manual Attendance Adjustment
              </Dialog.Title>
              <Dialog.Description className='mt-0.5 text-xs text-foreground/40'>
                Admin override — create or correct a shift record.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className='rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-foreground/8 hover:text-foreground'>
                <X className='h-4 w-4' />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {/* Employee select */}
            <div>
              <label className='mb-1.5 block text-xs font-medium text-foreground/60'>
                Employee
              </label>
              <select
                {...register('userId')}
                className='w-full rounded-lg border border-primary/15 bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20'
              >
                <option value=''>Select employee…</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName ?? e.id}
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className='mt-1 text-xs text-rose-400'>
                  {errors.userId.message}
                </p>
              )}
            </div>

            {/* Clock In */}
            <div>
              <label className='mb-1.5 block text-xs font-medium text-foreground/60'>
                Clock-In Time
              </label>
              <input
                type='datetime-local'
                {...register('clockIn')}
                className='w-full rounded-lg border border-primary/15 bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20'
              />
              {errors.clockIn && (
                <p className='mt-1 text-xs text-rose-400'>
                  {errors.clockIn.message}
                </p>
              )}
            </div>

            {/* Clock Out */}
            <div>
              <label className='mb-1.5 block text-xs font-medium text-foreground/60'>
                Clock-Out Time
              </label>
              <input
                type='datetime-local'
                {...register('clockOut')}
                className='w-full rounded-lg border border-primary/15 bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20'
              />
              {errors.clockOut && (
                <p className='mt-1 text-xs text-rose-400'>
                  {errors.clockOut.message}
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className='mb-1.5 block text-xs font-medium text-foreground/60'>
                Reason
              </label>
              <textarea
                {...register('reason')}
                rows={3}
                placeholder='Describe the reason for this adjustment (min 10 chars)…'
                className='w-full resize-none rounded-lg border border-primary/15 bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/25 outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20'
              />
              {errors.reason && (
                <p className='mt-1 text-xs text-rose-400'>
                  {errors.reason.message}
                </p>
              )}
            </div>

            {/* Feedback */}
            {serverError && (
              <div className='flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-xs text-rose-400 ring-1 ring-rose-500/20'>
                <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                <span>{serverError}</span>
              </div>
            )}
            {serverSuccess && (
              <div className='flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400 ring-1 ring-emerald-500/20'>
                <CheckCircle2 className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                <span>Adjustment saved successfully!</span>
              </div>
            )}

            {/* Actions */}
            <div className='flex gap-3 pt-1'>
              <Dialog.Close asChild>
                <button
                  type='button'
                  className='flex-1 rounded-xl border border-foreground/10 py-2.5 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground'
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type='submit'
                disabled={isPending}
                className='flex-1 rounded-xl bg-primary/15 py-2.5 text-sm font-semibold text-primary ring-1 ring-primary/30 transition-all hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isPending ? 'Saving…' : 'Save Adjustment'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
