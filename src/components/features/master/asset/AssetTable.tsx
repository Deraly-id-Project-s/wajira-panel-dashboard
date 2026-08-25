import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload } from 'lucide-react';
import type { Asset } from '@/@types/asset.types';
import { CopyBox } from '@/components/ui/copy-box';

interface AssetTableProps {
    assets: Asset[];
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
    onEdit: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
    isExporting?: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

const formatAssetType = (type: string) => {
    const types: Record<string, string> = {
        inventory: 'Inventaris Kantor',
        vehicles: 'Kendaraan',
        buildings: 'Bangunan',
        land: 'Tanah',
    };
    return types[type] || type;
};

export function AssetTable({
    assets,
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
}: AssetTableProps) {
    const columns = useMemo<ColumnDef<Asset>[]>(
        () => [
            {
                header: 'KODE ASET',
                accessorKey: 'code',
                className: 'font-medium text-slate-900 uppercase',
                cell: (item) => <CopyBox text={item.code || '-'} />,
            },
            {
                header: 'TIPE ASET',
                accessorKey: 'type',
                cell: (item) => formatAssetType(item.type),
            },
            {
                header: 'NAMA BARANG',
                accessorKey: 'name',
            },
            {
                header: 'Aksi',
                alignment: 'center',
                sticky: 'right',
                cell: (item) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[100px] rounded-md p-2">
                            <DropdownMenuItem onClick={() => onEdit(item)} disabled={!canEdit} className="cursor-pointer rounded-md px-3 py-2.5 text-slate-700">
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(item)} disabled={!canDelete} className="cursor-pointer rounded-md px-3 py-2.5 text-red-600 focus:text-red-600">
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
            data={assets}
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
                            <Upload className="h-4 w-4 mr-2" />
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
                                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                Tambah
                            </Button>
                        </>
                    )}
                </div>
            }
        />
    );
}
