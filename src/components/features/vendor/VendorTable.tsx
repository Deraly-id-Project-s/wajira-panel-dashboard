import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Vendor } from '@/@types/vendor.types';
import { ReferenceLink } from '@/components/ui/reference-link';
import { CopyBox } from '@/components/ui/copy-box';

interface VendorTableProps {
    vendors: Vendor[];
    isLoading?: boolean;
    onEdit: (vendor: Vendor) => void;
    onDelete: (vendor: Vendor) => void;
    canEdit: boolean;
    canDelete: boolean;
}

export function VendorTable({
    vendors,
    isLoading = false,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: VendorTableProps) {
    const columns = useMemo<ColumnDef<Vendor>[]>(
        () => [
            {
                header: 'KODE VENDOR',
                accessorKey: 'code',
                cell: (item) => <CopyBox text={item.code || '-'} />,
            },
            {
                header: 'NAMA VENDOR',
                accessorKey: 'name',
                className: 'text-gray-900',
            },
            {
                header: 'ALAMAT',
                accessorKey: 'address',
                cell: (item) => item.address || '-',
            },
            {
                header: 'PIC',
                accessorKey: 'picName',
                cell: (item) => item.picName || '-',
            },
            {
                header: 'PHONE',
                accessorKey: 'phone',
                cell: (item) => item.phone ? <ReferenceLink href={`https://wa.me/${item.phone}`}>{item.phone}</ReferenceLink> : '-'
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
            data={vendors}
            columns={columns}
            loading={isLoading}
        />
    );
}
