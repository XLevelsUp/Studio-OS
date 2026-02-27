import type React from 'react';
import { MapPin } from 'lucide-react';
import type { StudioEvent } from '@/actions/events';

const STATUS_STYLES: Record<StudioEvent['status'], string> = {
  PENDING: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  CONFIRMED: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-400/60 ring-rose-500/15 line-through',
};

interface EventBadgeProps {
  event: Pick<StudioEvent, 'title' | 'status' | 'location' | 'startTime'>;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

export default function EventBadge({ event, onClick }: EventBadgeProps) {
  return (
    <button
      onClick={onClick}
      title={`${event.title} @ ${event.location}`}
      className={`flex w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium ring-1 transition-opacity hover:opacity-80 ${STATUS_STYLES[event.status]}`}
    >
      <span className='shrink-0 font-mono'>{fmtTime(event.startTime)}</span>
      <MapPin className='h-2.5 w-2.5 shrink-0' />
      <span className='truncate'>{event.title}</span>
    </button>
  );
}
