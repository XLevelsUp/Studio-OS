'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMemo } from 'react';
import { Wallet } from 'lucide-react';

export interface PayrollRow {
  id: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: number | null;
  // For admin view:
  employeeName?: string | null;
  hourlyRate: number;
  currency: string;
}

interface PayrollTableProps {
  logs: PayrollRow[];
  isAdminView?: boolean;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(hours: number | null) {
  if (hours === null) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${pad(m)}m`;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

const columnHelper = createColumnHelper<PayrollRow>();

export default function PayrollTable({
  logs,
  isAdminView = false,
}: PayrollTableProps) {
  const columns = useMemo<ColumnDef<PayrollRow, unknown>[]>(() => {
    const base: ColumnDef<PayrollRow, unknown>[] = [
      {
        accessorKey: 'clockIn',
        header: 'Shift Date',
        cell: (info) => (
          <span className='text-foreground/80'>
            {formatDate(info.getValue() as string)}
          </span>
        ),
      },
      {
        accessorKey: 'totalHours',
        header: 'Duration',
        cell: (info) => (
          <span className='font-mono text-sm text-foreground/70'>
            {formatDuration(info.getValue() as number | null)}
          </span>
        ),
      },
      columnHelper.display({
        id: 'earnings',
        header: 'Est. Earnings',
        cell: ({ row }) => {
          const hours = row.original.totalHours ?? 0;
          const earned = hours * row.original.hourlyRate;
          return (
            <span className='font-medium text-emerald-400'>
              {formatCurrency(earned, row.original.currency)}
            </span>
          );
        },
      }),
    ];

    if (isAdminView) {
      base.unshift({
        accessorKey: 'employeeName',
        header: 'Employee',
        cell: (info) => (
          <span className='font-medium text-foreground/90'>
            {(info.getValue() as string | null | undefined) ?? '—'}
          </span>
        ),
      });
    }

    return base;
  }, [isAdminView]);

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Gross salary for current month
  const gross = useMemo(() => {
    return logs.reduce((sum, log) => {
      return sum + (log.totalHours ?? 0) * log.hourlyRate;
    }, 0);
  }, [logs]);

  const displayCurrency = logs[0]?.currency ?? 'USD';

  if (logs.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-primary/10 bg-[rgba(17,17,22,0.6)] py-12 text-center'>
        <Wallet className='mb-3 h-8 w-8 text-foreground/20' />
        <p className='text-sm text-foreground/40'>
          No shifts recorded this month.
        </p>
      </div>
    );
  }

  return (
    <div className='overflow-hidden rounded-xl border border-primary/12 bg-[rgba(17,17,22,0.98)]'>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className='border-b border-primary/10'>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-foreground/40'
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-primary/6 transition-colors hover:bg-primary/4 ${
                  i % 2 === 0 ? '' : 'bg-white/[0.01]'
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className='px-4 py-3'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {/* Gross salary footer */}
          <tfoot>
            <tr className='border-t-2 border-primary/20 bg-primary/5'>
              <td
                colSpan={isAdminView ? 3 : 2}
                className='px-4 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/50'
              >
                Gross Salary —{' '}
                {new Date().toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}
              </td>
              <td className='px-4 py-3 text-base font-bold text-emerald-400'>
                {formatCurrency(gross, displayCurrency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
