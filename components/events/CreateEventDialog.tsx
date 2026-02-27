'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  User,
  Package,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createEventSchema,
  STUDIO_LOCATIONS,
  type EventFormData,
} from '@/lib/validations/schemas';
import {
  createEvent,
  checkDayConflict,
  type StudioEvent,
  type EventFormOptions,
} from '@/actions/events';

interface CreateEventDialogProps {
  defaultDate?: string; // "YYYY-MM-DD"
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  formOptions: EventFormOptions; // loaded by the page server component
}

// ─── Date picker helpers ───────────────────────────────────────────────────
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

// Build initial date parts from a YYYY-MM-DD string
function parseDateStr(s: string) {
  const [y, mo, d] = s.split('-').map(Number);
  return { year: y, month: mo, day: d };
}

function buildDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Time helpers ─────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
function pad(n: number) {
  return String(n).padStart(2, '0');
}

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i);

export default function CreateEventDialog({
  defaultDate,
  trigger,
  onSuccess,
  formOptions,
}: CreateEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [conflicts, setConflicts] = useState<StudioEvent[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [equipSearch, setEquipSearch] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const initialDate = parseDateStr(defaultDate ?? todayStr);

  // Controlled date parts
  const [dateYear, setDateYear] = useState(initialDate.year);
  const [dateMonth, setDateMonth] = useState(initialDate.month);
  const [dateDay, setDateDay] = useState(initialDate.day);

  const dateStr = buildDateStr(dateYear, dateMonth, dateDay);
  const maxDay = daysInMonth(dateYear, dateMonth);
  const DAYS = Array.from({ length: maxDay }, (_, i) => i + 1);

  // Clamp day when month/year changes
  useEffect(() => {
    if (dateDay > maxDay) setDateDay(maxDay);
  }, [dateMonth, dateYear, dateDay, maxDay]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    // Cast needed: Zod v4 + hookform/resolvers v5 infers from input type (equipmentIds?: string[])
    // but we want the output type (equipmentIds: string[]) since .default([]) fills it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createEventSchema) as any,
    defaultValues: {
      date: dateStr,
      startHour: '9',
      startMinute: '0',
      durationHours: '2',
      location: 'Studio A',
      clientId: '',
      equipmentIds: [],
    },
  });

  // Keep form "date" field in sync with the selects
  useEffect(() => {
    setValue('date', dateStr);
  }, [dateStr, setValue]);

  // Conflict check when date changes
  useEffect(() => {
    if (!open || !dateStr) return;
    let cancelled = false;
    checkDayConflict(dateStr).then((res) => {
      if (!cancelled) setConflicts(res);
    });
    return () => {
      cancelled = true;
    };
  }, [dateStr, open]);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) {
      reset();
      setConflicts([]);
      setServerError(null);
      setSuccess(false);
      setSelectedEquipment([]);
      setEquipSearch('');
      const d = parseDateStr(defaultDate ?? todayStr);
      setDateYear(d.year);
      setDateMonth(d.month);
      setDateDay(d.day);
    }
  }

  function toggleEquipment(id: string) {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setValue(
      'equipmentIds',
      selectedEquipment.includes(id)
        ? selectedEquipment.filter((x) => x !== id)
        : [...selectedEquipment, id],
    );
  }

  function onSubmit(data: EventFormData) {
    setServerError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createEvent({
        ...data,
        equipmentIds: selectedEquipment,
      });
      if (!result.success) {
        setServerError(result.error ?? 'Failed.');
        return;
      }
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => setOpen(false), 900);
    });
  }

  const filteredEquipment = useMemo(
    () =>
      formOptions.equipment.filter(
        (e) =>
          e.name.toLowerCase().includes(equipSearch.toLowerCase()) ||
          e.serialNumber.toLowerCase().includes(equipSearch.toLowerCase()),
      ),
    [formOptions.equipment, equipSearch],
  );

  const ic =
    'w-full rounded-lg border border-primary/15 bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20 placeholder:text-foreground/25';
  const ec = 'mt-1 text-xs text-rose-400';

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <button className='flex items-center gap-2 rounded-xl bg-primary/15 px-4 py-2.5 text-sm font-semibold text-primary ring-1 ring-primary/30 transition-all hover:bg-primary/25'>
            <Plus className='h-4 w-4' /> New Event
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <Dialog.Content className='fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-primary/15 bg-[rgba(12,12,16,0.98)] p-6 shadow-2xl backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200'>
          {/* Header */}
          <div className='mb-5 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15'>
                <Calendar className='h-4 w-4 text-primary' />
              </span>
              <div>
                <Dialog.Title className='text-sm font-semibold'>
                  Create Event
                </Dialog.Title>
                <Dialog.Description className='text-xs text-foreground/40'>
                  Book a studio session
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className='rounded-lg p-1.5 text-foreground/40 hover:bg-foreground/8 hover:text-foreground transition-colors'>
                <X className='h-4 w-4' />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            {/* Title */}
            <div>
              <label className='mb-1.5 block text-xs font-medium text-foreground/60'>
                Event Title
              </label>
              <input
                {...register('title')}
                placeholder='e.g. Portrait Session — Jane Doe'
                className={ic}
              />
              {errors.title && <p className={ec}>{errors.title.message}</p>}
            </div>

            {/* ── Dark-theme Date Picker (3 selects) ─────────────────────── */}
            <div>
              <label className='mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground/60'>
                <Calendar className='h-3 w-3' /> Date
              </label>
              <input type='hidden' {...register('date')} value={dateStr} />
              <div className='grid grid-cols-3 gap-2'>
                {/* Day */}
                <div className='relative'>
                  <select
                    value={dateDay}
                    onChange={(e) => setDateDay(Number(e.target.value))}
                    className={`${ic} appearance-none pr-7`}
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {String(d).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/30' />
                </div>
                {/* Month */}
                <div className='relative'>
                  <select
                    value={dateMonth}
                    onChange={(e) => setDateMonth(Number(e.target.value))}
                    className={`${ic} appearance-none pr-7`}
                  >
                    {MONTHS.map((mo, i) => (
                      <option key={mo} value={i + 1}>
                        {mo}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/30' />
                </div>
                {/* Year */}
                <div className='relative'>
                  <select
                    value={dateYear}
                    onChange={(e) => setDateYear(Number(e.target.value))}
                    className={`${ic} appearance-none pr-7`}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/30' />
                </div>
              </div>
              {errors.date && <p className={ec}>{errors.date.message}</p>}
            </div>

            {/* Location */}
            <div>
              <label className='mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground/60'>
                <MapPin className='h-3 w-3' /> Location
              </label>
              <div className='relative'>
                <select
                  {...register('location')}
                  className={`${ic} appearance-none pr-7`}
                >
                  {STUDIO_LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/30' />
              </div>
            </div>

            {/* Start time + Duration */}
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground/60'>
                  <Clock className='h-3 w-3' /> Start Time (UTC)
                </label>
                <div className='flex gap-1.5'>
                  <div className='relative flex-1'>
                    <select
                      {...register('startHour')}
                      className={`${ic} appearance-none pr-6 px-2`}
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={String(h)}>
                          {pad(h)}h
                        </option>
                      ))}
                    </select>
                    <ChevronDown className='pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/30' />
                  </div>
                  <div className='relative w-16'>
                    <select
                      {...register('startMinute')}
                      className={`${ic} appearance-none pr-6 px-2`}
                    >
                      {MINUTES.map((m) => (
                        <option key={m} value={String(m)}>
                          :{pad(m)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className='pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground/30' />
                  </div>
                </div>
              </div>
              <div>
                <label className='mb-1.5 block text-xs font-medium text-foreground/60'>
                  Duration (hrs)
                </label>
                <input
                  type='number'
                  step='0.5'
                  min='0.5'
                  max='24'
                  {...register('durationHours')}
                  placeholder='2'
                  className={ic}
                />
                {errors.durationHours && (
                  <p className={ec}>{errors.durationHours.message}</p>
                )}
              </div>
            </div>

            {/* Client selector */}
            {formOptions.clients.length > 0 && (
              <div>
                <label className='mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground/60'>
                  <User className='h-3 w-3' /> Client (optional)
                </label>
                <div className='relative'>
                  <select
                    {...register('clientId')}
                    className={`${ic} appearance-none pr-7`}
                  >
                    <option value=''>— No client —</option>
                    {formOptions.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/30' />
                </div>
              </div>
            )}

            {/* Equipment multi-select */}
            {formOptions.equipment.length > 0 && (
              <div>
                <label className='mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground/60'>
                  <Package className='h-3 w-3' /> Equipment (optional)
                </label>
                <div className='rounded-lg border border-primary/15 bg-[rgba(255,255,255,0.03)] p-2'>
                  {/* Search */}
                  <input
                    value={equipSearch}
                    onChange={(e) => setEquipSearch(e.target.value)}
                    placeholder='Search equipment…'
                    className='mb-2 w-full rounded-md border border-primary/10 bg-transparent px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-foreground/25 focus:border-primary/30'
                  />
                  {/* List */}
                  <div className='max-h-36 space-y-1 overflow-y-auto pr-1'>
                    {filteredEquipment.length === 0 && (
                      <p className='py-2 text-center text-xs text-foreground/30'>
                        No equipment found
                      </p>
                    )}
                    {filteredEquipment.map((eq) => {
                      const checked = selectedEquipment.includes(eq.id);
                      return (
                        <button
                          key={eq.id}
                          type='button'
                          onClick={() => toggleEquipment(eq.id)}
                          className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                            checked
                              ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                              : 'text-foreground/60 hover:bg-foreground/5'
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition-colors ${
                              checked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-foreground/20'
                            }`}
                          >
                            {checked ? '✓' : ''}
                          </span>
                          <span className='flex-1 truncate font-medium'>
                            {eq.name}
                          </span>
                          <span className='font-mono text-foreground/30'>
                            {eq.serialNumber}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedEquipment.length > 0 && (
                    <p className='mt-1.5 text-right text-[10px] text-primary/70'>
                      {selectedEquipment.length} item
                      {selectedEquipment.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className='mb-1.5 block text-xs font-medium text-foreground/60'>
                Notes (optional)
              </label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder='Additional details about the session…'
                className={`${ic} resize-none`}
              />
            </div>

            {/* ⚠️ Soft conflict warning */}
            <AnimatePresence>
              {conflicts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className='flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3'
                >
                  <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-amber-400' />
                  <div>
                    <p className='text-xs font-semibold text-amber-400'>
                      ⚠️ {conflicts.length} existing event
                      {conflicts.length > 1 ? 's' : ''} on this day
                    </p>
                    <p className='mt-0.5 text-xs text-amber-400/70'>
                      You can still proceed — double-booking is allowed.
                    </p>
                    <ul className='mt-1.5 space-y-0.5'>
                      {conflicts.slice(0, 3).map((c) => (
                        <li key={c.id} className='text-xs text-amber-400/60'>
                          • {c.title} @ {c.location}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feedback */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2.5 text-xs text-rose-400 ring-1 ring-rose-500/20'
                >
                  <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                  {serverError}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className='flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400 ring-1 ring-emerald-500/20'
                >
                  <CheckCircle2 className='h-3.5 w-3.5 shrink-0' />
                  Event created!
                </motion.div>
              )}
            </AnimatePresence>

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
                disabled={isPending || success}
                className='flex-1 rounded-xl bg-primary/15 py-2.5 text-sm font-semibold text-primary ring-1 ring-primary/30 transition-all hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isPending ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
