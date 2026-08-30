import React, { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Region } from '@/@types/region.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface RegionTableProps {
    regions: Region[];
    isLoading?: boolean;
    onEdit: (region: Region) => void;
    onDelete: (region: Region) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export function RegionTable({
    regions,
    isLoading = false,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: RegionTableProps) {
    const columns = useMemo<ColumnDef<Region>[]>(
        () => [
            {
                header: 'KODE WILAYAH',
                accessorKey: 'code',
                sortable: true,
                alignment: 'center',
                className: 'w-[30%]',
                cell: (item) => item.code || '-',
            },
            {
                header: 'NAMA WILAYAH',
                accessorKey: 'name',
                sortable: true,
                alignment: 'left',
                className: 'w-[60%]',
                cell: (item) => (
                    <span className="truncate uppercase block" title={item.name}>
                        {item.name}
                    </span>
                ),
            },
            {
                header: 'Aksi',
                alignment: 'center',
                sticky: 'right',
                className: 'w-[80px]',
                cell: (item) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                                <MoreVertical className="h-4 w-4 text-gray-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                            <DropdownMenuItem
                                onClick={() => onEdit(item)}
                                disabled={!canEdit}
                                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(item)}
                                disabled={!canDelete}
                                className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                            >
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [canEdit, canDelete, onEdit, onDelete]
    );

    return (
        <BaseTable
            data={regions}
            columns={columns}
            loading={isLoading}
        />
    );
}
