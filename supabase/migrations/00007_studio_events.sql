-- =============================================================================
-- Migration 00007: Studio Events
-- Additive, non-breaking, fully idempotent. Safe to re-run.
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE 1: ENUM
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE 2: TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.studio_events (
  id            UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"      UUID                  NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT                  NOT NULL,
  description   TEXT,
  "startTime"   TIMESTAMPTZ           NOT NULL,
  "endTime"     TIMESTAMPTZ           NOT NULL,
  location      TEXT                  NOT NULL DEFAULT 'Studio A',
  status        public.event_status   NOT NULL DEFAULT 'PENDING',
  "createdAt"   TIMESTAMPTZ           NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ           NOT NULL DEFAULT now(),

  CONSTRAINT chk_event_times CHECK ("endTime" > "startTime")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE 3: INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Primary query: fetch all events in a date range
CREATE INDEX IF NOT EXISTS idx_events_start_time
  ON public.studio_events ("startTime");

-- Owner queries
CREATE INDEX IF NOT EXISTS idx_events_user
  ON public.studio_events ("userId");

-- Conflict detection: events on the same calendar day
CREATE INDEX IF NOT EXISTS idx_events_day
  ON public.studio_events (date_trunc('day', "startTime" AT TIME ZONE 'UTC'));

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE 4: AUTO-UPDATE updatedAt
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_events_updated_at ON public.studio_events;
CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.studio_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_events_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE 5: ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.studio_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can see all events (for scheduling awareness)
DROP POLICY IF EXISTS "Authenticated users: select all events" ON public.studio_events;
CREATE POLICY "Authenticated users: select all events"
  ON public.studio_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Any authenticated user can create an event (owner = their userId)
DROP POLICY IF EXISTS "Users: insert own events" ON public.studio_events;
CREATE POLICY "Users: insert own events"
  ON public.studio_events FOR INSERT
  WITH CHECK (auth.uid() = "userId");

-- Owner can update their own events; admins can update any
DROP POLICY IF EXISTS "Users/Admins: update events" ON public.studio_events;
CREATE POLICY "Users/Admins: update events"
  ON public.studio_events FOR UPDATE
  USING (
    auth.uid() = "userId"
    OR public.get_user_role(auth.uid()) IN ('ADMIN', 'SUPER_ADMIN')
  );

-- Owner can delete their own events; admins can delete any
DROP POLICY IF EXISTS "Users/Admins: delete events" ON public.studio_events;
CREATE POLICY "Users/Admins: delete events"
  ON public.studio_events FOR DELETE
  USING (
    auth.uid() = "userId"
    OR public.get_user_role(auth.uid()) IN ('ADMIN', 'SUPER_ADMIN')
  );

-- =============================================================================
-- DONE
-- Summary:
--   + event_status enum (PENDING | CONFIRMED | CANCELLED)
--   + studio_events table with check constraint (endTime > startTime)
--   + 3 performance indexes
--   + auto-updatedAt trigger
--   + RLS: all auth users SELECT; owner INSERT; owner|admin UPDATE/DELETE
-- =============================================================================
