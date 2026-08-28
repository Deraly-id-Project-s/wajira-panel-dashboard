import { useMemo, useState } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { VendorImportModal } from '@/components/features/vendor/VendorImportModal';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Download } from 'lucide-react';
import type { Vendor } from '@/@types/vendor.types';
import { ReferenceLink } from '@/components/ui/reference-link';
import { CopyBox } from '@/components/ui/copy-box';

interface VendorTableProps {
    vendors: Vendor[];
    search: string;
    onSearchChange: (value: string) => void;
    page: number;
    perPage: number;
    totalData: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onAdd: () => void;

    onExport?: () => void;
    onEdit: (vendor: Vendor) => void;
    onDelete: (vendor: Vendor) => void;
    isExporting?: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export function VendorTable({
    vendors,
    search,
    onSearchChange,
    page,
    perPage,
    totalData,
    onPageChange,
    onPerPageChange,
    onAdd,

    onExport,
    onEdit,
    onDelete,
    isExporting = false,
    canCreate,
    canEdit,
    canDelete,
}: VendorTableProps) {
    const [isImportOpen, setIsImportOpen] = useState(false);

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
                            <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(item)} disabled={!canDelete} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
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
        <>
        <BaseTable
            data={vendors}
            columns={columns}
            searchPlaceholder="Search here"
            search={search}
            onSearchChange={onSearchChange}
            showLimitChange
            perPage={perPage}
            onPerPageChange={onPerPageChange}
            meta={{
                currentPage: page,
                perPage,
                lastPage: Math.ceil(totalData / perPage) || 1,
                total: totalData,
            }}
            onPageChange={onPageChange}
            headerActions={
                <div className="flex flex-wrap items-center gap-2">
                    {onExport && (
                        <Button onClick={onExport} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
                            <Download className="h-4 w-4 mr-2" />
                            {isExporting ? 'Exporting...' : 'Export'}
                        </Button>
                    )}
                    {canCreate && (
                        <>
                            {canCreate && (
                                <Button onClick={() => setIsImportOpen(true)} variant="outline" className="w-full sm:w-auto">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import
                                </Button>
                            )}
                            <Button onClick={onAdd} className="btn-primary!">
                                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                Tambah
                            </Button>
                        </>
                    )}
                </div>
            }
        />
        <VendorImportModal
            open={isImportOpen}
            onOpenChange={setIsImportOpen}
        />
        </>
    );
}
