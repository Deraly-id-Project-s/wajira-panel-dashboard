import * as React from 'react';
import { CheckCircle2, Eye, FilePenLine, MoreVertical, Trash2 } from 'lucide-react';
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
import { formatKasBonDate, getKasBonApprovalClassName, getKasBonApprovalLabel, isKasBonPaid } from './kas-bon.utils';
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';

interface KasBonTableProps {
  data: DriverCashAdvance[];
  isLoading?: boolean;
  onEdit: (item: DriverCashAdvance) => void;
  onDelete: (item: DriverCashAdvance) => void;
  onApprove: (item: DriverCashAdvance) => void;
  onDetail: (item: DriverCashAdvance) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function KasBonTable({
  data,
  isLoading = false,
  onEdit,
  onDelete,
  onApprove,
  onDetail,
  canEdit,
  canDelete,
}: KasBonTableProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const [openMenuId, setOpenMenuId] = React.useState<number | null>(null);

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
        cell: (item) =>
          item?.driver ? <ReferenceLink target='_blank' href={`/dashboard/${slug}/master/driver/${item?.driver?.id}`}>{item?.driver?.name}</ReferenceLink> : '-',
      },
      {
        header: 'PENGAJUAN',
        accessorKey: 'is_driver_request',
        alignment: 'center',
        cell: (item) => {
          const isDriver = Boolean(item.is_driver_request ?? item.isDriverRequest);
          return (
            <Badge
              variant="outline"
              className={cn(
                'font-medium text-xs',
                isDriver
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-100 text-slate-700',
              )}
            >
              {isDriver ? 'Driver' : 'Kantor'}
            </Badge>
          );
        },
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
          <DropdownMenu
            open={openMenuId === item.id}
            onOpenChange={(open) => setOpenMenuId(open ? item.id : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 cursor-pointer rounded-full">
                <MoreVertical className="h-4 w-4 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[170px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem
                onSelect={() => {
                  setOpenMenuId(null);
                  onDetail(item);
                }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50"
              >
                Detail
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setOpenMenuId(null);
                  onApprove(item);
                }}
                disabled={!canEdit || item.isApprove}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50"
              >
                Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setOpenMenuId(null);
                  onEdit(item);
                }}
                disabled={!canEdit || item.isApprove}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50"
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setOpenMenuId(null);
                  onDelete(item);
                }}
                disabled={!canDelete || item.isApprove}
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600"
              >
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canDelete, canEdit, onApprove, onDelete, onDetail, onEdit, openMenuId, slug],
  );

  return <BaseTable data={data} columns={columns} loading={isLoading} defaultSort={{ key: 'id', direction: 'desc' }} />;
}
