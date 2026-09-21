import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Dealer } from '@/@types/dealer.types';
import { TextTruncate } from '@/components/ui/text-truncate';

interface DealerTableProps {
    dealers: Dealer[];
    isLoading?: boolean;
    onEdit: (dealer: Dealer) => void;
    onDelete: (dealer: Dealer) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export function DealerTable({
    dealers,
    isLoading = false,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: DealerTableProps) {
    const columns = useMemo<ColumnDef<Dealer>[]>(
        () => [
            {
                header: 'KODE DEALER',
                accessorKey: 'code',
                cell: (item) => item.code || '-',
            },
            {
                header: 'NAMA DEALER',
                accessorKey: 'namaDealer',
                className: 'font-medium text-gray-900 truncate',
            },
            {
                header: 'ALAMAT',
                accessorKey: 'alamat',
                cell: (item) => <TextTruncate text={item.alamat || '-'} maxLength={48} className="block max-w-[260px] truncate" />,
            },
            {
                header: 'PIC',
                accessorKey: 'pic',
                cell: (item) => item.pic || '-',
            },
            {
                header: 'PHONE',
                accessorKey: 'handphone',
                cell: (item) => item.handphone || '-',
            },
            {
                header: 'Aksi',
                alignment: 'center',
                sticky: 'right',
                cell: (item) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                            <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(item)} disabled={!canDelete} className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
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
            data={dealers}
            columns={columns}
            loading={isLoading}
        />
    );
}
