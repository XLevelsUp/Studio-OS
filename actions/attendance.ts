'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  manualAdjustmentSchema,
  ManualAdjustmentFormData,
} from '@/lib/validations/attendance';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the authenticated user + their profile, or redirects to /login */
async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, "hourlyRate", currency, fullName')
    .eq('id', user.id)
    .single();

  return { supabase, user, profile };
}

/** Calculate hours between two ISO date strings, rounded to 4 dp */
function calcHours(clockIn: string, clockOut: string): number {
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  return Math.round((ms / 3_600_000) * 10_000) / 10_000; // 4 decimal places
}

// ---------------------------------------------------------------------------
// Clock In
// ---------------------------------------------------------------------------
export async function clockIn() {
  const { supabase, user } = await getAuthUser();

  // Check for any existing open session
  const { data: existing } = await supabase
    .from('attendance_logs')
    .select('id, "clockIn"')
    .eq('userId', user.id)
    .is('clockOut', null)
    .maybeSingle();

  if (existing) {
    // Detect if it's from a previous calendar day
    const sessionDate = new Date(existing.clockIn).toDateString();
    const today = new Date().toDateString();

    if (sessionDate !== today) {
      return {
        error: 'Incomplete shift detected. Please request a manual adjustment.',
      };
    }

    return {
      error: 'You already have an active shift. Please clock out first.',
    };
  }

  const { error } = await supabase.from('attendance_logs').insert({
    userId: user.id,
    clockIn: new Date().toISOString(),
  });

  if (error) {
    console.error('Clock-in error:', error);
    return { error: 'Failed to clock in. Please try again.' };
  }

  revalidatePath('/dashboard/attendance');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Clock Out
// ---------------------------------------------------------------------------
export async function clockOut() {
  const { supabase, user } = await getAuthUser();

  // Find the active session
  const { data: activeLog } = await supabase
    .from('attendance_logs')
    .select('id, "clockIn"')
    .eq('userId', user.id)
    .is('clockOut', null)
    .maybeSingle();

  if (!activeLog) {
    return { error: 'No active shift found.' };
  }

  const now = new Date().toISOString();
  const totalHours = calcHours(activeLog.clockIn, now);

  const { error } = await supabase
    .from('attendance_logs')
    .update({
      clockOut: now,
      totalHours,
    })
    .eq('id', activeLog.id);

  if (error) {
    console.error('Clock-out error:', error);
    return { error: 'Failed to clock out. Please try again.' };
  }

  revalidatePath('/dashboard/attendance');
  return { success: true, totalHours };
}

// ---------------------------------------------------------------------------
// Get my attendance logs (for payroll table)
// ---------------------------------------------------------------------------
export async function getMyAttendanceLogs(month?: number, year?: number) {
  const { supabase, user } = await getAuthUser();

  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1; // 1–12
  const targetYear = year ?? now.getFullYear();

  const from = new Date(targetYear, targetMonth - 1, 1).toISOString();
  const to = new Date(targetYear, targetMonth, 1).toISOString();

  const { data, error } = await supabase
    .from('attendance_logs')
    .select('id, "clockIn", "clockOut", "totalHours"')
    .eq('userId', user.id)
    .gte('clockIn', from)
    .lt('clockIn', to)
    .order('clockIn', { ascending: false });

  if (error) {
    console.error('Attendance fetch error:', error);
    return [];
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Get active session (for dashboard widget)
// ---------------------------------------------------------------------------
export async function getActiveSession() {
  const { supabase, user } = await getAuthUser();

  const { data } = await supabase
    .from('attendance_logs')
    .select('id, "clockIn"')
    .eq('userId', user.id)
    .is('clockOut', null)
    .maybeSingle();

  return data ?? null;
}

// ---------------------------------------------------------------------------
// Get payroll summary for all employees (Admin / Super Admin only)
// ---------------------------------------------------------------------------
export async function getAllPayrollSummary(month?: number, year?: number) {
  const { supabase, profile } = await getAuthUser();

  if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
    return { error: 'Insufficient permissions.' };
  }

  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const from = new Date(targetYear, targetMonth - 1, 1).toISOString();
  const to = new Date(targetYear, targetMonth, 1).toISOString();

  // Fetch all completed logs in the period
  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select(
      'id, "userId", "clockIn", "clockOut", "totalHours", profiles!attendance_logs_userId_fkey(fullName, "hourlyRate", currency)',
    )
    .gte('clockIn', from)
    .lt('clockIn', to)
    .not('clockOut', 'is', null)
    .order('"clockIn"', { ascending: false });

  if (error) {
    console.error('Payroll summary error:', error);
    return { error: 'Failed to fetch payroll summary.' };
  }

  return { data: logs ?? [] };
}

// ---------------------------------------------------------------------------
// Request manual adjustment (Admin only)
// ---------------------------------------------------------------------------
export async function requestManualAdjustment(
  formData: ManualAdjustmentFormData,
) {
  const { supabase, profile } = await getAuthUser();

  if (!profile || !['ADMIN', 'SUPER_ADMIN'].includes(profile.role)) {
    return { error: 'Insufficient permissions.' };
  }

  const result = manualAdjustmentSchema.safeParse(formData);

  if (!result.success) {
    return { error: 'Invalid data.', details: result.error.flatten() };
  }

  const { logId, userId, clockIn, clockOut, reason: _reason } = result.data;
  const totalHours = calcHours(clockIn, clockOut);

  if (logId) {
    // Update existing log
    const { error } = await supabase
      .from('attendance_logs')
      .update({ clockIn, clockOut, totalHours })
      .eq('id', logId);

    if (error) {
      console.error('Manual adjustment update error:', error);
      return { error: 'Failed to update log.' };
    }
  } else {
    // Create a new corrected log
    const { error } = await supabase.from('attendance_logs').insert({
      userId,
      clockIn,
      clockOut,
      totalHours,
    });

    if (error) {
      console.error('Manual adjustment insert error:', error);
      return { error: 'Failed to create adjustment log.' };
    }
  }

  revalidatePath('/dashboard/attendance');
  return { success: true };
}
