import { Suspense } from 'react';
import { getEquipment, getCategories, getBranches } from '@/actions/equipment';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

export default async function EquipmentPage() {
  const equipment = await getEquipment();

  return (
    <div className='space-y-8'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Equipment</h1>
          <p className='text-slate-500 mt-2'>
            Manage your rental equipment inventory
          </p>
        </div>
        <Link href='/dashboard/equipment/new'>
          <Button>Add Equipment</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Equipment</CardTitle>
          <CardDescription>
            {equipment.length} items in inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rental Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-center text-slate-500 py-8'
                  >
                    No equipment found. Add your first item to get started.
                  </TableCell>
                </TableRow>
              ) : (
                equipment.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium'>{item.name}</TableCell>
                    <TableCell>{item.serial_number}</TableCell>
                    <TableCell>{item.categories?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'RENTED'
                              ? 'bg-blue-100 text-blue-700'
                              : item.status === 'MAINTENANCE'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>${item.rental_price}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/equipment/${item.id}`}>
                        <Button variant='outline' size='sm'>
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
