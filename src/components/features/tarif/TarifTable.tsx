import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, ArrowRight } from 'lucide-react';
import type { Tarif } from '@/@types/tarif.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';

interface TarifTableProps {
    data: Tarif[];
    isLoading?: boolean;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: (tarif: Tarif) => void;
    onVersioning: (tarif: Tarif) => void;
    onDelete: (tarif: Tarif) => void;
}

export function TarifTable({
    data,
    isLoading = false,
    canEdit,
    canDelete,
    onEdit,
    onVersioning,
    onDelete,
}: TarifTableProps) {
    const columns = useMemo<ColumnDef<Tarif>[]>(
        () => [
            {
                header: 'RUTE (LOADING IN ➔ LOADING OUT)',
                accessorKey: 'loadingIn',
                sortable: false,
                className: 'min-w-[220px]',
                cell: (item) => {
                    const routes = item.routes || [];
                    if (routes.length > 0) {
                        return (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                {routes.map((r, idx) => (
                                    <span key={r.id || idx} className="inline-flex items-center gap-1">
                                        <span
                                            className={`font-semibold ${
                                                r.pivot?.state_at === 'loading_in'
                                                    ? 'text-blue-700'
                                                    : r.pivot?.state_at === 'loading_out'
                                                    ? 'text-emerald-700'
                                                    : 'text-slate-800'
                                            }`}
                                        >
                                            {r.name}
                                        </span>
                                        {idx < routes.length - 1 && (
                                            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        )}
                                    </span>
                                ))}
                            </div>
                        );
                    }

                    return (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <span className="text-blue-700">{item.loadingIn || '-'}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-emerald-700">{item.loadingOut || '-'}</span>
                        </div>
                    );
                },
            },
            {
                header: 'JARAK (KM)',
                accessorKey: 'distance',
                sortable: true,
                alignment: 'center',
                cell: (item) => (item.distance ? item.distance + ' Km' : '-'),
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
                header: 'Aksi',
                alignment: 'center',
                sticky: 'right',
                cell: (item) => (
                    <div className="flex justify-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                                <DropdownMenuItem
                                    onClick={() => onVersioning(item)}
                                    className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
                                >
                                    Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={!canEdit}
                                    onClick={() => onEdit(item)}
                                    className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    disabled={!canDelete}
                                    onClick={() => onDelete(item)}
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
        [onEdit, onVersioning, onDelete, canEdit, canDelete]
    );

    return (
        <BaseTable
            data={data}
            columns={columns}
            loading={isLoading}
            defaultSort={{ key: 'distance', direction: 'asc' }}
        />
    );
}
