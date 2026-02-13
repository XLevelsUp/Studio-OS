import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Rental Management',
  description: 'Manage your photo studio rental operations',
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='flex'>
        {/* Sidebar */}
        <aside className='w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0'>
          <div className='p-6'>
            <h1 className='text-2xl font-bold mb-8'>Rental System</h1>
            <nav className='space-y-2'>
              <a
                href='/dashboard'
                className='block px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors'
              >
                Dashboard
              </a>
              <a
                href='/dashboard/equipment'
                className='block px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors'
              >
                Equipment
              </a>
              <a
                href='/dashboard/clients'
                className='block px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors'
              >
                Clients
              </a>
              <a
                href='/dashboard/rentals'
                className='block px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors'
              >
                Rentals
              </a>
              {(profile?.role === 'ADMIN' ||
                profile?.role === 'SUPER_ADMIN') && (
                <>
                  <a
                    href='/dashboard/categories'
                    className='block px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors'
                  >
                    Categories
                  </a>
                  <a
                    href='/dashboard/branches'
                    className='block px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors'
                  >
                    Branches
                  </a>
                </>
              )}
              {profile?.role === 'SUPER_ADMIN' && (
                <a
                  href='/dashboard/audit-logs'
                  className='block px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors'
                >
                  Audit Logs
                </a>
              )}
            </nav>
          </div>
          <div className='absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800'>
            <div className='text-sm text-slate-400'>
              <p>{profile?.full_name || user.email}</p>
              <p className='text-xs mt-1'>{profile?.role}</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className='ml-64 flex-1 p-8'>{children}</main>
      </div>
    </div>
  );
}
