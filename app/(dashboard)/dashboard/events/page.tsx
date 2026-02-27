import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Calendar, MapPin } from 'lucide-react';
import CalendarGrid from '@/components/events/CalendarGrid';
import { getEvents, getEventFormData } from '@/actions/events';

export const metadata: Metadata = {
  title: 'Studio Events — Dashboard',
  description: 'View and manage studio booking events.',
};

// Helper: build a legend item
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className='flex items-center gap-1.5'>
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className='text-xs text-foreground/40'>{label}</span>
    </div>
  );
}

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, fullName, role')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const isAdmin = profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN';

  // Fetch current month events (UTC)
  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  const [events, formOptions] = await Promise.all([
    getEvents(currentMonth, currentYear),
    getEventFormData(),
  ]);

  // Stats
  const confirmed = events.filter((e) => e.status === 'CONFIRMED').length;
  const pending = events.filter((e) => e.status === 'PENDING').length;
  const locations = [...new Set(events.map((e) => e.location))];

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Studio Events</h1>
          <p className='mt-1 text-sm text-foreground/40'>
            View and manage all studio bookings. Click any day to create or
            inspect events.
          </p>
        </div>
      </div>

      {/* Quick-stats row */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        {[
          {
            label: 'This Month',
            value: events.length,
            sub: 'total events',
            color: 'text-primary',
          },
          {
            label: 'Confirmed',
            value: confirmed,
            sub: 'booked & active',
            color: 'text-emerald-400',
          },
          {
            label: 'Pending',
            value: pending,
            sub: 'awaiting confirmation',
            color: 'text-amber-400',
          },
          {
            label: 'Locations',
            value: locations.length,
            sub: locations.slice(0, 2).join(', ') || 'none',
            color: 'text-foreground/60',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className='rounded-2xl border border-primary/10 bg-[rgba(17,17,22,0.98)] p-4'
          >
            <p className='text-xs text-foreground/40'>{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
            <p className='mt-0.5 text-xs text-foreground/30 truncate'>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className='flex items-center gap-4 rounded-xl border border-primary/8 bg-primary/3 px-4 py-2.5'>
        <div className='flex items-center gap-2 text-xs text-foreground/40'>
          <MapPin className='h-3.5 w-3.5' />
          Status:
        </div>
        <LegendDot color='bg-amber-400' label='Pending' />
        <LegendDot color='bg-emerald-400' label='Confirmed' />
        <LegendDot color='bg-rose-400' label='Cancelled' />
        <div className='ml-auto text-xs text-foreground/30'>
          <Calendar className='inline h-3.5 w-3.5 mr-1' />
          Times shown in UTC
        </div>
      </div>

      {/* Main calendar */}
      <CalendarGrid
        initialEvents={events}
        initialMonth={currentMonth}
        initialYear={currentYear}
        currentUserId={user.id}
        isAdmin={isAdmin}
        formOptions={formOptions}
      />
    </div>
  );
}
