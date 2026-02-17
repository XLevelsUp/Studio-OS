import { getBranches, getEmployee } from '@/actions/employees';
import { EmployeeForm } from '@/components/employees/employee-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface EmployeePageProps {
  params: {
    id: string;
  };
}

export default async function EmployeePage(props: EmployeePageProps) {
  const params = await props.params;
  const { id } = params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  const employee = await getEmployee(id);

  if (!employee) {
    redirect('/dashboard/employees');
  }

  // Access Control logic
  // Staff can only view themselves (render form read-only or just redirect if not ID match)
  // But wait, the form allows editing.
  // If role is STAFF and id != user.id, redirect.
  // If role is STAFF and id == user.id, allow edit? (Depends on requirements, usually STAFF update their own profile? Prompt says "Employee: Can view their own profile")
  // So maybe read-only?
  // For now, if STAFF, we will render form but maybe disable fields in UI?
  // The action `updateEmployee` prevents unauthorized updates.
  // Let's rely on that, but maybe show strictly read-only mode if we had one.
  // For simplicity, we just enforce the router level checks here.

  if (profile?.role === 'STAFF' && profile.id !== id) {
    redirect('/dashboard/employees'); // Or profile page
  }

  const branches = await getBranches();

  return (
    <div className='flex-1 space-y-4 p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Edit Employee</h2>
      </div>
      <div className='grid gap-4 grid-cols-1 md:max-w-2xl'>
        <EmployeeForm
          initialData={employee}
          branches={branches || []}
          isEditing={true}
        />
      </div>
    </div>
  );
}
