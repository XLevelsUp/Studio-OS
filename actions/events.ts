'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createEventSchema,
  type EventFormData,
} from '@/lib/validations/schemas';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type StudioEvent = {
  id: string;
  userId: string;
  clientId: string | null;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  // joined
  ownerName?: string | null;
  clientName?: string | null;
  equipment?: { id: string; name: string }[];
};

export type EventFormOptions = {
  clients: { id: string; name: string }[];
  equipment: { id: string; name: string; serialNumber: string }[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, fullName')
    .eq('id', user.id)
    .single();

  return { supabase, user, profile };
}

// ─────────────────────────────────────────────────────────────────────────────
// READ: Form dropdown options (clients + available equipment)
// ─────────────────────────────────────────────────────────────────────────────

export async function getEventFormData(): Promise<EventFormOptions> {
  const { supabase } = await getAuthUser();

  const [clientsRes, equipmentRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name')
      .is('deletedAt', null)
      .order('name'),
    supabase
      .from('equipment')
      .select('id, name, serialNumber')
      .is('deletedAt', null)
      .eq('status', 'AVAILABLE')
      .order('name'),
  ]);

  return {
    clients: (clientsRes.data ?? []) as { id: string; name: string }[],
    equipment: (equipmentRes.data ?? []) as {
      id: string;
      name: string;
      serialNumber: string;
    }[],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// READ: Fetch events for a given month (with client + equipment joins)
// ─────────────────────────────────────────────────────────────────────────────

export async function getEvents(
  month?: number,
  year?: number,
): Promise<StudioEvent[]> {
  const { supabase } = await getAuthUser();

  const now = new Date();
  const targetMonth = month ?? now.getUTCMonth() + 1;
  const targetYear = year ?? now.getUTCFullYear();

  const from = new Date(Date.UTC(targetYear, targetMonth - 1, 1)).toISOString();
  const to = new Date(Date.UTC(targetYear, targetMonth, 1)).toISOString();

  // ── Query 1: base events + owner profile (this join is known-good) ────────
  const { data: rawEvents, error: evErr } = await supabase
    .from('studio_events')
    .select(
      `id, userId, clientId, title, description,
       startTime, endTime, location, status, createdAt, updatedAt,
       profiles!studio_events_userId_fkey(fullName)`,
    )
    .gte('startTime', from)
    .lt('startTime', to)
    .order('startTime', { ascending: true });

  if (evErr || !rawEvents) {
    console.error('[getEvents] base query failed:', evErr?.message);
    return [];
  }

  const eventIds = rawEvents.map((e) => e.id as string);
  const clientIds = [
    ...new Set(
      rawEvents
        .map((e) => e.clientId as string | null)
        .filter((id): id is string => !!id),
    ),
  ];

  // ── Query 2: client names by ID (simple, no FK hint needed) ──────────────
  let clientMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .in('id', clientIds);
    clientMap = Object.fromEntries(
      (clients ?? []).map((c) => [c.id as string, c.name as string]),
    );
  }

  // ── Query 3: event_equipment rows with equipment name ────────────────────
  let equipMap: Record<string, { id: string; name: string }[]> = {};
  if (eventIds.length > 0) {
    const { data: eeRows } = await supabase
      .from('event_equipment')
      .select('eventId, equipment(id, name)')
      .in('eventId', eventIds);

    for (const row of eeRows ?? []) {
      const r = row as unknown as {
        eventId: string;
        equipment: { id: string; name: string } | null;
      };
      if (!r.equipment) continue;
      if (!equipMap[r.eventId]) equipMap[r.eventId] = [];
      equipMap[r.eventId].push(r.equipment);
    }
  }

  // ── Merge ─────────────────────────────────────────────────────────────────
  return rawEvents.map((row) => {
    const r = row as unknown as {
      id: string;
      userId: string;
      clientId: string | null;
      title: string;
      description: string | null;
      startTime: string;
      endTime: string;
      location: string;
      status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
      createdAt: string;
      updatedAt: string;
      profiles: { fullName: string | null } | null;
    };
    return {
      id: r.id,
      userId: r.userId,
      clientId: r.clientId,
      title: r.title,
      description: r.description,
      startTime: r.startTime,
      endTime: r.endTime,
      location: r.location,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      ownerName: r.profiles?.fullName ?? null,
      clientName: r.clientId ? (clientMap[r.clientId] ?? null) : null,
      equipment: equipMap[r.id] ?? [],
    } satisfies StudioEvent;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// READ: Conflict check (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export async function checkDayConflict(
  dateStr: string,
): Promise<StudioEvent[]> {
  const { supabase } = await getAuthUser();

  const dayStart = new Date(dateStr + 'T00:00:00.000Z').toISOString();
  const dayEnd = new Date(dateStr + 'T23:59:59.999Z').toISOString();

  const { data, error } = await supabase
    .from('studio_events')
    .select('id, title, startTime, endTime, location, status')
    .gte('startTime', dayStart)
    .lte('startTime', dayEnd)
    .neq('status', 'CANCELLED');

  if (error) {
    console.error('[checkDayConflict] Query failed:', error.message);
    return [];
  }

  return (data ?? []) as unknown as StudioEvent[];
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE: Create event (with optional client + equipment)
// ─────────────────────────────────────────────────────────────────────────────

export async function createEvent(
  raw: EventFormData,
): Promise<{ success: boolean; error?: string }> {
  const parsed = createEventSchema.safeParse(raw);

  if (!parsed.success) {
    const msg =
      Object.values(parsed.error.flatten().fieldErrors).flat().join(', ') ||
      'Validation failed';
    return { success: false, error: msg };
  }

  const {
    title,
    date,
    startHour,
    startMinute,
    durationHours,
    location,
    description,
    clientId,
    equipmentIds,
  } = parsed.data;

  const h = parseInt(startHour, 10);
  const m = parseInt(startMinute, 10);
  const dur = parseFloat(durationHours);

  const startTime = new Date(
    `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`,
  );
  const endTime = new Date(startTime.getTime() + dur * 3_600_000);

  const { supabase, user } = await getAuthUser();

  // Insert the event
  const { data: newEvent, error } = await supabase
    .from('studio_events')
    .insert({
      userId: user.id,
      clientId: clientId || null,
      title: title.trim(),
      description: description?.trim() || null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location,
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (error || !newEvent) {
    console.error('[createEvent] Insert failed:', error?.message);
    if (error?.code === '23514') {
      return { success: false, error: 'End time must be after start time.' };
    }
    return {
      success: false,
      error: 'Failed to create event. Please try again.',
    };
  }

  // Insert equipment links (if any)
  const eqIds = Array.isArray(equipmentIds) ? equipmentIds.filter(Boolean) : [];
  if (eqIds.length > 0) {
    const { error: eqError } = await supabase
      .from('event_equipment')
      .insert(
        eqIds.map((equipmentId) => ({ eventId: newEvent.id, equipmentId })),
      );
    if (eqError) {
      console.error('[createEvent] Equipment link failed:', eqError.message);
      // Don't fail the whole request — event is already created
    }
  }

  revalidatePath('/dashboard/events');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE: Update event status
// ─────────────────────────────────────────────────────────────────────────────

export async function updateEventStatus(
  eventId: string,
  status: 'CONFIRMED' | 'CANCELLED',
): Promise<{ success: boolean; error?: string }> {
  if (!eventId) return { success: false, error: 'Invalid event ID' };

  const { supabase } = await getAuthUser();

  const { error } = await supabase
    .from('studio_events')
    .update({ status })
    .eq('id', eventId);

  if (error) {
    console.error('[updateEventStatus] Update failed:', error.message);
    return { success: false, error: 'Failed to update event status.' };
  }

  revalidatePath('/dashboard/events');
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE: Delete event (cascades equipment links via FK)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteEvent(
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!eventId) return { success: false, error: 'Invalid event ID' };

  const { supabase } = await getAuthUser();

  const { error } = await supabase
    .from('studio_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('[deleteEvent] Delete failed:', error.message);
    return { success: false, error: 'Failed to delete event.' };
  }

  revalidatePath('/dashboard/events');
  return { success: true };
}
