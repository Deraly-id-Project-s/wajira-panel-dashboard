import React, { useMemo } from 'react';
import { Plus, MoreVertical, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Region } from '@/@types/region.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface RegionTableProps {
    regions: Region[];
    search: string;
    onSearchChange: (value: string) => void;
    page: number;
    perPage: number;
    totalData: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onAdd: () => void;
    onImport?: () => void;
    onExport?: () => void;
    onEdit: (region: Region) => void;
    onDelete: (region: Region) => void;
    isExporting?: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export function RegionTable({
    regions,
    search,
    onSearchChange,
    page,
    perPage,
    totalData,
    onPageChange,
    onPerPageChange,
    onAdd,
    onImport,
    onExport,
    onEdit,
    onDelete,
    isExporting = false,
    canCreate,
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

    const headerActions = useMemo(
        () => (
            <div className="flex flex-wrap items-center gap-2">
                {onExport && (
                    <Button onClick={onExport} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
                        <Download className="h-4 w-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                )}
                {canCreate && (
                    <>
                        {onImport && (
                            <Button onClick={onImport} variant="outline" className="w-full sm:w-auto">
                                <Upload className="h-4 w-4 mr-2" />
                                Import
                            </Button>
                        )}
                        <Button onClick={onAdd} className="button-theme-1!">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Data
                        </Button>
                    </>
                )}
            </div>
        ),
        [onExport, isExporting, canCreate, onImport, onAdd]
    );

    return (
        <BaseTable
            data={regions}
            columns={columns}
            search={search}
            onSearchChange={onSearchChange}
            showLimitChange={true}
            perPage={perPage}
            onPerPageChange={onPerPageChange}
            meta={{
                currentPage: page,
                perPage: perPage,
                lastPage: Math.max(1, Math.ceil(totalData / perPage)),
                total: totalData,
            }}
            onPageChange={onPageChange}
            headerActions={headerActions}
        />
    );
}
