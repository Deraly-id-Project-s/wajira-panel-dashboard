import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ImageIcon, MoreVertical, Pencil, Trash } from 'lucide-react';
import type { Brand } from '@/@types/brand.types';
import type { PaginationMeta } from '@/@types/pagination.types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface BrandTableProps {
    data: Brand[];
    meta?: PaginationMeta;
    search: string;
    onSearchChange: (value: string) => void;
    page: number;
    perPage: number;
    isLoading?: boolean;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: (brand: Brand) => void;
    onDelete: (brand: Brand) => void;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}

export const BrandTable = ({
    data,
    meta,
    search,
    onSearchChange,
    page,
    perPage,
    isLoading = false,
    onEdit,
    onDelete,
    onPageChange,
    onPerPageChange,
    canEdit,
    canDelete,
}: BrandTableProps) => {
    const columns = useMemo<ColumnDef<Brand>[]>(
        () => [
            {
                header: 'NAMA MERK',
                accessorKey: 'name',
                sortable: true,
                cell: (item) => (
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-slate-50 overflow-hidden">
                            {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                            ) : (
                                <ImageIcon className="h-5 w-5 text-slate-400" />
                            )}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                    </div>
                ),
            },
            {
                header: 'TANGGAL DIBUAT',
                accessorKey: 'createdAt',
                sortable: true,
                alignment: 'center',
                cell: (item) => (
                    <span className="text-sm text-slate-600">
                        {item.createdAt ? format(new Date(item.createdAt), 'dd MMMM yyyy', { locale: localeId }) : '-'}
                    </span>
                ),
            },
            {
                header: 'aksi',
                alignment: 'center',
                sticky: 'right',
                cell: (item) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600 focus:text-red-600 focus:bg-red-50" disabled={!canDelete}>
                                <Trash className="mr-2 h-4 w-4" />
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [onEdit, onDelete, canEdit, canDelete],
    );

    return (
        <BaseTable
            data={data}
            columns={columns}
            loading={isLoading}
            searchPlaceholder="Search here"
            search={search}
            onSearchChange={onSearchChange}
            showLimitChange
            perPage={perPage}
            onPerPageChange={onPerPageChange}
            defaultSort={{ key: 'createdAt', direction: 'desc' }}
            meta={{
                currentPage: page,
                perPage,
                lastPage: meta?.lastPage ?? 1,
                total: meta?.total ?? data.length,
            }}
            onPageChange={onPageChange}
        />
    );
};
