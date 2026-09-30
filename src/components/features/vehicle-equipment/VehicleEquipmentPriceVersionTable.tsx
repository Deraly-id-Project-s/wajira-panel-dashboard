import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Lock, MoreVertical, Pencil, Trash } from 'lucide-react';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import type { VehicleEquipmentPriceVersion } from '@/@types/vehicle-equipment-price-version.types';
import { formatDate } from '@/lib/utils/format';

interface Props {
  data: VehicleEquipmentPriceVersion[];
  isLoading?: boolean;
  onEdit: (version: VehicleEquipmentPriceVersion) => void;
  onDelete: (version: VehicleEquipmentPriceVersion) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function VehicleEquipmentPriceVersionTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: Props) {
  const columns = useMemo<ColumnDef<VehicleEquipmentPriceVersion>[]>(
    () => [
      {
        header: 'NAMA VERSI',
        accessorKey: 'name',
        sortable: true,
        cell: (item) => (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-gray-900">{item.name}</span>
            {item.is_lock === 1 || item.is_lock === true ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-help p-0.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Versi harga ini terkunci.</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ),
      },
      {
        header: 'HARGA BELI',
        accessorKey: 'buy_price',
        sortable: true,
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', item.buy_price),
      },
      {
        header: 'HARGA JUAL',
        accessorKey: 'sell_price',
        sortable: true,
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', item.sell_price),
      },
      {
        header: 'BERLAKU DARI',
        accessorKey: 'effective_from',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.effective_from) || '-',
      },
      {
        header: 'BERLAKU SAMPAI',
        accessorKey: 'effective_until',
        sortable: true,
        alignment: 'center',
        cell: (item) => formatDate(item.effective_until) || '-',
      },
      {
        header: 'DEFAULT',
        accessorKey: 'is_default',
        sortable: true,
        alignment: 'center',
        cell: (item) =>
          item.is_default === 1 || item.is_default === true ? (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none gap-1">
              <CheckCircle2 className="h-3 w-3" /> Default
            </Badge>
          ) : (
            <span className="text-gray-400">-</span>
          ),
      },
      {
        header: 'AKSI',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => {
          const isLocked = item.is_lock === 1 || item.is_lock === true;
          const isDefault = item.is_default === 1 || item.is_default === true;

          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px] rounded-md border-slate-200 p-1.5 shadow-lg">
                  <DropdownMenuItem
                    onClick={() => onEdit(item)}
                    disabled={isLocked || !canEdit}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(item)}
                    disabled={isDefault || isLocked || !canDelete}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 disabled:cursor-not-allowed"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [canDelete, canEdit, onDelete, onEdit],
  );

  return <BaseTable data={data} columns={columns} loading={isLoading} defaultSort={{ key: 'id', direction: 'desc' }} />;
}
