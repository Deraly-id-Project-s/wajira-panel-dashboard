import { LoadingState } from '@/components/ui/loading-state';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Info } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CopyBox } from '@/components/ui/copy-box';
import { useWithholdingTaxDetail } from '@/hooks/useWithholdingTax';
import { formatCurrency } from '@/lib/utils/currency';

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd MMM yyyy');
};

const formatSource = (source: string) => {
  if (source === 'external') return 'Client / Supplier';
  return source.charAt(0).toUpperCase() + source.slice(1);
};

export default function BuktiPotongDetailPage() {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const itemId = typeof rawId === 'string' ? Number(rawId) : undefined;

  const { data, isLoading, error } = useWithholdingTaxDetail(itemId || null);
  const errorMessage = error instanceof Error ? error.message : null;

  return (
    <DashboardLayout>
      <Head>
        <title>Detail Bukti Potong - Wajira Dashboard</title>
      </Head>

      {isLoading ? (
        <div className="rounded-md border border-slate-200 bg-white">
          <LoadingState variant="page" text="Memuat detail bukti potong..." />
        </div>
      ) : errorMessage || !data ? (
        <div className="rounded-[30px] border border-red-200 bg-red-50 px-6 py-5 text-red-700">
          <p className="font-medium">{errorMessage ?? 'Data bukti potong tidak ditemukan'}</p>
          <p className="mt-1 text-sm text-red-600">Periksa kembali ID bukti potong pada URL.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: 'Bukti Potong', onClick: () => router.push(typeof slug === 'string' ? `/dashboard/${slug}/administrasi/bukti-potong` : '/dashboard') },
              { label: 'Detail Bukti Potong' },
            ]}
            title="Detail Bukti Potong"
            subtitle="Informasi detail mengenai data bukti potong"
            onBack={() => router.push(typeof slug === 'string' ? `/dashboard/${slug}/administrasi/bukti-potong` : '/dashboard')}
          />

          {/* 1. GENERAL INFO CARD */}
          <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Bukti Potong</label>
                <div className="flex items-center gap-1.5">
                  <CopyBox text={data.withholding_number || '-'} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sumber (Source)</label>
                <p className="text-base font-medium text-slate-800">{formatSource(data.source)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Masa Bukti Potong</label>
                <p className="text-base font-medium text-slate-800">{data.withholding_age ? `${data.withholding_age} Bulan` : '-'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Bayar</label>
                <p className="text-base font-medium text-slate-800">{formatDate(data.payment_date)}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 pt-6" />

            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {/* Financial Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center border-b border-slate-100 pb-2">
                    Informasi Keuangan
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Kas Terkait</span>
                      <span className="text-sm font-semibold text-slate-900 text-right">
                        {data.cash ? `${data.cash.code} - ${data.cash.cash_name || data.cash.description || ''}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Nominal PPH</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatCurrency(data.pph_amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Uang Muka PPH</span>
                      <span className="text-sm font-medium text-slate-700 text-right max-w-[200px] truncate" title={data.pph_description || ''}>
                        {data.pph_description || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <span className="text-sm font-semibold text-slate-700">Jumlah Pembayaran</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(data.payment_amount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center border-b border-slate-100 pb-2">
                    Referensi Transaksi (Invoice)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">No Invoice</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {data.do_invoice?.code || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Tanggal Invoice</span>
                      <span className="text-sm font-medium text-slate-700">
                        {formatDate(data.do_invoice?.date)}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-slate-500 mt-0.5">Customer</span>
                      <span className="text-sm font-medium text-slate-700 text-right">
                        {data.do_invoice?.customer?.name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <span className="text-sm font-semibold text-slate-700">Nominal Invoice</span>
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(data.do_invoice?.total_amount ?? data.do_invoice?.invoice_amount ?? data.do_invoice?.bill_invoice ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 pt-6" />

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 text-xs text-slate-400">
              <div>Dibuat: {formatDate(data.created_at)}</div>
              <div>Diupdate: {formatDate(data.updated_at)}</div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex justify-center pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-200 bg-white px-8 text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => router.back()}
            >
              Kembali ke Daftar Bukti Potong
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
