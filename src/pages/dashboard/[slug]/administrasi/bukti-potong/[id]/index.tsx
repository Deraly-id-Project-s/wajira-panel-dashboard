import Head from 'next/head';
import { useRouter } from 'next/router';
import { Edit, ReceiptText } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useWithholdingTaxDetail } from '@/hooks/useWithholdingTax';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { formatCurrency } from '@/lib/utils/currency';

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, 'dd MMM yyyy');
};

const formatSource = (source: string) => {
  if (source === 'external') return 'Client / Supplier';
  return source ? source.charAt(0).toUpperCase() + source.slice(1) : '-';
};

export default function BuktiPotongDetailPage() {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const itemId = typeof rawId === 'string' ? rawId : undefined;
  const basePath = typeof slug === 'string' ? `/dashboard/${slug}/administrasi/bukti-potong` : '/administrasi/bukti-potong';

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('finance:edit');

  const { data, isLoading, error } = useWithholdingTaxDetail(itemId || null);
  const errorMessage = error instanceof Error ? error.message : null;

  const handleBack = () => {
    void router.push(basePath);
  };

  const handleEdit = () => {
    if (!itemId) return;
    void router.push(typeof slug === 'string' ? `/dashboard/${slug}/administrasi/bukti-potong/${itemId}/edit` : `/administrasi/bukti-potong/${itemId}/edit`);
  };

  if (!router.isReady || isLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text="Memuat detail bukti potong..." />
      </DashboardLayout>
    );
  }

  if (errorMessage || !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: 'Bukti Potong', onClick: handleBack },
              { label: 'Detail Bukti Potong' },
            ]}
            title="Detail Bukti Potong"
            subtitle="Data bukti potong tidak dapat ditemukan"
            onBack={handleBack}
          />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">
              {errorMessage ?? 'Data bukti potong tidak ditemukan. Periksa kembali ID bukti potong pada URL.'}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const kasCurrency = (data.cash as any)?.currency_type ? String((data.cash as any).currency_type).toUpperCase() : 'IDR';

  return (
    <DashboardLayout>
      <Head>
        <title>Detail Bukti Potong - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Bukti Potong', onClick: handleBack },
            { label: 'Detail Bukti Potong' },
          ]}
          title="Detail Bukti Potong"
          subtitle={
            <div className="flex items-center gap-2">
              <span>No Bukti Potong:</span>
              <span className="font-semibold text-slate-800">{data.withholding_number || '-'}</span>
              <Badge variant="outline" className="text-xs">
                {formatSource(data.source)}
              </Badge>
            </div>
          }
          onBack={handleBack}
          actions={
            canEdit && (
              <Button onClick={handleEdit} className="btn-primary!">
                <Edit className="h-4 w-4 mr-2" />
                Edit Data
              </Button>
            )
          }
        />

        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* 1. General Overview Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No Bukti Potong</span>
                <div>
                  <CopyBox text={data.withholding_number || '-'} />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sumber (Source)</span>
                <p className="text-base font-medium text-slate-900">{formatSource(data.source)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Masa Bukti Potong</span>
                <p className="text-base font-medium text-slate-900">{data.withholding_age ? `${data.withholding_age} Bulan` : '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Bayar</span>
                <p className="text-base font-medium text-slate-900">{formatDate(data.payment_date)}</p>
              </div>
            </div>

            <Separator />

            {/* 2. Financial and Reference Details */}
            <div className="grid gap-8 md:grid-cols-2">
              {/* Financial Section */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                  <ReceiptText className="h-4 w-4 text-slate-600" />
                  Informasi Keuangan
                </h3>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Kas Terkait</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {data.cash ? `${data.cash.code} - ${data.cash.cash_name || data.cash.description || ''}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Mata Uang Kas</span>
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {kasCurrency}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Nominal PPH</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(data.pph_amount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-slate-500">Uang Muka PPH / Ket.</span>
                    <span className="font-medium text-slate-700 text-right max-w-[220px] break-words">
                      {data.pph_description || '-'}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-semibold text-slate-700">Jumlah Pembayaran</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(data.payment_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reference (Invoice) Section */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3">
                  <ReceiptText className="h-4 w-4 text-slate-600" />
                  Referensi Invoice
                </h3>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Nomor Invoice</span>
                    <span className="font-semibold text-slate-900">
                      {data.no_invoice || data.do_invoice?.code || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Tanggal Invoice</span>
                    <span className="font-medium text-slate-700">
                      {formatDate(data.do_invoice?.date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-slate-500">Customer Terkait</span>
                    <span className="font-medium text-slate-700 text-right max-w-[220px] break-words">
                      {data.do_invoice?.customer?.name || '-'}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="font-semibold text-slate-700">Total Tagihan Invoice</span>
                    <span className="text-base font-bold text-slate-900">
                      {formatCurrency(data.do_invoice?.total_amount ?? data.do_invoice?.invoice_amount ?? data.do_invoice?.bill_invoice ?? 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. Metadata Timestamps */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4 pt-2">
              <div>Dibuat pada: {formatDate(data.created_at)}</div>
              <div>Terakhir diubah: {formatDate(data.updated_at)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="h-10 px-8"
          >
            Kembali ke Daftar Bukti Potong
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
