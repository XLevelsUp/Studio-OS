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
    .select('role')
    .eq('id', user.id)
    .single();

  const employees = await getEmployees();

  const canManage =
    profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN';

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Employees</h2>
        <div className='flex items-center space-x-2'>
          {canManage && (
            <Link href='/dashboard/employees/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' /> Add Employee
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className='hidden h-full flex-1 flex-col space-y-8 md:flex'>
        <Suspense fallback={<div>Loading employees...</div>}>
          <EmployeeTable
            employees={employees || []}
            currentUserRole={profile?.role || 'STAFF'}
          />
        </Suspense>
      </div>
    </div>
  );
}
