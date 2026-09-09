import { useMemo } from 'react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Asset } from '@/@types/asset.types';
import { CopyBox } from '@/components/ui/copy-box';

interface AssetTableProps {
    assets: Asset[];
    isLoading?: boolean;
    onEdit: (asset: Asset) => void;
    onDelete: (asset: Asset) => void;
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
    isLoading = false,
    onEdit,
    onDelete,
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
            loading={isLoading}
        />
    );
}
