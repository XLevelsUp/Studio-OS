'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { deleteEmployee } from '@/actions/employees';
import { useState } from 'react';

interface Employee {
  id: string;
  full_name: string | null;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
  branch_id: string | null;
  branches: { name: string } | null;
}

interface EmployeeTableProps {
  employees: Employee[];
  currentUserRole: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF';
}

export function EmployeeTable({
  employees,
  currentUserRole,
}: EmployeeTableProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this employee? This action cannot be undone.',
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteEmployee(id);
    setIsDeleting(false);

    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  };

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className='h-24 text-center'>
                No employees found.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell className='font-medium'>
                  {employee.full_name || 'N/A'}
                </TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      employee.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : employee.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {employee.role.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>{employee.branches?.name || 'N/A'}</TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' className='h-8 w-8 p-0'>
                        <span className='sr-only'>Open menu</span>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/dashboard/employees/${employee.id}`)
                        }
                      >
                        <Pencil className='mr-2 h-4 w-4' />
                        Edit
                      </DropdownMenuItem>
                      {currentUserRole === 'SUPER_ADMIN' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-red-600 focus:text-red-600'
                            onClick={() => handleDelete(employee.id)}
                            disabled={isDeleting}
                          >
                            <Trash className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
