import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface VehicleEquipmentTableProps {
  equipments: VehicleEquipment[];
  isLoading?: boolean;
  onEdit: (equipment: VehicleEquipment) => void;
  onVersioning: (equipment: VehicleEquipment) => void;
  onDelete: (equipment: VehicleEquipment) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function VehicleEquipmentTable({
  equipments,
  isLoading = false,
  onEdit,
  onVersioning,
  onDelete,
  canEdit,
  canDelete,
}: VehicleEquipmentTableProps) {
  const columns = useMemo<ColumnDef<VehicleEquipment>[]>(
    () => [
      {
        header: 'KODE',
        accessorKey: 'code',
        sortable: true,
        className: 'font-mono text-slate-900',
        cell: (item) => item.code || '-',
      },
      {
        header: 'NAMA PERLENGKAPAN',
        accessorKey: 'name',
        sortable: true,
        className: 'text-gray-900 font-medium',
        cell: (item) => item.name || '-',
      },
      {
        header: 'DESKRIPSI',
        accessorKey: 'description',
        sortable: true,
        cell: (item) => item.description || '-',
      },
      {
        header: 'HARGA BELI',
        accessorKey: 'buy_price',
        sortable: true,
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', item.buy_price ?? item.buyPrice ?? 0),
      },
      {
        header: 'HARGA JUAL',
        accessorKey: 'sell_price',
        sortable: true,
        alignment: 'right',
        cell: (item) => currenciesFormat('idr', item.sell_price ?? item.sellPrice ?? 0),
      },
      {
        header: 'STOK',
        accessorKey: 'available_stock',
        sortable: true,
        alignment: 'center',
        cell: (item) => (
          <span className="font-semibold tabular-nums">
            {(item.available_stock ?? item.availableStock ?? 0).toLocaleString('id-ID')}
          </span>
        ),
      },
      {
        header: 'AKSI',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onVersioning(item);
                  }}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                >
                  Detail
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onEdit(item);
                  }}
                  disabled={!canEdit}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onDelete(item);
                  }}
                  disabled={!canDelete}
                  className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, onEdit, onVersioning],
  );

  return (
    <BaseTable
      data={equipments}
      columns={columns}
      loading={isLoading}
      defaultSort={{ key: 'name', direction: 'asc' }}
    />
  );
}
