import Link from 'next/link';
import { useRouter } from 'next/router';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import type { PenerimaanPiutang } from '@/@types/penerimaan-piutang.types';
import type { LiabilityListMeta } from '@/types/pembayaran-hutang.types';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

interface Props {
    data: PenerimaanPiutang[];
    meta: LiabilityListMeta | null;
    loading?: boolean;
    error?: string | null;
    search?: string;
    perPage?: number;
    currentPage?: number;
    onSearchChange?: (value: string) => void;
    onPerPageChange?: (value: number) => void;
    onPageChange?: (value: number) => void;
    onDelete?: (item: PenerimaanPiutang) => void;
    onRetry?: () => void;
}

const formatDate = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID');
};

export default function PenerimaanPiutangTable({ data, meta, loading, error, search, perPage, currentPage, onSearchChange, onPerPageChange, onPageChange, onDelete, onRetry }: Props) {
    const router = useRouter();
    const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
    const showActions = typeof onDelete === 'function';

    const startIndex = meta?.from ?? (data.length > 0 ? ((currentPage ?? 1) - 1) * (perPage ?? 1) + 1 : 0);

    const columns: ColumnDef<PenerimaanPiutang>[] = [
        {
            header: 'No',
            alignment: 'center',
            cell: (_, index) => <span className="text-slate-500">{startIndex + index}</span>,
        },
        {
            header: 'No. Transaksi',
            accessorKey: 'code',
            sortable: true,
            alignment: 'left',
            cell: (item) => <span className="font-medium text-slate-900">{item.code}</span>,
        },
        {
            header: 'Tanggal',
            accessorKey: 'date',
            sortable: true,
            alignment: 'center',
            cell: (item) => <span className="text-slate-500">{formatDate(item.date)}</span>,
        },
        {
            header: 'Customer',
            accessorKey: 'supplier_name',
            sortable: true,
            alignment: 'left',
            cell: (item) => <span className="text-slate-700">{item.supplier_name}</span>,
        },
        {
            header: 'Total Piutang',
            accessorKey: 'grand_total',
            sortable: true,
            alignment: 'center',
            cell: (item) => <span className="font-medium text-slate-900">{currenciesFormat('idr', item.grand_total)}</span>,
        },
        {
            header: 'Total Diterima',
            accessorKey: 'total_paid',
            sortable: true,
            alignment: 'center',
            cell: (item) => <span className="font-medium text-emerald-600">{currenciesFormat('idr', item.total_paid)}</span>,
        },
        {
            header: 'Sisa Piutang',
            accessorKey: 'remaining_payment',
            sortable: true,
            alignment: 'center',
            cell: (item) => <span className="font-medium text-orange-600">{currenciesFormat('idr', item.remaining_payment)}</span>,
        },
        {
            header: 'Status',
            alignment: 'center',
            cell: (item) => {
                const percentage = Math.max(0, Math.min(100, item.paid_percentage));
                return (
                    <div className="space-y-2 min-w-[120px]">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{percentage.toFixed(0)}% diterima</span>
                            <span>{item.remaining_payment <= 0 ? 'Lunas' : 'Belum lunas'}</span>
                        </div>
                        <div className="h-2 rounded-full bg-emerald-100">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                    </div>
                );
            },
        }
    ];

    if (showActions) {
        columns.push({
            header: 'Aksi',
            alignment: 'center',
            sticky: 'right',
            cell: (item) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[100px] rounded-md p-2">
                        <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5">
                            {slug ? <Link href={`/dashboard/${slug}/finance/data-penerimaan-piutang/${item.id}`}>Detail</Link> : <span className="cursor-not-allowed text-slate-400">Detail</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDelete?.(item)} className="cursor-pointer rounded-md px-3 py-2.5 text-orange-600 focus:text-orange-700">
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        });
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p>{error}</p>
                        {onRetry && (
                            <Button variant="outline" size="sm" onClick={onRetry}>
                                Coba Lagi
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <BaseTable
                data={data}
                columns={columns}
                loading={loading}
                search={search}
                onSearchChange={onSearchChange}
                showLimitChange={Boolean(onPerPageChange)}
                perPage={perPage}
                onPerPageChange={onPerPageChange}
                meta={meta ? {
                    currentPage: currentPage ?? 1,
                    perPage: perPage ?? 25,
                    lastPage: meta.lastPage || 1,
                    total: meta.total || data.length,
                } : undefined}
                onPageChange={onPageChange}
            />
        </div>
    );
}
