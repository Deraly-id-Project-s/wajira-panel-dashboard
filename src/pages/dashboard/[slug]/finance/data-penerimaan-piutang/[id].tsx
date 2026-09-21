import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import PembayaranHutangPaymentDialog from '@/components/features/pembayaran-hutang/PembayaranHutangPaymentDialog';
import { usePenerimaanPiutangDetail } from '@/hooks/usePenerimaanPiutangDetail';
import { formatCurrency } from '@/lib/utils/currency';
import { LoadingState } from '@/components/ui/loading-state';

type PaymentRow = {
  id: number;
  kodeTerima: string;
  tanggal: string;
  kasMasuk: string;
  jumlahTerima: number;
};

const formatDate = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

const buildKasMasukLabel = (cashAmount: number, bcaAmount: number, usdAmount: number) => {
  const labels: string[] = [];
  if (cashAmount > 0) labels.push('Cash');
  if (bcaAmount > 0) labels.push('BCA');
  if (usdAmount > 0) labels.push('BCA USD');
  return labels.length > 0 ? labels.join(' + ') : '-';
};

export default function DetailPenerimaanPiutangPage() {
  const router = useRouter();
  const rawId = router.query.id;
  const id = typeof rawId === 'string' ? Number(rawId) : undefined;
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const query = usePenerimaanPiutangDetail(id);
  const detail = query.data;

  const paymentRows = useMemo<PaymentRow[]>(() => {
    if (!detail) return [];

    return (detail.unit_transaction_billing.unit_transaction_billing_histories ?? []).map((history) => {
      const cashAmount = Number(history.cash_payment_amount ?? 0);
      const bcaAmount = Number(history.bca_payment_amount ?? 0);
      const usdAmount = Number(history.bca_payment_usd_amount ?? 0);

      return {
        id: history.id,
        kodeTerima: detail.code,
        tanggal: history.payment_at || history.created_at,
        kasMasuk: buildKasMasukLabel(cashAmount, bcaAmount, usdAmount),
        jumlahTerima: cashAmount + bcaAmount + usdAmount,
      };
    });
  }, [detail]);

  const filteredRows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return paymentRows;

    return paymentRows.filter((row) => row.kodeTerima.toLowerCase().includes(term) || row.tanggal.toLowerCase().includes(term) || row.kasMasuk.toLowerCase().includes(term));
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
  const errorMessage = query.error instanceof Error ? query.error.message : query.error ? 'Gagal memuat detail penerimaan piutang' : null;
  const infoDate = detail?.date || paymentRows[0]?.tanggal || '';
  const paymentPercentage =
    detail && detail.billing_summary.grand_total > 0
      ? Math.min(100, Math.round((detail.billing_summary.total_paid / detail.billing_summary.grand_total) * 100))
      : 0;

  return (
    <DashboardLayout>
      {isLoading ? (
        <LoadingState variant="page" text="Memuat detail penerimaan..." />
      ) : errorMessage || !detail ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-6 py-5 text-red-700">
          <p className="font-medium">{errorMessage ?? 'Data tidak ditemukan'}</p>
          <p className="mt-1 text-sm text-red-600">Pastikan parameter ID pada URL valid.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-6 rounded-md border bg-white p-6 shadow-sm">
            <PageHeader
              breadcrumbs={[
                { label: 'Data Penerimaan Piutang', onClick: () => router.push(slug ? `/dashboard/${slug}/finance/data-penerimaan-piutang` : '/dashboard') },
                { label: 'Detail' }
              ]}
              title="Data Penerimaan Piutang"
              subtitle={
                <>
                  <span>No Penjualan:</span>
                  <span className="font-medium text-sky-600">{detail.code}</span>
                </>
              }
              onBack={() => router.push(slug ? `/dashboard/${slug}/finance/data-penerimaan-piutang` : '/dashboard')}
              actions={
                <Button onClick={() => setPaymentDialogOpen(true)} disabled={detail.billing_summary.is_paid || detail.billing_summary.remaining_payment <= 0 || detail.unit_transaction_billing.id <= 0} className="btn-primary-orange!">
                  Tambah Penerimaan
                </Button>
              }
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-gray-600">Informasi Piutang</p>
                </div>

                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="text-xs text-gray-500">Nomor Penjualan</p>
                    <p className="font-medium text-gray-900">{detail.code}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(infoDate)}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{detail.person.name}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-500">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-gray-600">Status Pembayaran</p>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Total Piutang</span>
                    <span className="font-medium text-gray-900">{formatCurrency(detail.billing_summary.grand_total)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Total Diterima</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(detail.billing_summary.total_paid)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Sisa Piutang</span>
                    <span className="font-medium text-orange-600">{formatCurrency(detail.billing_summary.remaining_payment)}</span>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="text-gray-700">Kurang Bayar</span>
                    <span className="font-medium text-orange-500">{formatCurrency(detail.billing_summary.remaining_payment)}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paymentPercentage}%` }} />
                  </div>
                  <p className="mt-2 text-center text-xs font-medium text-emerald-600">{paymentPercentage}% Terbayar</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-md border bg-white p-6 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900">Data Penerimaan Piutang</h2>
              <p className="text-sm text-gray-500">Kolom: No, KODE TERIMA, TANGGAL, KAS MASUK, JUMLAH TERIMA.</p>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative w-full max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Cari kode terima, tanggal, atau kas masuk" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9 h-10" />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 md:shrink-0">
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
                    <th className="px-4 py-3 text-left">KODE TERIMA</th>
                    <th className="px-4 py-3 text-left">TANGGAL</th>
                    <th className="px-4 py-3 text-left">KAS MASUK</th>
                    <th className="px-4 py-3 text-right">JUMLAH TERIMA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, index) => (
                      <tr key={row.id} className="transition-colors hover:bg-gray-50/70">
                        <td className="px-4 py-3 text-gray-600">{startIndex + index}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.kodeTerima}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(row.tanggal)}</td>
                        <td className="px-4 py-3 text-gray-700">{row.kasMasuk}</td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatCurrency(row.jumlahTerima)}</td>
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
