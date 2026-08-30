import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { VehicleEquipment } from '@/@types/vehicle-equipment.types';

interface VehicleEquipmentTableProps {
  equipments: VehicleEquipment[];
  isLoading?: boolean;
  onEdit: (equipment: VehicleEquipment) => void;
  onDelete: (equipment: VehicleEquipment) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function VehicleEquipmentTable({
  equipments,
  isLoading = false,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: VehicleEquipmentTableProps) {
  const columns = useMemo<ColumnDef<VehicleEquipment>[]>(
    () => [
      {
        header: 'KODE BARANG',
        accessorKey: 'code',
        alignment: 'center',
        className: 'font-medium text-slate-900',
        cell: (item) => item.code || '-',
      },
      {
        header: 'NAMA BARANG',
        accessorKey: 'name',
        alignment: 'center',
        className: 'text-gray-800 font-medium',
        cell: (item) => item.name || '-',
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full text-slate-600">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[140px] rounded-md border border-gray-100 bg-white shadow-lg p-1.5">
                <DropdownMenuItem
                  onClick={() => onEdit(item)}
                  disabled={!canEdit}
                  className="cursor-pointer text-slate-900 font-medium rounded-lg hover:bg-gray-50 px-3 py-2 text-sm"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  disabled={!canDelete}
                  className="text-red-600 cursor-pointer font-medium rounded-lg hover:bg-red-50 focus:bg-red-50 focus:text-red-600 px-3 py-2 text-sm"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, onEdit],
  );

  return (
    <BaseTable
      data={equipments}
      columns={columns}
      loading={isLoading}
      getRowId={(item) => item.uuid || String(item.id || '')}
    />
  );
}
