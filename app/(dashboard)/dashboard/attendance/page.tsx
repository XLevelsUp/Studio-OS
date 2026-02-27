import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { Timer, Wallet, Users } from 'lucide-react';
import TimeClockWidget from '@/components/attendance/TimeClockWidget';
import PayrollTable, {
  type PayrollRow,
} from '@/components/attendance/PayrollTable';
import ManualAdjustmentDialog from '@/components/attendance/ManualAdjustmentDialog';
import {
  getActiveSession,
  getMyAttendanceLogs,
  getAllPayrollSummary,
} from '@/actions/attendance';

export const metadata: Metadata = {
  title: 'Attendance & Payroll — Dashboard',
  description: 'Track your work hours and view payroll information.',
};

export default async function AttendancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, fullName, role, "hourlyRate", currency')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const isAdmin = profile.role === 'ADMIN' || profile.role === 'SUPER_ADMIN';

  // --- Fetch data in parallel ---
  const [activeSession, myLogs, adminSummaryResult] = await Promise.all([
    getActiveSession(),
    getMyAttendanceLogs(),
    isAdmin ? getAllPayrollSummary() : Promise.resolve({ data: [] }),
  ]);

  // Shape my logs into PayrollRow[]
  const myPayrollRows: PayrollRow[] = (myLogs ?? []).map((log) => ({
    id: log.id,
    clockIn: log.clockIn,
    clockOut: log.clockOut ?? null,
    totalHours:
      log.totalHours !== null && log.totalHours !== undefined
        ? Number(log.totalHours)
        : null,
    hourlyRate: Number(profile.hourlyRate ?? 0),
    currency: profile.currency ?? 'USD',
  }));

  // Shape admin payroll data
  type AdminLog = {
    id: string;
    userId: string;
    clockIn: string;
    clockOut: string | null;
    totalHours: number | null;
    profiles?: {
      fullName: string | null;
      hourlyRate: number;
      currency: string;
    } | null;
  };

  const adminLogs =
    isAdmin && 'data' in adminSummaryResult
      ? ((adminSummaryResult.data ?? []) as unknown as AdminLog[])
      : [];

  const adminPayrollRows: PayrollRow[] = adminLogs.map((log) => ({
    id: log.id,
    clockIn: log.clockIn,
    clockOut: log.clockOut ?? null,
    totalHours:
      log.totalHours !== null && log.totalHours !== undefined
        ? Number(log.totalHours)
        : null,
    employeeName: log.profiles?.fullName ?? null,
    hourlyRate: Number(log.profiles?.hourlyRate ?? 0),
    currency: log.profiles?.currency ?? 'USD',
  }));

  // For the manual adjustment dialog, fetch all employee names (admin only)
  const employees: { id: string; fullName: string | null }[] = [];
  if (isAdmin) {
    const { data } = await supabase
      .from('profiles')
      .select('id, fullName')
      .order('fullName');
    if (data) employees.push(...data);
  }

  return (
    <div className='space-y-8'>
      {/* Page header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Attendance & Payroll
        </h1>
        <p className='mt-2 text-sm text-foreground/40'>
          Track your shifts and view estimated earnings for the current month.
        </p>
      </div>

      {/* Top row: Clock widget + quick stats */}
      <div className='grid gap-5 lg:grid-cols-3'>
        {/* Time Clock Widget */}
        <div className='lg:col-span-1'>
          <TimeClockWidget
            activeSession={activeSession}
            employeeName={profile.fullName ?? null}
          />
        </div>

        {/* Stats */}
        <div className='grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2 content-start'>
          {/* Hours this month */}
          <div className='flex flex-col justify-between rounded-2xl border border-primary/12 bg-[rgba(17,17,22,0.98)] p-5'>
            <div className='flex items-center gap-2 text-sm text-foreground/50'>
              <Timer className='h-4 w-4 text-primary' />
              Hours This Month
            </div>
            <div className='mt-4 text-3xl font-bold text-foreground'>
              {myPayrollRows
                .reduce((s, r) => s + (r.totalHours ?? 0), 0)
                .toFixed(1)}
              <span className='ml-1 text-base font-normal text-foreground/40'>
                hrs
              </span>
            </div>
          </div>

          {/* Gross salary */}
          <div className='flex flex-col justify-between rounded-2xl border border-primary/12 bg-[rgba(17,17,22,0.98)] p-5'>
            <div className='flex items-center gap-2 text-sm text-foreground/50'>
              <Wallet className='h-4 w-4 text-emerald-400' />
              Est. Gross This Month
            </div>
            <div className='mt-4 text-3xl font-bold text-emerald-400'>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: profile.currency ?? 'USD',
              }).format(
                myPayrollRows.reduce(
                  (s, r) => s + (r.totalHours ?? 0) * r.hourlyRate,
                  0,
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My Payroll Table */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-base font-semibold text-foreground'>
              My Shift Log
            </h2>
            <p className='text-xs text-foreground/40'>
              All completed shifts for the current calendar month.
            </p>
          </div>
        </div>
        <PayrollTable logs={myPayrollRows} isAdminView={false} />
      </section>

      {/* Admin section */}
      {isAdmin && (
        <section className='space-y-4 rounded-2xl border border-primary/10 bg-primary/3 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Users className='h-5 w-5 text-primary' />
              <div>
                <h2 className='text-base font-semibold text-foreground'>
                  Payroll Summary — All Employees
                </h2>
                <p className='text-xs text-foreground/40'>
                  Admin view: all shifts and earnings for the current month.
                </p>
              </div>
            </div>
            <ManualAdjustmentDialog employees={employees} />
          </div>

          <PayrollTable logs={adminPayrollRows} isAdminView={true} />
        </section>
      )}
    </div>
  );
}
