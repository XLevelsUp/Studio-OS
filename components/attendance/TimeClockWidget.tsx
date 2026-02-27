'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import ShiftTimer from './ShiftTimer';
import { clockIn, clockOut } from '@/actions/attendance';

interface TimeClockWidgetProps {
  activeSession: { id: string; clockIn: string } | null;
  employeeName: string | null;
}

export default function TimeClockWidget({
  activeSession,
  employeeName,
}: TimeClockWidgetProps) {
  const [session, setSession] = useState(activeSession);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClockIn() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await clockIn();
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Clocked in successfully!');
        // Optimistic: create a temporary session entry
        setSession({ id: 'optimistic', clockIn: new Date().toISOString() });
      }
    });
  }

  function handleClockOut() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await clockOut();
      if (result.error) {
        setError(result.error);
      } else {
        const hours = result.totalHours ?? 0;
        setSuccess(`Clocked out! Shift duration: ${hours.toFixed(2)}h`);
        setSession(null);
      }
    });
  }

  const isActive = !!session;

  return (
    <div className='relative overflow-hidden rounded-2xl border border-primary/15 bg-[rgba(17,17,22,0.98)] p-6 backdrop-blur-xl'>
      {/* Background glow */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-700 ${
          isActive
            ? 'opacity-100 bg-[radial-gradient(ellipse_at_top_right,rgba(var(--primary-rgb,59,130,246),0.07),transparent_65%)]'
            : 'opacity-0'
        }`}
      />

      {/* Header */}
      <div className='mb-5 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Timer className='h-5 w-5 text-primary' />
          <span className='text-sm font-semibold text-foreground/80'>
            Time Clock
          </span>
        </div>
        <AnimatePresence mode='wait'>
          {isActive ? (
            <motion.span
              key='active'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className='flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400'
            >
              <span className='relative flex h-1.5 w-1.5'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
                <span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500' />
              </span>
              Active
            </motion.span>
          ) : (
            <motion.span
              key='inactive'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className='rounded-full bg-foreground/8 px-3 py-1 text-xs font-medium text-foreground/40'
            >
              Inactive
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Employee name */}
      {employeeName && (
        <p className='mb-4 text-xs text-foreground/40'>
          Logged in as{' '}
          <span className='text-foreground/70'>{employeeName}</span>
        </p>
      )}

      {/* Timer display */}
      <div className='mb-6 flex min-h-[64px] items-center justify-center'>
        <AnimatePresence mode='wait'>
          {isActive && session ? (
            <motion.div
              key='timer'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className='text-center'
            >
              <p className='mb-1 text-xs font-medium uppercase tracking-widest text-foreground/40'>
                Current Shift
              </p>
              <ShiftTimer clockInTime={session.clockIn} />
            </motion.div>
          ) : (
            <motion.div
              key='idle'
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className='flex items-center gap-2 text-foreground/30'
            >
              <Clock className='h-5 w-5' />
              <span className='text-sm'>Not clocked in</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main CTA button */}
      <AnimatePresence mode='wait'>
        {isActive ? (
          <motion.button
            key='clockout'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={handleClockOut}
            disabled={isPending}
            className='w-full rounded-xl bg-rose-500/15 py-3.5 text-sm font-semibold text-rose-400 ring-1 ring-rose-500/30 transition-all duration-200 hover:bg-rose-500/25 hover:ring-rose-500/50 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isPending ? 'Processing…' : '⏹ Clock Out'}
          </motion.button>
        ) : (
          <motion.button
            key='clockin'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={handleClockIn}
            disabled={isPending}
            className='w-full rounded-xl bg-primary/15 py-3.5 text-sm font-semibold text-primary ring-1 ring-primary/30 transition-all duration-200 hover:bg-primary/25 hover:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isPending ? 'Processing…' : '▶ Clock In'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Feedback messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className='mt-3 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-xs text-rose-400 ring-1 ring-rose-500/20'
          >
            <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className='mt-3 flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400 ring-1 ring-emerald-500/20'
          >
            <CheckCircle2 className='mt-0.5 h-3.5 w-3.5 shrink-0' />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
