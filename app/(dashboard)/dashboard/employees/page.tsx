import { Suspense } from 'react';
import { getEmployees } from '@/actions/employees';
import { EmployeeTable } from '@/components/employees/employee-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  console.log('--- Auth Debug ---');
  console.log('User ID:', user.id);
  console.log('Email:', profile?.email);
  console.log('Current Role:', profile?.role);
  console.log('------------------');

  const employees = await getEmployees();

  const canManage =
    profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN';

  return (
    <div className='flex-1 space-y-6 p-8 pt-6'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C2B280] opacity-75 mb-1'>
            Team Management
          </p>
          <h2 className='text-3xl font-bold tracking-tight text-white'>
            Employees
          </h2>
        </div>
        <div className='flex items-center space-x-2'>
          {canManage && (
            <Link href='/dashboard/employees/new'>
              <button
                className='
                flex items-center gap-2 rounded-xl
                border border-[rgba(194,178,128,0.35)]
                bg-[rgba(194,178,128,0.08)]
                px-5 py-2.5 text-sm font-semibold text-[#C2B280]
                transition-all duration-200
                hover:bg-[rgba(194,178,128,0.18)] hover:border-[rgba(194,178,128,0.60)]
                hover:text-white hover:shadow-[0_0_16px_rgba(194,178,128,0.20)]
              '
              >
                <Plus className='h-4 w-4' /> Add Employee
              </button>
            </Link>
          )}
        </div>
      </div>
      <div className='h-full flex-1 flex-col space-y-8 flex'>
        <Suspense
          fallback={
            <div className='text-[#E5DDC8] opacity-50 py-8 text-center'>
              Loading employees…
            </div>
          }
        >
          <EmployeeTable
            employees={employees || []}
            currentUserRole={profile?.role || 'EMPLOYEE'}
          />
        </Suspense>
      </div>
    </div>
  );
}
