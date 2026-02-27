'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getEvents,
  type StudioEvent,
  type EventFormOptions,
} from '@/actions/events';
import EventBadge from './EventBadge';
import CreateEventDialog from './CreateEventDialog';
import EventDetailSheet from './EventDetailSheet';

interface CalendarGridProps {
  initialEvents: StudioEvent[];
  initialMonth: number;
  initialYear: number;
  currentUserId: string;
  isAdmin: boolean;
  formOptions: EventFormOptions;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function buildCalendarDays(year: number, month: number) {
  // month is 1-based
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysInPrev = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  const cells: {
    date: Date | null;
    dayNum: number | null;
    isCurrentMonth: boolean;
  }[] = [];

  // Leading previous-month ghost days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(Date.UTC(year, month - 2, daysInPrev - i)),
      dayNum: daysInPrev - i,
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(Date.UTC(year, month - 1, d)),
      dayNum: d,
      isCurrentMonth: true,
    });
  }

  // Trailing days to fill grid (ensure multiple of 7)
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(Date.UTC(year, month, d)),
        dayNum: d,
        isCurrentMonth: false,
      });
    }
  }

  return cells;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function eventsBelongToDay(events: StudioEvent[], dateKey: string) {
  return events.filter((e) => e.startTime.slice(0, 10) === dateKey);
}

export default function CalendarGrid({
  initialEvents,
  initialMonth,
  initialYear,
  currentUserId,
  isAdmin,
  formOptions,
}: CalendarGridProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [events, setEvents] = useState<StudioEvent[]>(initialEvents);
  const [fetching, setFetching] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<StudioEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Re-fetch events whenever month/year changes
  useEffect(() => {
    // Skip the initial render (we already have initialEvents)
    if (month === initialMonth && year === initialYear) return;
    let cancelled = false;
    setFetching(true);
    getEvents(month, year).then((data) => {
      if (!cancelled) {
        setEvents(data);
        setFetching(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [month, year, initialMonth, initialYear]);

  const navigate = useCallback((dir: 1 | -1) => {
    setDirection(dir);
    setMonth((m) => {
      const next = m + dir;
      if (next > 12) {
        setYear((y) => y + 1);
        return 1;
      }
      if (next < 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return next;
    });
  }, []);

  const cells = buildCalendarDays(year, month);
  const today = toDateKey(new Date());

  function handleDayClick(dateKey: string, dayEvents: StudioEvent[]) {
    if (dayEvents.length === 1) {
      setSelectedEvent(dayEvents[0]);
      setSheetOpen(true);
    } else {
      setSelectedDate(dateKey);
    }
  }

  function handleEventClick(event: StudioEvent) {
    setSelectedEvent(event);
    setSheetOpen(true);
  }

  // After creating an event, re-fetch the currently-visible month
  // (don't do window.location.reload — that resets back to the server's UTC month)
  function handleCreateSuccess() {
    setFetching(true);
    getEvents(month, year).then((data) => {
      setEvents(data);
      setFetching(false);
    });
  }

  return (
    <div className='space-y-4'>
      {/* Calendar header: month nav + New Event button */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => navigate(-1)}
            className='flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 text-foreground/50 transition-colors hover:border-primary/40 hover:text-primary'
          >
            <ChevronLeft className='h-4 w-4' />
          </button>
          <h2 className='min-w-[180px] text-center text-base font-semibold text-foreground flex items-center justify-center gap-2'>
            {MONTH_LABELS[month - 1]} {year}
            {fetching && (
              <span className='inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary' />
            )}
          </h2>
          <button
            onClick={() => navigate(1)}
            className='flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 text-foreground/50 transition-colors hover:border-primary/40 hover:text-primary'
          >
            <ChevronRight className='h-4 w-4' />
          </button>
        </div>

        <CreateEventDialog
          defaultDate={selectedDate ?? today}
          onSuccess={handleCreateSuccess}
          formOptions={formOptions}
          trigger={
            <button className='flex items-center gap-2 rounded-xl bg-primary/15 px-4 py-2 text-sm font-semibold text-primary ring-1 ring-primary/30 transition-all hover:bg-primary/25'>
              <Plus className='h-4 w-4' />
              New Event
            </button>
          }
        />
      </div>

      {/* Calendar grid */}
      <div className='overflow-hidden rounded-2xl border border-primary/12 bg-[rgba(17,17,22,0.98)]'>
        {/* Day labels */}
        <div className='grid grid-cols-7 border-b border-primary/10'>
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className='py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-foreground/30'
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid cells with slide animation */}
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='grid grid-cols-7'
          >
            {cells.map((cell, i) => {
              if (!cell.date) return <div key={i} />;
              const dateKey = toDateKey(cell.date);
              const dayEvents = eventsBelongToDay(events, dateKey);
              const isToday = dateKey === today;

              return (
                <div
                  key={dateKey}
                  onClick={() =>
                    cell.isCurrentMonth && handleDayClick(dateKey, dayEvents)
                  }
                  className={`group relative min-h-[100px] border-b border-r border-primary/6 p-2 transition-colors last:border-r-0 
                    ${cell.isCurrentMonth ? 'cursor-pointer hover:bg-primary/4' : 'opacity-25'}
                    ${i % 7 === 6 ? 'border-r-0' : ''}
                  `}
                >
                  {/* Day number */}
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors
                      ${
                        isToday
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-foreground/50 group-hover:text-foreground/70'
                      }
                    `}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Event badges */}
                  <div className='mt-1 space-y-0.5'>
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventBadge
                        key={event.id}
                        event={event}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className='pl-1 text-[10px] text-foreground/30'>
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>

                  {/* Quick add affordance on hover */}
                  {cell.isCurrentMonth && dayEvents.length === 0 && (
                    <div className='absolute bottom-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100'>
                      <Plus className='h-3 w-3 text-foreground/20' />
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Event detail sheet */}
      <EventDetailSheet
        event={selectedEvent}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedEvent(null);
        }}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
      />
    </div>
  );
}
