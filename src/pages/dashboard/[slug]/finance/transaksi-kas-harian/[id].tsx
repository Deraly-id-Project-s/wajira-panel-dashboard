import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useIsMutating } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileCheck2,
  Info,
  Pencil,
  ReceiptText,
  Save,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import FinanceBillingTable from '@/components/features/kas-harian/FinanceBillingTable';
import TogglePaymentStatusDialog from '@/components/features/kas-harian/TogglePaymentStatusDialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { FileInput } from '@/components/ui/file-input';
import { ImagePreview } from '@/components/ui/image-preview';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useKasHarianDetail, useUpdateKasHarian } from '@/hooks/useKasHarian';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const buildProofUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://wajirabackend.hawk-dev.com';
  return `${base.replace(/\/$/, '')}/storage/${path.replace(/^\/+/, '')}`;
};

const isImageProof = (value?: string | null) => {
  if (!value) return false;
  const cleanValue = value.split('?')[0]?.toLowerCase() ?? '';
  return /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(cleanValue);
};

interface SummaryCardProps {
  label: string;
  value: string;
  description: string;
  tone: 'green' | 'red' | 'blue' | 'amber';
  icon: React.ReactNode;
}

const toneClasses = {
  green: 'border-emerald-100 bg-emerald-50/40 text-emerald-700',
  red: 'border-rose-100 bg-rose-50/40 text-rose-700',
  blue: 'border-blue-100 bg-blue-50/40 text-blue-700',
  amber: 'border-amber-100 bg-amber-50/40 text-amber-700',
};

function SummaryCard({ label, value, description, tone, icon }: SummaryCardProps) {
  return (
    <Card className={cn('rounded-md shadow-none', toneClasses[tone])}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-75">{label}</p>
          <p className="mt-2 break-words text-lg font-semibold text-slate-900 sm:text-xl">{value}</p>
          <p className="mt-1 text-xs opacity-75">{description}</p>
        </div>
        <div className="rounded-md border border-current/10 bg-white/70 p-2.5">{icon}</div>
      </CardContent>
    </Card>
  );
}

interface DetailItemProps {
  label: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

function DetailItem({ label, children, icon }: DetailItemProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">{icon}</div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <div className="text-sm font-medium text-slate-800">{children}</div>
      </div>
    </div>
  );
}

export default function KasHarianDetailPage() {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const cashFlowId = typeof rawId === 'string' ? Number(rawId) : undefined;
  const basePath = typeof slug === 'string'
    ? `/dashboard/${slug}/finance/transaksi-kas-harian`
    : '/dashboard';

  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreviewUrl, setSelectedFilePreviewUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [transactionNote, setTransactionNote] = useState('');

  const cashFlowQuery = useKasHarianDetail(cashFlowId, {
    enabled: typeof cashFlowId === 'number' && Number.isFinite(cashFlowId),
    refetchInterval: false,
  });
  const isTogglingStatus = useIsMutating({ mutationKey: ['toggle-cash-flow-payment-status'] }) > 0;
  const isStatusUpdating = isTogglingStatus || (cashFlowQuery.isFetching && !cashFlowQuery.isLoading);
  const updateMutation = useUpdateKasHarian();
  const cashFlowDetail = cashFlowQuery.data;
  const companyId = cashFlowDetail?.company_id ?? 0;
  const financeBillings = useMemo(() => cashFlowDetail?.finance_billings ?? [], [cashFlowDetail?.finance_billings]);
  const hasBillings = financeBillings.length > 0;
  const isLinkedTransaction = Boolean(
    cashFlowDetail?.unit_transaction_billing_id
    || cashFlowDetail?.goods_transaction_billing_id
    || cashFlowDetail?.unit_transaction_billing
    || cashFlowDetail?.goods_transaction_billing,
  );

  const debetIdr = Number(cashFlowDetail?.debet ?? 0);
  const creditIdr = Number(cashFlowDetail?.credit ?? 0);
  const debetUsd = Number(cashFlowDetail?.debet_usd ?? 0);
  const creditUsd = Number(cashFlowDetail?.credit_usd ?? 0);
  const isUsdTransaction = debetUsd > 0 || creditUsd > 0;
  const displayCurrency = isUsdTransaction ? 'usd' : 'idr';
  const transactionAmount = isUsdTransaction
    ? (debetUsd || creditUsd)
    : (debetIdr || creditIdr || Number(cashFlowDetail?.grand_total ?? 0));
  const expectedIdr = debetIdr > 0 ? debetIdr : creditIdr;
  const expectedUsd = debetUsd > 0 ? debetUsd : creditUsd;

  const totalPaidIdr = useMemo(
    () => financeBillings.filter(fb => !fb.cash?.code?.toLowerCase().includes('usd')).reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings]
  );
  const remainingPaymentIdr = Math.max(0, expectedIdr - totalPaidIdr);

  const totalPaidUsd = useMemo(
    () => financeBillings.filter(fb => fb.cash?.code?.toLowerCase().includes('usd')).reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings]
  );
  const remainingPaymentUsd = Math.max(0, expectedUsd - totalPaidUsd);

  const hasIdr = expectedIdr > 0;
  const hasUsd = expectedUsd > 0;
  const isFullyPaid = (hasIdr ? remainingPaymentIdr <= 0 : true) && (hasUsd ? remainingPaymentUsd <= 0 : true);
  const isMarkedPaid = cashFlowDetail?.is_paid === true
    || cashFlowDetail?.is_paid === '1'
    || cashFlowDetail?.is_paid === 'true';

  const totalPaid = useMemo(
    () => financeBillings.reduce((sum, billing) => sum + Number(billing.amount || 0), 0),
    [financeBillings],
  );
  const remainingPayment = isFullyPaid ? 0 : (hasIdr && hasUsd) ? (remainingPaymentIdr + remainingPaymentUsd) : (hasUsd ? remainingPaymentUsd : remainingPaymentIdr);
  const proofUrl = buildProofUrl(cashFlowDetail?.payment_proof);
  const isLoading = cashFlowQuery.isLoading || router.isFallback || !router.isReady;
  const errorMessage = cashFlowQuery.error instanceof Error ? cashFlowQuery.error.message : null;

  useEffect(() => {
    if (cashFlowDetail) setTransactionNote(cashFlowDetail.note || '');
  }, [cashFlowDetail]);

  useEffect(() => {
    return () => {
      if (selectedFilePreviewUrl) URL.revokeObjectURL(selectedFilePreviewUrl);
    };
  }, [selectedFilePreviewUrl]);

  const buildUpdatePayload = (note: string, paymentProof?: File) => {
    if (!cashFlowDetail) return null;
    return {
      company_id: cashFlowDetail.company_id,
      date: cashFlowDetail.date.slice(0, 10),
      note,
      debet: debetIdr,
      debet_usd: debetUsd,
      credit: creditIdr,
      credit_usd: creditUsd,
      payment_proof: paymentProof,
    };
  };

  const handleSaveNote = async () => {
    if (!cashFlowDetail || updateMutation.isPending) return;
    const note = transactionNote.trim();
    if (note.length < 3) {
      toast.error('Catatan transaksi minimal 3 karakter');
      return;
    }

    try {
      const payload = buildUpdatePayload(note);
      if (!payload) return;
      await updateMutation.mutateAsync({ id: cashFlowDetail.id, payload });
      toast.success('Catatan transaksi berhasil disimpan');
      void cashFlowQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menyimpan catatan transaksi');
    }
  };

  const handleUploadProof = async () => {
    if (!cashFlowDetail || !selectedFile || isUploading) return;
    setIsUploading(true);

    try {
      const payload = buildUpdatePayload(transactionNote.trim() || cashFlowDetail.note || '', selectedFile);
      if (!payload) return;
      await updateMutation.mutateAsync({ id: cashFlowDetail.id, payload });
      toast.success('Bukti pembayaran utama berhasil disimpan');
      setSelectedFile(null);
      if (selectedFilePreviewUrl) {
        URL.revokeObjectURL(selectedFilePreviewUrl);
        setSelectedFilePreviewUrl(null);
      }
      void cashFlowQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Gagal menyimpan bukti pembayaran utama');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectedFileChange = (file: File | null) => {
    if (selectedFilePreviewUrl) {
      URL.revokeObjectURL(selectedFilePreviewUrl);
      setSelectedFilePreviewUrl(null);
    }

    setSelectedFile(file);
    if (file?.type.startsWith('image/')) {
      setSelectedFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Card className="rounded-md"><LoadingState variant="page" text="Memuat detail transaksi..." /></Card>
      </DashboardLayout>
    );
  }

  if (errorMessage || !cashFlowDetail) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title="Detail Transaksi Kas Harian" subtitle="Data transaksi tidak dapat ditampilkan" onBack={() => void router.push(basePath)} />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">
              <p className="font-medium">{errorMessage ?? 'Data transaksi tidak ditemukan'}</p>
              <p className="mt-1 text-red-600">Periksa kembali ID transaksi pada URL.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head><title>Detail Kas Harian - Wajira Dashboard</title></Head>

      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Transaksi Kas Harian', onClick: () => void router.push(basePath) },
            { label: 'Detail Transaksi' },
          ]}
          title={hasBillings && remainingPayment > 0 ? 'Pembayaran Kas Harian' : 'Detail Transaksi Kas Harian'}
          subtitle={
            <>
              <span>{hasBillings ? 'Kelola rincian pembayaran dan informasi transaksi' : 'Informasi lengkap transaksi kas harian'}</span>
              <Badge
                variant="outline"
                className={cn(
                  isMarkedPaid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}
              >
                {isMarkedPaid ? <CheckCircle2 /> : null}
                {isMarkedPaid ? 'Lunas' : 'Belum Lunas'}
              </Badge>
            </>
          }
          onBack={() => void router.push(basePath)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => void router.push(`${basePath}/${cashFlowDetail.id}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />Edit Transaksi
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  setTargetStatus(!isMarkedPaid);
                  setIsToggleOpen(true);
                }}
                disabled={(remainingPayment !== 0 && !cashFlowDetail.is_valid) || isStatusUpdating}
                loading={isStatusUpdating}
              >
                {isMarkedPaid ? 'Tandai Belum Lunas' : 'Tandai Lunas'}
              </Button>
            </>
          }
        />

        <Card className="rounded-md border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Informasi Transaksi</CardTitle>
                <CardDescription className="mt-1">Identitas dan referensi transaksi kas harian</CardDescription>
              </div>
              {isLinkedTransaction ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700"><Info />Terhubung Administrasi</Badge>
                    </TooltipTrigger>
                    <TooltipContent>Transaksi ini dibuat dari data administrasi.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Transaksi Manual</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
            <DetailItem label="Kode Transaksi" icon={<ReceiptText className="h-4 w-4" />}><CopyBox text={cashFlowDetail.code || '-'} /></DetailItem>
            <DetailItem label="Tanggal Transaksi" icon={<CalendarDays className="h-4 w-4" />}>{formatDate(cashFlowDetail.date)}</DetailItem>
            <DetailItem label="Perusahaan" icon={<Building2 className="h-4 w-4" />}>{cashFlowDetail.company?.name || '-'}</DetailItem>
            <DetailItem label="Nomor Invoice" icon={<FileCheck2 className="h-4 w-4" />}>{cashFlowDetail.invoice_number || '-'}</DetailItem>
          </CardContent>
          <Separator />
          <CardContent className="grid gap-4 px-4 py-4 text-xs text-slate-500 sm:grid-cols-2 sm:px-6">
            <span>Dibuat: {formatDate(cashFlowDetail.created_at)}</span>
            <span>Terakhir diperbarui: {formatDate(cashFlowDetail.updated_at)}</span>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Debet IDR" value={currenciesFormat('idr', debetIdr)} description="Uang masuk dalam Rupiah" tone="green" icon={<ArrowDownLeft className="h-5 w-5" />} />
          <SummaryCard label="Kredit IDR" value={currenciesFormat('idr', creditIdr)} description="Uang keluar dalam Rupiah" tone="red" icon={<ArrowUpRight className="h-5 w-5" />} />
          <SummaryCard label="Debet USD" value={currenciesFormat('usd', debetUsd)} description="Uang masuk dalam Dollar" tone="blue" icon={<CircleDollarSign className="h-5 w-5" />} />
          <SummaryCard label="Kredit USD" value={currenciesFormat('usd', creditUsd)} description="Uang keluar dalam Dollar" tone="amber" icon={<CircleDollarSign className="h-5 w-5" />} />
        </div>

        <Card className="rounded-md border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-5">
            <CardTitle>Ringkasan Pembayaran</CardTitle>
            <CardDescription>Progres pembayaran berdasarkan mata uang transaksi</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-4 sm:p-6 md:grid-cols-3">
            {!(expectedIdr > 0 && expectedUsd > 0) ? (
              <>
                <DetailItem label="Nilai Transaksi" icon={<WalletCards className="h-4 w-4" />}>{currenciesFormat(displayCurrency, transactionAmount)}</DetailItem>
                <DetailItem label="Total Terbayar" icon={<CheckCircle2 className="h-4 w-4" />}>{currenciesFormat(displayCurrency, totalPaid)}</DetailItem>
                <DetailItem label="Sisa Pembayaran" icon={<ReceiptText className="h-4 w-4" />}>
                  <span className={remainingPayment > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>{currenciesFormat(displayCurrency, remainingPayment)}</span>
                </DetailItem>
              </>
            ) : (
              <div className="col-span-3 grid gap-6 md:grid-cols-2">
                <div className="space-y-4 p-4 rounded-md bg-slate-50/50 border border-slate-100">
                  <h4 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2">Rincian Rupiah (IDR)</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <DetailItem label="Nilai Transaksi" icon={<WalletCards className="h-4 w-4" />}>{currenciesFormat('idr', expectedIdr)}</DetailItem>
                    <DetailItem label="Total Terbayar" icon={<CheckCircle2 className="h-4 w-4" />}>{currenciesFormat('idr', totalPaidIdr)}</DetailItem>
                    <DetailItem label="Sisa Pembayaran" icon={<ReceiptText className="h-4 w-4" />}>
                      <span className={remainingPaymentIdr > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                        {currenciesFormat('idr', remainingPaymentIdr)}
                      </span>
                    </DetailItem>
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-md bg-amber-50/10 border border-amber-100/50">
                  <h4 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-2 text-amber-900">Rincian Dollar (USD)</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <DetailItem label="Nilai Transaksi" icon={<WalletCards className="h-4 w-4" />}>{currenciesFormat('usd', expectedUsd)}</DetailItem>
                    <DetailItem label="Total Terbayar" icon={<CheckCircle2 className="h-4 w-4" />}>{currenciesFormat('usd', totalPaidUsd)}</DetailItem>
                    <DetailItem label="Sisa Pembayaran" icon={<ReceiptText className="h-4 w-4" />}>
                      <span className={remainingPaymentUsd > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                        {currenciesFormat('usd', remainingPaymentUsd)}
                      </span>
                    </DetailItem>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isFullyPaid && hasBillings ? (
          <Card className="rounded-md border-emerald-200 bg-emerald-50/60 shadow-none">
            <CardContent className="flex items-start gap-3 p-5 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div><p className="font-semibold">Pembayaran sudah lengkap</p><p className="mt-1 text-sm text-emerald-700">Seluruh rincian pembayaran transaksi ini telah dilengkapi.</p></div>
            </CardContent>
          </Card>
        ) : null}

        <FinanceBillingTable financeBillings={financeBillings} cashFlowDetail={cashFlowDetail} companyId={companyId} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-5">
              <CardTitle>Catatan Transaksi</CardTitle>
              <CardDescription>Perbarui keterangan transaksi kas harian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <Textarea value={transactionNote} onChange={(event) => setTransactionNote(event.target.value)} placeholder="Masukkan catatan transaksi..." className="min-h-32 resize-none" disabled={updateMutation.isPending} />
              <div className="flex justify-end [&>*]:w-full sm:[&>*]:w-auto">
                <Button
                  type="button"
                  className="btn-primary"
                  disabled={updateMutation.isPending || transactionNote.trim() === cashFlowDetail.note?.trim()}
                  loading={updateMutation.isPending}
                  onClick={() => void handleSaveNote()}
                >
                  Simpan Catatan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-5">
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between [&>*]:w-full sm:[&>*]:w-auto">
                <div><CardTitle>Bukti Pembayaran Utama</CardTitle><CardDescription className="mt-1">Unggah dokumen pendukung transaksi</CardDescription></div>
                {proofUrl ? (
                  isImageProof(cashFlowDetail.payment_proof) || isImageProof(proofUrl) ? (
                    <Button variant="outline" size="sm" onClick={() => setPreviewUrl(proofUrl)} type="button">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview Bukti
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <a href={proofUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Lihat Bukti</a>
                    </Button>
                  )
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <FileInput value={selectedFile} onFileChange={handleSelectedFileChange} accept="image/jpeg,image/png,application/pdf" helperText="PNG, JPG, atau PDF maksimal 2MB" disabled={isUploading} />
              {proofUrl && !selectedFile ? <p className="text-xs text-slate-500">Bukti pembayaran sudah tersimpan. Pilih file baru untuk menggantinya.</p> : null}
              {selectedFile ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {selectedFilePreviewUrl ? (
                    <Button type="button" variant="outline" onClick={() => setPreviewUrl(selectedFilePreviewUrl)} disabled={isUploading}>
                      Preview Gambar
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={() => handleSelectedFileChange(null)} disabled={isUploading}>Batal</Button>
                  <Button type="button" variant="default" onClick={() => void handleUploadProof()} disabled={isUploading}>
                    {isUploading ? <LoadingState variant="inline" text="Mengunggah..." iconClassName="text-white" /> : 'Simpan Bukti'}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <TogglePaymentStatusDialog open={isToggleOpen} onOpenChange={setIsToggleOpen} data={cashFlowDetail} targetStatus={targetStatus} />
        <ImagePreview open={previewUrl !== null} onClose={() => setPreviewUrl(null)} src={previewUrl} />
      </div>
    </DashboardLayout>
  );
}
