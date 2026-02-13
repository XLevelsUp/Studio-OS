import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get counts for dashboard stats
  const [equipmentCount, clientsCount, activeRentalsCount] = await Promise.all([
    supabase.from('equipment').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase
      .from('rentals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
  ]);

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-slate-500 mt-2'>
          Welcome to your rental management system
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {equipmentCount.count || 0}
            </div>
            <p className='text-xs text-slate-500 mt-1'>Items in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{clientsCount.count || 0}</div>
            <p className='text-xs text-slate-500 mt-1'>Registered clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Rentals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {activeRentalsCount.count || 0}
            </div>
            <p className='text-xs text-slate-500 mt-1'>Currently rented out</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Get started with your rental management system
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <h3 className='font-semibold mb-2'>1. Add Equipment</h3>
            <p className='text-sm text-slate-600'>
              Go to Equipment section to add your camera gear, lenses, and other
              rental items.
            </p>
          </div>
          <div>
            <h3 className='font-semibold mb-2'>2. Register Clients</h3>
            <p className='text-sm text-slate-600'>
              Add client information in the Clients section for quick rental
              processing.
            </p>
          </div>
          <div>
            <h3 className='font-semibold mb-2'>3. Create Rentals</h3>
            <p className='text-sm text-slate-600'>
              Start creating rentals by selecting clients and equipment items.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
