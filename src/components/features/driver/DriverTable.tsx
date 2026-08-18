import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import type { Driver } from '@/@types/driver.types';
import type { PaginationMeta } from '@/@types/pagination.types';

interface DriverTableProps {
    data: Driver[];
    meta?: PaginationMeta;
    isLoading?: boolean;
    page: number;
    perPage: number;
    canEdit: boolean;
    canDelete: boolean;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onEdit: (driver: Driver) => void;
    onDelete: (driver: Driver) => void;
}

const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

export function DriverTable({
    data,
    meta,
    isLoading = false,
    page,
    perPage,
    canEdit,
    canDelete,
    onPageChange,
    onPerPageChange,
    onEdit,
    onDelete,
}: DriverTableProps) {
    const columns = useMemo<ColumnDef<Driver>[]>(
        () => [
            {
                header: 'NAMA DRIVER',
                accessorKey: 'name',
                sortable: true,
                className: 'font-semibold text-gray-900',
                cell: (item) => item.name || '-',
            },
            {
                header: 'ALAMAT',
                accessorKey: 'address',
                sortable: true,
                cell: (item) => (
                    <span className="line-clamp-2 max-w-[220px]" title={item.address ?? undefined}>
                        {item.address || '-'}
                    </span>
                ),
            },
            {
                header: 'KTP',
                accessorKey: 'identityNumber',
                sortable: true,
                cell: (item) => item.identityNumber || '-',
            },
            {
                header: 'PHONE',
                accessorKey: 'phone',
                sortable: true,
                cell: (item) => item.phone || '-',
            },
            {
                header: 'SIM',
                accessorKey: 'driveLicenseNumber',
                sortable: true,
                cell: (item) => item.driveLicenseNumber || '-',
            },
            {
                header: 'TGL GABUNG',
                accessorKey: 'joinedAt',
                sortable: true,
                cell: (item) => formatDate(item.joinedAt),
            },
            {
                header: 'ACTION',
                alignment: 'center',
                sticky: 'right',
                cell: (item) => (
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
                                    onEdit(item);
                                }}
                                disabled={!canEdit}
                                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    onDelete(item);
                                }}
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
        [onEdit, onDelete, canEdit, canDelete]
    );

    return (
        <BaseTable
            data={data}
            columns={columns}
            loading={isLoading}
            defaultSort={{ key: 'name', direction: 'asc' }}
            meta={{
                currentPage: page,
                perPage,
                lastPage: meta?.lastPage ?? 1,
                total: meta?.total ?? data.length,
            }}
            onPageChange={onPageChange}
        />
    );
}
