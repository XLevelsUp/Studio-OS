-- =============================================================================
-- Migration 00006: Attendance & Payroll
-- Apply this in: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- 1. Add payroll fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "hourlyRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- 2. Create attendance_logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  "clockIn"   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "clockOut"  TIMESTAMPTZ,
  "totalHours" DECIMAL(8,4),
  "createdAt" TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 3. Partial unique index: one open session per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS attendance_logs_active_session_unique
  ON attendance_logs ("userId")
  WHERE "clockOut" IS NULL;

-- 4. Index for fast per-user + date-range queries
CREATE INDEX IF NOT EXISTS attendance_logs_user_clockin_idx
  ON attendance_logs ("userId", "clockIn" DESC);

-- 5. Auto-update updatedAt trigger
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_logs_updated_at
  BEFORE UPDATE ON attendance_logs
  FOR EACH ROW EXECUTE FUNCTION update_attendance_updated_at();

-- 6. Row Level Security
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Employees can select their own logs
CREATE POLICY "Users: select own attendance" ON attendance_logs
  FOR SELECT USING (auth.uid() = "userId");

-- Admins / Super Admins can select everything
CREATE POLICY "Admins: select all attendance" ON attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Users can only insert their own rows
CREATE POLICY "Users: insert own attendance" ON attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = "userId");

-- Users can update their own rows (clock out)
CREATE POLICY "Users: update own attendance" ON attendance_logs
  FOR UPDATE USING (auth.uid() = "userId");

-- Admins can update any row (manual adjustment)
CREATE POLICY "Admins: update all attendance" ON attendance_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );
