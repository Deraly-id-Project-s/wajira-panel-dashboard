import * as React from 'react';
import { CheckCircle2, FilePenLine, MoreVertical, Trash2 } from 'lucide-react';
import type { DriverCashAdvance } from '@/@types/driver-cash-advance.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatKasBonDate, getKasBonApprovalClassName, getKasBonApprovalLabel } from './kas-bon.utils';

interface KasBonTableProps {
  data: DriverCashAdvance[];
  isLoading?: boolean;
  onEdit: (item: DriverCashAdvance) => void;
  onDelete: (item: DriverCashAdvance) => void;
  onApprove: (item: DriverCashAdvance) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function KasBonTable({
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onApprove,
  canEdit,
  canDelete,
}: KasBonTableProps) {
  const columns = React.useMemo<ColumnDef<DriverCashAdvance>[]>(
    () => [
      {
        header: 'KODE',
        accessorKey: 'code',
        sortable: true,
        cell: (item) => <CopyBox text={item.code || `KAS-BON-${item.id}`} />,
      },
      {
        header: 'DRIVER',
        accessorKey: 'driver.name',
        sortable: true,
        cell: (item) => item.driver?.name ?? '-',
      },
      {
        header: 'SUBJECT',
        accessorKey: 'subject',
        sortable: true,
        cell: (item) => <span className="font-medium text-slate-800">{item.subject || '-'}</span>,
      },
      {
        header: 'TANGGAL KLAIM',
        accessorKey: 'claimDate',
        sortable: true,
        cell: (item) => formatKasBonDate(item.claimDate),
      },
      {
        header: 'NOMINAL',
        accessorKey: 'claimNominal',
        alignment: 'right',
        sortable: true,
        cell: (item) => currenciesFormat('idr', item.claimNominal),
      },
      {
        header: 'APPROVAL',
        accessorKey: 'isApprove',
        alignment: 'center',
        cell: (item) => (
          <Badge variant="outline" className={cn('font-semibold', getKasBonApprovalClassName(item.isApprove))}>
            {getKasBonApprovalLabel(item.isApprove)}
          </Badge>
        ),
      },
      {
        header: 'TANGGAL APPROVE',
        accessorKey: 'approveDate',
        cell: (item) => formatKasBonDate(item.approveDate),
      },
      {
        header: 'ACTION',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 cursor-pointer rounded-full">
                <MoreVertical className="h-4 w-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[170px] rounded-xl border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onApprove(item);
                }}
                disabled={!canEdit || item.isApprove}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onEdit(item);
                }}
                disabled={!canEdit || item.isApprove}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50"
              >
                <FilePenLine className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onDelete(item);
                }}
                disabled={!canDelete || item.isApprove}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canDelete, canEdit, onApprove, onDelete, onEdit],
  );

  return <BaseTable data={data} columns={columns} loading={isLoading} defaultSort={{ key: 'id', direction: 'desc' }} />;
}
