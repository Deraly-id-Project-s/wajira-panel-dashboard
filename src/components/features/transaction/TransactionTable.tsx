import { useMemo } from 'react';
import type { Transaction } from '@/@types/transaction.types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils/format';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { TableRow, TableHead } from '@/components/ui/table';

interface Props {
  data: Transaction[];
  onEdit: (trx: Transaction) => void;
  onDelete: (trx: Transaction) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function TransactionTable({ data, onEdit, onDelete, canEdit, canDelete }: Props) {
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        header: 'TANGGAL',
        id: 'date',
        accessorKey: 'date',
        sortable: true,
        alignment: 'center',
        cell: (trx) => <span className="whitespace-nowrap text-slate-700">{formatDate(trx.date)}</span>,
      },
      {
        header: 'NAMA TRANSAKSI',
        id: 'name',
        accessorKey: 'name',
        sortable: true,
        alignment: 'left',
        cell: (trx) => <CopyBox text={trx.name || '-'} />,
      },
      {
        header: 'Debet BCA USD',
        id: 'debitUSD',
        accessorKey: 'debitUSD',
        sortable: true,
        alignment: 'center',
        headerClassName: 'border-l border-slate-200',
        cell: (trx) => (
          <span className={trx.debitUSD ? 'text-green-600 font-medium' : 'text-slate-400'}>
            {trx.debitUSD ? currenciesFormat('usd', trx.debitUSD) : '0'}
          </span>
        ),
      },
      {
        header: 'Kredit BCA USD',
        id: 'creditUSD',
        accessorKey: 'creditUSD',
        sortable: true,
        alignment: 'center',
        cell: (trx) => (
          <span className={trx.creditUSD ? 'text-red-600 font-medium' : 'text-slate-400'}>
            {trx.creditUSD ? currenciesFormat('usd', trx.creditUSD) : '0'}
          </span>
        ),
      },
      {
        header: 'Debet BCA IDR',
        id: 'debitIDR',
        accessorKey: 'debitIDR',
        sortable: true,
        alignment: 'center',
        cell: (trx) => (
          <span className={trx.debitIDR ? 'text-green-600 font-medium' : 'text-slate-400'}>
            {trx.debitIDR ? currenciesFormat('idr', trx.debitIDR) : '0'}
          </span>
        ),
      },
      {
        header: 'Kredit BCA IDR',
        id: 'creditIDR',
        accessorKey: 'creditIDR',
        sortable: true,
        alignment: 'center',
        headerClassName: 'border-r border-slate-200',
        className: 'border-r border-slate-100',
        cell: (trx) => (
          <span className={trx.creditIDR ? 'text-red-600 font-medium' : 'text-slate-400'}>
            {trx.creditIDR ? currenciesFormat('idr', trx.creditIDR) : '0'}
          </span>
        ),
      },
      {
        header: 'DEBET CASH',
        id: 'debitCash',
        accessorKey: 'debitCash',
        sortable: true,
        alignment: 'center',
        cell: (trx) => (
          <span className={trx.debitCash ? 'text-green-600 font-medium' : 'text-slate-400'}>
            {trx.debitCash ? currenciesFormat('idr', trx.debitCash) : '0'}
          </span>
        ),
      },
      {
        header: 'KREDIT CASH',
        id: 'creditCash',
        accessorKey: 'creditCash',
        sortable: true,
        alignment: 'center',
        headerClassName: 'border-r border-slate-200',
        className: 'border-r border-slate-100',
        cell: (trx) => (
          <span className={trx.creditCash ? 'text-red-600 font-medium' : 'text-slate-400'}>
            {trx.creditCash ? currenciesFormat('idr', trx.creditCash) : '0'}
          </span>
        ),
      },
      {
        header: 'KETERANGAN',
        id: 'description',
        accessorKey: 'description',
        sortable: true,
        alignment: 'left',
        cell: (trx) => (
          <span className="text-slate-500 max-w-[150px] truncate block" title={trx.description}>
            {trx.description || '-'}
          </span>
        ),
      },
      {
        header: 'BUKTI TRANSAKSI',
        id: 'transactionProof',
        alignment: 'left',
        headerClassName: 'border-l border-slate-200',
        className: 'border-l border-slate-100',
        cell: (trx) => (
          typeof trx.transactionProof === 'string' && trx.transactionProof ? (
            trx.transactionProof.startsWith('http') ? (
              <a href={trx.transactionProof} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                Lihat Bukti
              </a>
            ) : (
              <CopyBox text={trx.transactionProof} />
            )
          ) : (
            '-'
          )
        ),
      },
      {
        header: 'ACTION',
        id: 'action',
        alignment: 'center',
        sticky: 'right',
        cell: (trx) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem onClick={() => onEdit(trx)} disabled={!canEdit} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(trx)} disabled={!canDelete} className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, onEdit]
  );

  const headerGroups = (
    <TableRow className="hover:bg-transparent border-b border-gray-200">
      <TableHead colSpan={2} className="bg-[#f8f9fa]"></TableHead>
      <TableHead colSpan={4} className="px-4 py-2 text-center text-xs font-semibold uppercase text-slate-500 border-l border-r border-slate-200 bg-[#f8f9fa]">
        BANK
      </TableHead>
      <TableHead colSpan={2} className="px-4 py-2 text-center text-xs font-semibold uppercase text-slate-500 border-r border-slate-200 bg-[#f8f9fa]">
        CASH
      </TableHead>
      <TableHead colSpan={2} className="bg-[#f8f9fa]"></TableHead>
      <TableHead className="bg-[#f8f9fa] sticky right-0 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)] w-[80px] min-w-[80px] max-w-[80px]"></TableHead>
    </TableRow>
  );

  return (
    <BaseTable
      data={data}
      columns={columns}
      headerGroups={headerGroups}
    />
  );
}
