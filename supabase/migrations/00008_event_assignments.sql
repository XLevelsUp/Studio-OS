-- =============================================================================
-- Migration 00008: Event Assignments — Client + Equipment Links
-- Additive, non-breaking, fully idempotent. Safe to re-run.
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE 1: Add optional clientId to studio_events
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.studio_events
  ADD COLUMN IF NOT EXISTS "clientId" UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_client
  ON public.studio_events ("clientId");

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE 2: Event Equipment junction table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_equipment (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId"     UUID  NOT NULL REFERENCES public.studio_events(id) ON DELETE CASCADE,
  "equipmentId" UUID  NOT NULL REFERENCES public.equipment(id)     ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_event_equipment UNIQUE ("eventId", "equipmentId")
);

CREATE INDEX IF NOT EXISTS idx_ee_event      ON public.event_equipment ("eventId");
CREATE INDEX IF NOT EXISTS idx_ee_equipment  ON public.event_equipment ("equipmentId");

-- ─────────────────────────────────────────────────────────────────────────────
-- STAGE 3: RLS on event_equipment
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.event_equipment ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view equipment assigned to events
DROP POLICY IF EXISTS "Auth users: select event equipment" ON public.event_equipment;
CREATE POLICY "Auth users: select event equipment"
  ON public.event_equipment FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Event owner or admin can assign equipment
DROP POLICY IF EXISTS "Owner/Admin: insert event equipment" ON public.event_equipment;
CREATE POLICY "Owner/Admin: insert event equipment"
  ON public.event_equipment FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.studio_events e
      WHERE e.id = "eventId"
        AND (
          e."userId" = auth.uid()
          OR public.get_user_role(auth.uid()) IN ('ADMIN', 'SUPER_ADMIN')
        )
    )
  );

-- Event owner or admin can remove equipment
DROP POLICY IF EXISTS "Owner/Admin: delete event equipment" ON public.event_equipment;
CREATE POLICY "Owner/Admin: delete event equipment"
  ON public.event_equipment FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.studio_events e
      WHERE e.id = "eventId"
        AND (
          e."userId" = auth.uid()
          OR public.get_user_role(auth.uid()) IN ('ADMIN', 'SUPER_ADMIN')
        )
    )
  );

-- =============================================================================
-- DONE
-- Summary:
--   + clientId (nullable FK) added to studio_events → clients
--   + event_equipment junction table (eventId ↔ equipmentId, unique pair)
--   + RLS: auth users SELECT; event owner | admin INSERT/DELETE
-- =============================================================================
