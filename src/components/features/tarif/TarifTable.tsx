import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import type { Tarif } from '@/types/tarif.types';
import type { PaginationMeta } from '@/types/pagination.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface TarifTableProps {
    data: Tarif[];
    meta?: PaginationMeta;
    isLoading?: boolean;
    page: number;
    perPage: number;
    canEdit: boolean;
    canDelete: boolean;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onEdit: (tarif: Tarif) => void;
    onVersioning: (tarif: Tarif) => void;
    onDelete: (tarif: Tarif) => void;
}

export function TarifTable({
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
    onVersioning,
    onDelete,
}: TarifTableProps) {
    const columns = useMemo<ColumnDef<Tarif>[]>(
        () => [
            {
                header: 'LOADING IN',
                accessorKey: 'loadingIn',
                sortable: true,
                cell: (item) => item.loadingIn || '-',
            },
            {
                header: 'LOADING OUT',
                accessorKey: 'loadingOut',
                sortable: true,
                cell: (item) => item.loadingOut || '-',
            },
            {
                header: 'JARAK (KM)',
                accessorKey: 'distance',
                sortable: true,
                alignment: 'center',
                cell: (item) => item.distance ? item.distance + ' Km' : '-',
            },
            {
                header: 'UJ TOWING',
                accessorKey: 'ujTowing',
                sortable: true,
                alignment: 'right',
                cell: (item) => currenciesFormat('idr', item.ujTowing),
            },
            {
                header: 'UJ CDD',
                accessorKey: 'ujCdd',
                sortable: true,
                alignment: 'right',
                cell: (item) => currenciesFormat('idr', item.ujCdd),
            },
            {
                header: 'UJ FUSO',
                accessorKey: 'ujFuso',
                sortable: true,
                alignment: 'right',
                cell: (item) => currenciesFormat('idr', item.ujFuso),
            },
            {
                header: 'INV CDD',
                accessorKey: 'invCdd',
                sortable: true,
                alignment: 'right',
                cell: (item) => currenciesFormat('idr', item.invCdd),
            },
            {
                header: 'INV FUSO',
                accessorKey: 'invFuso',
                sortable: true,
                alignment: 'right',
                cell: (item) => currenciesFormat('idr', item.invFuso),
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
                                    onVersioning(item);
                                }}
                                className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                            >
                                Detail
                            </DropdownMenuItem>
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
        [onEdit, onVersioning, onDelete, canEdit, canDelete]
    );

    return (
        <BaseTable
            data={data}
            columns={columns}
            loading={isLoading}
            defaultSort={{ key: 'loadingIn', direction: 'asc' }}
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
