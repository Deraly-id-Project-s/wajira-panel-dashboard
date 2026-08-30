import React, { useMemo } from 'react';
import { Download, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { FinanceAsset } from '@/@types/finance-asset.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { Badge } from '@/components/ui/badge';

interface FinanceAssetTableProps {
    assets: FinanceAsset[];
    search: string;
    onSearchChange: (value: string) => void;
    page: number;
    perPage: number;
    totalData: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    onExport: () => void;
    isExporting?: boolean;
    onAdd?: () => void;
    onEdit: (asset: FinanceAsset) => void;
    onDelete: (asset: FinanceAsset) => void;
    onDetail?: (asset: FinanceAsset) => void;
    isLoading?: boolean;
}

export function FinanceAssetTable({
    assets,
    search,
    onSearchChange,
    page,
    perPage,
    totalData,
    onPageChange,
    onPerPageChange,
    onExport,
    isExporting = false,
    onAdd,
    onEdit,
    onDelete,
    onDetail,
    isLoading = false,
}: FinanceAssetTableProps) {
    const totalPages = Math.max(1, Math.ceil(totalData / perPage));

    const columns = useMemo<ColumnDef<FinanceAsset>[]>(
        () => [
            {
                header: 'NAMA ASSET',
                accessorKey: 'name',
                alignment: 'left',
                cell: (item) => (
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{item.asset?.name || item.name || '-'}</span>
                        {item.asset?.code && <span className="text-xs text-slate-400">{item.asset.code}</span>}
                    </div>
                ),
            },
            {
                header: 'NO SN',
                accessorKey: 'serial_number',
                alignment: 'left',
                className: 'uppercase',
                cell: (item) =>
                    item.serial_number ? (
                        <CopyBox text={item.serial_number} />
                    ) : (
                        <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
                            -
                        </Badge>
                    ),
            },
            {
                header: 'BULAN PEROLEHAN',
                accessorKey: 'purchase_date',
                alignment: 'center',
                cell: (item) => {
                    if (!item.purchase_date) return '-';
                    const dateObj = new Date(item.purchase_date);
                    if (isNaN(dateObj.getTime())) return item.purchase_date;
                    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(dateObj);
                },
            },
            {
                header: 'HARGA PEROLEHAN',
                accessorKey: 'price',
                alignment: 'right',
                className: 'font-medium text-slate-900',
                cell: (item) => currenciesFormat('idr', item.price || 0),
            },
            {
                header: 'UMUR EKONOMIS (TH)',
                accessorKey: 'economic_age',
                alignment: 'center',
                cell: (item) =>
                    item.economic_age !== undefined && item.economic_age !== null
                        ? `${item.economic_age} Thn`
                        : '-',
            },
            {
                header: 'UMUR (BLN)',
                accessorKey: 'age',
                alignment: 'center',
                cell: (item) => {
                    const age = item.age ?? (item.economic_age ? item.economic_age * 12 : undefined);
                    return age !== undefined && age !== null ? `${age} Bln` : '-';
                },
            },
            {
                header: 'PENYUSUTAN PERBULAN',
                accessorKey: 'monthly_depreciation',
                alignment: 'right',
                className: 'font-medium text-slate-900',
                cell: (item) =>
                    currenciesFormat(
                        'idr',
                        item.monthly_depreciation ?? item.depreciation_per_month ?? item.depreciation ?? 0
                    ),
            },
            {
                header: 'BULAN TERPAKAI',
                accessorKey: 'months_used',
                alignment: 'center',
                cell: (item) =>
                    item.months_used !== undefined && item.months_used !== null
                        ? `${item.months_used} Bln`
                        : '-',
            },
            {
                header: 'AKM PENYUSUTAN',
                accessorKey: 'accumulated_depreciation',
                alignment: 'right',
                className: 'font-medium text-slate-900',
                cell: (item) => currenciesFormat('idr', item.accumulated_depreciation ?? 0),
            },
            {
                header: 'NILAI BUKU',
                accessorKey: 'book_value',
                alignment: 'right',
                className: 'font-medium text-slate-900',
                cell: (item) => currenciesFormat('idr', item.book_value ?? item.final_value ?? 0),
            },
            {
                header: 'STATUS',
                accessorKey: 'status',
                alignment: 'center',
                cell: (item) => {
                    const status = item.status || 'AKTIF';
                    const isAktif = status.toUpperCase() === 'AKTIF';
                    return (
                        <Badge
                            variant="outline"
                            className={
                                isAktif
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                            }
                        >
                            {status}
                        </Badge>
                    );
                },
            },
            {
                header: 'Aksi',
                alignment: 'center',
                sticky: 'right',
                className: 'w-[80px]',
                cell: (item) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[100px] rounded-md p-2">
                            <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2.5" onClick={() => onDetail?.(item)}>
                                Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2.5" onClick={() => onEdit(item)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 cursor-pointer rounded-md px-3 py-2.5" onClick={() => onDelete(item)}>
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        [onEdit, onDelete, onDetail]
    );

    const headerActions = useMemo(
        () => (
            <div className="flex flex-wrap items-center gap-2">
                <Button onClick={onExport} disabled={isExporting} variant="outline" className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export'}
                </Button>
                {onAdd && (
                    <Button onClick={onAdd} className="btn-primary!">
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah
                    </Button>
                )}
            </div>
        ),
        [onExport, isExporting, onAdd]
    );

    return (
        <BaseTable
            data={assets}
            columns={columns}
            loading={isLoading}
            search={search}
            onSearchChange={onSearchChange}
            showLimitChange={true}
            perPage={perPage}
            onPerPageChange={onPerPageChange}
            headerActions={headerActions}
            meta={{
                currentPage: page,
                perPage,
                lastPage: totalPages,
                total: totalData,
            }}
            onPageChange={onPageChange}
        />
    );
}
