import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import PembayaranHutangDetailHeader from '@/components/features/pembayaran-hutang/PembayaranHutangDetailHeader';
import PembayaranHutangPaymentDialog from '@/components/features/pembayaran-hutang/PembayaranHutangPaymentDialog';
import { usePembayaranHutangDetail } from '@/hooks/usePembayaranHutang';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils/currency';
import { LoadingState } from '@/components/ui/loading-state';

type PaymentRow = {
    id: number;
    kodeBayar: string;
    tanggal: string;
    kasKeluar: string;
    jumlahBayar: number;
};

const formatDate = (value: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('id-ID');
};

const buildKasKeluarLabel = (cashAmount: number, bcaAmount: number, usdAmount: number) => {
    const labels: string[] = [];
    if (cashAmount > 0) labels.push('Cash');
    if (bcaAmount > 0) labels.push('BCA');
    if (usdAmount > 0) labels.push('BCA USD');
    return labels.length > 0 ? labels.join(' + ') : '-';
};

export default function HutangDetailPage() {
    const router = useRouter();
    const rawId = router.query.id;
    const id = typeof rawId === 'string' ? Number(rawId) : undefined;
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(25);

    const query = usePembayaranHutangDetail(id);
    const detail = query.data;

    const paymentRows = useMemo<PaymentRow[]>(() => {
        if (!detail) return [];

        return (detail.unit_transaction_billing.unit_transaction_billing_histories ?? []).map((history) => {
            const cashAmount = Number(history.cash_payment_amount ?? 0);
            const bcaAmount = Number(history.bca_payment_amount ?? 0);
            const usdAmount = Number(history.bca_payment_usd_amount ?? 0);

            return {
                id: history.id,
                kodeBayar: detail.code,
                tanggal: history.payment_at,
                kasKeluar: buildKasKeluarLabel(cashAmount, bcaAmount, usdAmount),
                jumlahBayar: cashAmount + bcaAmount + usdAmount,
            };
        });
    }, [detail]);

    const filteredRows = useMemo(() => {
        const term = debouncedSearch.trim().toLowerCase();
        if (!term) return paymentRows;

        return paymentRows.filter((row) => row.kodeBayar.toLowerCase().includes(term) || row.tanggal.toLowerCase().includes(term) || row.kasKeluar.toLowerCase().includes(term));
    }, [debouncedSearch, paymentRows]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const paginatedRows = filteredRows.slice((safeCurrentPage - 1) * perPage, safeCurrentPage * perPage);
    const startIndex = filteredRows.length > 0 ? (safeCurrentPage - 1) * perPage + 1 : 0;
    const endIndex = Math.min(safeCurrentPage * perPage, filteredRows.length);

    const pageNumbers = useMemo(() => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

        if (safeCurrentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
        if (safeCurrentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];

        return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
    }, [safeCurrentPage, totalPages]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timeout);
    }, [search]);

    const isLoading = query.isLoading || router.isFallback;
    const errorMessage = query.error instanceof Error ? query.error.message : query.error ? 'Gagal memuat detail hutang' : null;

    return (
        <DashboardLayout>
            {isLoading ? (
                <LoadingState variant="page" text="Memuat detail hutang..." />
            ) : errorMessage || !detail ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-6 py-5 text-red-700">
                    <p className="font-medium">{errorMessage ?? 'Data tidak ditemukan'}</p>
                    <p className="mt-1 text-sm text-red-600">Pastikan parameter ID pada URL valid.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <PembayaranHutangDetailHeader
                        data={detail}
                        onAddPayment={() => setPaymentDialogOpen(true)}
                        addPaymentDisabled={detail.billing_summary.is_paid || detail.billing_summary.remaining_payment <= 0 || detail.unit_transaction_billing.id <= 0}
                        backHref={typeof router.query.slug === 'string' ? `/dashboard/${router.query.slug}/finance/data-hutang` : '/dashboard'}
                    />

                    <div className="space-y-4 rounded-md border bg-white p-6 shadow-sm">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-900">Data Hutang</h2>
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full max-w-md">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input placeholder="Cari kode bayar, tanggal, atau kas keluar" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9 h-10" />
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Show</span>
                                <Select
                                    value={String(perPage)}
                                    onValueChange={(value) => {
                                        setPerPage(Number(value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span>Page</span>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-md border border-gray-200">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100/80 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-3 text-left">No</th>
                                        <th className="px-4 py-3 text-left">KODE BAYAR</th>
                                        <th className="px-4 py-3 text-left">TANGGAL</th>
                                        <th className="px-4 py-3 text-left">KAS KELUAR</th>
                                        <th className="px-4 py-3 text-right">JUMLAH BAYAR</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {paginatedRows.length > 0 ? (
                                        paginatedRows.map((row, index) => (
                                            <tr key={row.id} className="transition-colors hover:bg-gray-50/70">
                                                <td className="px-4 py-3 text-gray-600">{startIndex + index}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.kodeBayar}</td>
                                                <td className="px-4 py-3 text-gray-700">{formatDate(row.tanggal)}</td>
                                                <td className="px-4 py-3 text-gray-700">{row.kasKeluar}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(row.jumlahBayar)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                                Tidak ada data yang ditemukan.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="border-t bg-gray-50/80">
                                    <tr className="font-semibold text-gray-900">
                                        <td colSpan={4} className="px-4 py-3 text-center">
                                            Sub Total
                                        </td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(filteredRows.reduce((total, row) => total + row.jumlahBayar, 0))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
                            <div>
                                Showing {filteredRows.length > 0 ? startIndex : 0}-{endIndex} of {filteredRows.length} data
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    Previous
                                </Button>

                                {pageNumbers.map((page, index) => (
                                    <Button
                                        key={index}
                                        variant={page === safeCurrentPage ? 'outline' : 'ghost'}
                                        size="sm"
                                        className={page === safeCurrentPage ? 'bg-gray-100' : ''}
                                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                        disabled={typeof page !== 'number'}
                                    >
                                        {page}
                                    </Button>
                                ))}

                                <Button variant="outline" disabled={safeCurrentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>
                                    Next
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-md border bg-gray-50 px-4 py-3 text-sm text-gray-600">
                            Total unit transaksi: <span className="font-semibold text-gray-900">{detail.unit_transaction_items.length}</span> item, total qty{' '}
                            <span className="font-semibold text-gray-900">{detail.unit_transaction_items.reduce((total, item) => total + item.qty_total, 0)}</span>.
                        </div>
                    </div>

                    <PembayaranHutangPaymentDialog
                        open={paymentDialogOpen}
                        onOpenChange={setPaymentDialogOpen}
                        billingId={detail.unit_transaction_billing.id || null}
                        remainingPayment={detail.billing_summary.remaining_payment}
                        code={detail.code}
                    />
                </div>
            )}
        </DashboardLayout>
    );
}
