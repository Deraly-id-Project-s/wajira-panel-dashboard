import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DealerImportModal } from '@/components/features/dealer/DealerImportModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Download } from 'lucide-react';
import type { Dealer } from '@/@types/dealer.types';

interface DealerTableProps {
    dealers: Dealer[];
    search: string;
    onSearchChange: (value: string) => void;
    page: number;
    perPage: number;
    totalData: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onAdd: () => void;

    onExport?: () => void;
    onEdit: (dealer: Dealer) => void;
    onDelete: (dealer: Dealer) => void;
    isExporting?: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export function DealerTable({
    dealers,
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
}: DealerTableProps) {
    const [isImportOpen, setIsImportOpen] = useState(false);

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
                cell: (item) => <span className="line-clamp-2">{item.alamat || '-'}</span>,
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
            data={dealers}
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
                            <Button onClick={onAdd} className="button-theme-1!">
                                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                Tambah
                            </Button>
                        </>
                    )}
                </div>
            }
        />
        <DealerImportModal
            open={isImportOpen}
            onOpenChange={setIsImportOpen}
        />
        </>
    );
}
