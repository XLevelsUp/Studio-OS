'use client';

import { useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  User,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StudioEvent } from '@/actions/events';
import { updateEventStatus, deleteEvent } from '@/actions/events';

interface EventDetailSheetProps {
  event: StudioEvent | null;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  currentUserId: string;
}

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20',
  },
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

function calcDuration(start: string, end: string) {
  const mins = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
}

export default function EventDetailSheet({
  event,
  open,
  onClose,
  isAdmin,
  currentUserId,
}: EventDetailSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    msg: string;
  } | null>(null);

  if (!event) return null;

  const canEdit = isAdmin || event.userId === currentUserId;
  const statusCfg = STATUS_CONFIG[event.status];

  function act(fn: () => Promise<{ success: boolean; error?: string }>) {
    setFeedback(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.success)
        setFeedback({ type: 'error', msg: res.error ?? 'Failed' });
      else {
        setFeedback({ type: 'success', msg: 'Updated!' });
        setTimeout(onClose, 800);
      }
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <Dialog.Content className='fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-primary/12 bg-[rgba(12,12,16,0.98)] shadow-2xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300'>
          {/* Header */}
          <div className='flex items-start justify-between border-b border-primary/10 p-6'>
            <div className='flex-1 pr-4'>
              <div
                className={`mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}
              >
                {statusCfg.label}
              </div>
              <Dialog.Title className='text-lg font-semibold leading-snug text-foreground'>
                {event.title}
              </Dialog.Title>
              {event.ownerName && (
                <p className='mt-1 text-xs text-foreground/40'>
                  Booked by {event.ownerName}
                </p>
              )}
            </div>
            <Dialog.Close asChild>
              <button className='rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-foreground/8 hover:text-foreground'>
                <X className='h-4 w-4' />
              </button>
            </Dialog.Close>
          </div>

          {/* Details */}
          <div className='flex-1 space-y-4 overflow-y-auto p-6'>
            <div className='space-y-3 rounded-xl border border-primary/10 bg-primary/3 p-4'>
              <div className='flex items-start gap-3'>
                <Calendar className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                <div>
                  <p className='text-xs text-foreground/40'>Start</p>
                  <p className='text-sm font-medium text-foreground'>
                    {fmtDateTime(event.startTime)}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <Clock className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                <div>
                  <p className='text-xs text-foreground/40'>Duration</p>
                  <p className='text-sm font-medium text-foreground'>
                    {calcDuration(event.startTime, event.endTime)}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                <div>
                  <p className='text-xs text-foreground/40'>Location</p>
                  <p className='text-sm font-medium text-foreground'>
                    {event.location}
                  </p>
                </div>
              </div>
            </div>

            {event.description && (
              <div>
                <p className='mb-1 text-xs font-medium text-foreground/40'>
                  Notes
                </p>
                <p className='text-sm text-foreground/70 leading-relaxed'>
                  {event.description}
                </p>
              </div>
            )}

            {/* Client */}
            {event.clientName && (
              <div className='flex items-start gap-3 rounded-xl border border-primary/10 bg-primary/3 p-4'>
                <User className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
                <div>
                  <p className='text-xs text-foreground/40'>Client</p>
                  <p className='text-sm font-medium text-foreground'>
                    {event.clientName}
                  </p>
                </div>
              </div>
            )}

            {/* Equipment */}
            {event.equipment && event.equipment.length > 0 && (
              <div className='rounded-xl border border-primary/10 bg-primary/3 p-4'>
                <div className='mb-2 flex items-center gap-2'>
                  <Package className='h-4 w-4 text-primary' />
                  <p className='text-xs font-medium text-foreground/60'>
                    Equipment ({event.equipment.length})
                  </p>
                </div>
                <ul className='space-y-1'>
                  {event.equipment.map((eq) => (
                    <li
                      key={eq.id}
                      className='flex items-center gap-2 text-sm text-foreground/70'
                    >
                      <span className='h-1.5 w-1.5 rounded-full bg-primary/40' />
                      {eq.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feedback */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs ring-1 ${
                    feedback.type === 'error'
                      ? 'bg-rose-500/10 text-rose-400 ring-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                  }`}
                >
                  <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                  {feedback.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions — only for owners/admins */}
          {canEdit && event.status !== 'CANCELLED' && (
            <div className='border-t border-primary/10 p-6 space-y-2'>
              {event.status === 'PENDING' && (
                <button
                  disabled={isPending}
                  onClick={() =>
                    act(() => updateEventStatus(event.id, 'CONFIRMED'))
                  }
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/15 py-2.5 text-sm font-semibold text-emerald-400 ring-1 ring-emerald-500/30 transition-all hover:bg-emerald-500/25 disabled:opacity-50'
                >
                  <CheckCircle2 className='h-4 w-4' />
                  Confirm Event
                </button>
              )}
              <div className='flex gap-2'>
                <button
                  disabled={isPending}
                  onClick={() =>
                    act(() => updateEventStatus(event.id, 'CANCELLED'))
                  }
                  className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-foreground/10 py-2.5 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground disabled:opacity-50'
                >
                  <XCircle className='h-4 w-4' />
                  Cancel
                </button>
                <button
                  disabled={isPending}
                  onClick={() => act(() => deleteEvent(event.id))}
                  className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/10 py-2.5 text-sm font-medium text-rose-400 ring-1 ring-rose-500/20 transition-all hover:bg-rose-500/20 disabled:opacity-50'
                >
                  <Trash2 className='h-4 w-4' />
                  Delete
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
