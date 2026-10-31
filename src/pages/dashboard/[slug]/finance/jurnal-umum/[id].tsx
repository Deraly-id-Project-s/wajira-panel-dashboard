import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Wallet,
  Building2,
  FileText,
  AlertCircle,
  Coins,
  CreditCard,
  MoreVertical,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ImagePreview } from '@/components/ui/image-preview';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import ToggleGeneralJournalPostingDialog from '@/components/features/general-journal/ToggleGeneralJournalPostingDialog';
import BillingPaymentForm from '@/components/features/general-journal/BillingPaymentForm';
import BillingPaymentEditDialog from '@/components/features/general-journal/BillingPaymentEditDialog';
import BillingPaymentDeleteDialog from '@/components/features/general-journal/BillingPaymentDeleteDialog';
import { useGeneralJournalDetail } from '@/hooks/useGeneralJournal';
import { useAccounts } from '@/hooks/useAccount';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type {
  GeneralJournalBillingCash,
  GeneralJournalBillingPayment,
} from '@/@types/general-journal.types';
import { cn } from '@/lib/utils';

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

export default function GeneralJournalDetailPage() {
  const router = useRouter();
  const { slug, id: rawId } = router.query;
  const journalId = typeof rawId === 'string' ? Number(rawId) : undefined;
  const basePath = typeof slug === 'string'
    ? `/dashboard/${slug}/finance/jurnal-umum`
    : '/dashboard';

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('finance:edit');

  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // States for payment edit & delete dialogs
  const [selectedPayment, setSelectedPayment] = useState<GeneralJournalBillingPayment | null>(null);
  const [isPaymentEditOpen, setIsPaymentEditOpen] = useState(false);
  const [isPaymentDeleteOpen, setIsPaymentDeleteOpen] = useState(false);

  const detailQuery = useGeneralJournalDetail(journalId, {
    enabled: typeof journalId === 'number' && Number.isFinite(journalId),
    refetchInterval: false,
  });

  const journal = detailQuery.data;
  const isPaid = Boolean(journal?.is_paid);
  const isBalanced = Boolean(journal?.is_balanced);
  const proofUrl = buildProofUrl(journal?.payment_proof);
  const isUsd = Boolean(journal?.is_usd_transaction);

  // Load COA accounts for billing payment form
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: journal?.company_id,
    enabled: Boolean(journal?.company_id),
  });

  const accountOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  // Aggregate cashes and payments across all billings (or primary billing)
  const billings = useMemo(() => journal?.billings ?? [], [journal?.billings]);
  const primaryBilling = billings[0];

  // List of all cashes
  const allCashes = useMemo(() => {
    const list: GeneralJournalBillingCash[] = [];
    billings.forEach((b) => {
      if (b.cashes) list.push(...b.cashes);
    });
    return list;
  }, [billings]);

  // List of all payments
  const allPayments = useMemo(() => {
    const list: GeneralJournalBillingPayment[] = [];
    billings.forEach((b) => {
      if (b.payments) list.push(...b.payments);
    });
    return list;
  }, [billings]);

  // Cash table columns
  const cashColumns = useMemo<ColumnDef<GeneralJournalBillingCash>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'left',
        cell: (_, index) => (
          <span className="text-slate-400 font-mono text-xs w-[60px] inline-block text-center">
            {(index ?? 0) + 1}
          </span>
        ),
      },
      {
        header: 'NAMA KAS / BANK',
        alignment: 'left',
        cell: (item) => (
          <div className="flex items-center gap-2">
            <span className="text-slate-800">
              {item.cash?.cash_name || item.cash?.name || '-'}
            </span>
            {item.cash?.currency_type ? (
              <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {item.cash.currency_type}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'KODE KAS',
        alignment: 'left',
        cell: (item) => (
          <span className="font-mono text-xs text-slate-600">
            {item.cash?.code || '-'}
          </span>
        ),
      },
      {
        header: 'TIPE',
        alignment: 'left',
        cell: (item) => (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs capitalize',
              item.cash?.type === 'bank'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            )}
          >
            {item.cash?.type || 'Kas'}
          </span>
        ),
      },
      {
        header: 'NOMINAL KAS (DEBET)',
        alignment: 'left',
        cell: (item) => (
          <span className="text-emerald-600 tabular-nums">
            {currenciesFormat(isUsd ? 'usd' : 'idr', item.amount)}
          </span>
        ),
      },
    ],
    [isUsd],
  );

  // Billing payments table columns (standard BaseTable action column per file-instruction.md)
  const paymentColumns = useMemo<ColumnDef<GeneralJournalBillingPayment>[]>(
    () => [
      {
        header: 'NO',
        alignment: 'left',
        cell: (_, index) => (
          <span className="text-slate-400 font-mono text-xs w-[60px] inline-block text-center">
            {(index ?? 0) + 1}
          </span>
        ),
      },
      {
        header: 'KODE AKUN',
        alignment: 'left',
        cell: (item) => (
          <span className="font-mono text-slate-800">
            {item.account?.code || '-'}
          </span>
        ),
      },
      {
        header: 'NAMA AKUN (COA)',
        alignment: 'left',
        cell: (item) => (
          <div>
            <p className="font-medium text-slate-800">{item.account?.name || '-'}</p>
            {item.account?.type ? (
              <span className="text-[11px] text-slate-400 capitalize">
                Tipe: {item.account.type}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: 'KETERANGAN PEMBAYARAN',
        alignment: 'left',
        cell: (item) => (
          <span className="text-xs text-slate-600">
            {item.note || <span className="text-slate-300 italic">-</span>}
          </span>
        ),
      },
      {
        header: 'NOMINAL PEMBAYARAN (KREDIT)',
        alignment: 'right',
        cell: (item) => (
          <span className="text-rose-600 tabular-nums">
            {currenciesFormat(isUsd ? 'usd' : 'idr', item.amount)}
          </span>
        ),
      },
      {
        header: 'Aksi',
        alignment: 'left',
        sticky: 'right',
        cell: (item) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
                <DropdownMenuItem
                  disabled={isPaid || !canEdit}
                  onClick={() => {
                    setSelectedPayment(item);
                    setIsPaymentEditOpen(true);
                  }}
                  className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isPaid || !canEdit}
                  onClick={() => {
                    setSelectedPayment(item);
                    setIsPaymentDeleteOpen(true);
                  }}
                  className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canEdit, isPaid, isUsd],
  );

  if (detailQuery.isLoading || !router.isReady) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" text="Memuat detail jurnal umum..." />
      </DashboardLayout>
    );
  }

  if (detailQuery.isError || !journal) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Detail Jurnal Umum"
            subtitle="Data jurnal tidak dapat ditampilkan"
            onBack={() => void router.push(basePath)}
          />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">
              <p className="font-medium">Data jurnal umum tidak ditemukan.</p>
              <p className="mt-1 text-red-600">Periksa kembali ID jurnal pada URL.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const totalDebit = Number(journal.total_debit ?? journal.total_amount ?? journal.amount ?? 0);
  const totalCredit = Number(journal.total_credit ?? journal.total_paid ?? 0);
  const remainingAmount = Number(journal.remaining_amount ?? (totalDebit - totalCredit));

  return (
    <DashboardLayout>
      <Head>
        <title>Detail Jurnal Umum {journal.code} - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Jurnal Umum', onClick: () => void router.push(basePath) },
            { label: 'Detail Jurnal' },
          ]}
          title="Detail Jurnal Umum"
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-800">{journal.code}</span>
              <Badge
                variant="outline"
                className={cn(
                  isPaid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700',
                )}
              >
                {isPaid ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}
                {isPaid ? 'Posted (Lunas)' : 'Draft (Belum Diposting)'}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  isBalanced
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Seimbang (Balanced)
                  </>
                ) : (
                  <>
                    <AlertCircle className="mr-1 h-3.5 w-3.5" />
                    Belum Seimbang
                  </>
                )}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  isUsd
                    ? 'border-blue-200 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
                )}
              >
                {isUsd ? 'Transaksi USD ($)' : 'Transaksi IDR (Rp)'}
              </Badge>
            </div>
          }
          onBack={() => void router.push(basePath)}
          actions={
            <>
              {!isPaid && canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void router.push(`${basePath}/${journal.id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Jurnal
                </Button>
              ) : null}

              {canEdit ? (
                isPaid ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setTargetStatus(false);
                      setIsToggleOpen(true);
                    }}
                  >
                    Batal Posting Jurnal
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block">
                        <Button
                          type="button"
                          className="btn-primary"
                          disabled={!isBalanced || totalDebit <= 0}
                          onClick={() => {
                            setTargetStatus(true);
                            setIsToggleOpen(true);
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Posting Jurnal
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!isBalanced || totalDebit <= 0 ? (
                      <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                        Jurnal hanya dapat diposting jika status sudah seimbang (Total Debet = Total Kredit dan &gt; 0).
                      </TooltipContent>
                    ) : null}
                  </Tooltip>
                )
              ) : null}
            </>
          }
        />

        {/* Overview KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-md border-slate-200 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-slate-400">Kode & Tanggal Jurnal</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <CopyBox text={journal.code} />
                </div>
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(journal.date)}
                </p>
              </div>
              <FileText className="h-6 w-6 text-slate-400" />
            </CardContent>
          </Card>

          <Card className="rounded-md border-emerald-100 bg-emerald-50/30 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-emerald-700">
                  Total Kas (Debet)
                </p>
                <p className="mt-1 text-base font-bold text-emerald-800">
                  {currenciesFormat(isUsd ? 'usd' : 'idr', totalDebit)}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  {allCashes.length} akun kas teralokasi
                </p>
              </div>
              <Wallet className="h-6 w-6 text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="rounded-md border-rose-100 bg-rose-50/30 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-rose-700">
                  Total Pembayaran (Kredit)
                </p>
                <p className="mt-1 text-base font-bold text-rose-800">
                  {currenciesFormat(isUsd ? 'usd' : 'idr', totalCredit)}
                </p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  {allPayments.length} alokasi akun lawan
                </p>
              </div>
              <CreditCard className="h-6 w-6 text-rose-500" />
            </CardContent>
          </Card>

          <Card
            className={cn(
              'rounded-md shadow-none',
              remainingAmount <= 0.01 && totalDebit > 0
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-amber-200 bg-amber-50/40',
            )}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-slate-500">
                  Sisa Alokasi Pembayaran
                </p>
                <p
                  className={cn(
                    'mt-1 text-base font-bold',
                    remainingAmount <= 0.01 && totalDebit > 0
                      ? 'text-emerald-700'
                      : 'text-amber-800',
                  )}
                >
                  {currenciesFormat(isUsd ? 'usd' : 'idr', Math.max(0, remainingAmount))}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isBalanced ? 'Jurnal sudah seimbang' : 'Memerlukan akun lawan'}
                </p>
              </div>
              <Coins className="h-6 w-6 text-amber-500" />
            </CardContent>
          </Card>
        </div>

        {/* Section 1: Rincian Sumber Kas Jurnal (Debet) */}
        <Card className="rounded-md border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Sumber Kas Jurnal (Debet)
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar akun kas/bank yang dialokasikan sebagai pengeluaran jurnal umum
                </CardDescription>
              </div>
              <span className="text-xs text-slate-600">
                Total Debet: <strong className="text-emerald-700 text-sm">{currenciesFormat(isUsd ? 'usd' : 'idr', totalDebit)}</strong>
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <BaseTable data={allCashes} columns={cashColumns} loading={false} />
          </CardContent>
        </Card>

        {/* Section 2: Tabel dan Form Input Pembayaran Billing Jurnal Umum (Kredit) */}
        <Card className="rounded-md border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-rose-600" />
                  Pembayaran Billing Jurnal Umum
                </CardTitle>
                <CardDescription className="text-xs">
                  Alokasi akun lawan COA (sisi kredit) untuk menyeimbangkan nilai kas jurnal umum
                </CardDescription>
              </div>
              <span className="text-xs text-slate-600">
                Total Kredit: <strong className="text-rose-700 text-sm">{currenciesFormat(isUsd ? 'usd' : 'idr', totalCredit)}</strong>
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Form Input Pembayaran Billing */}
            {!isPaid && primaryBilling?.id && canEdit ? (
              <BillingPaymentForm
                billingId={primaryBilling.id}
                journalId={journal.id}
                remainingAmount={remainingAmount > 0 ? remainingAmount : 0}
                accounts={accountOptions}
                isAccountsLoading={accountQuery.isLoading}
                disabled={isPaid}
                isUsd={isUsd}
              />
            ) : isPaid ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Jurnal umum telah diposting. Rincian alokasi pembayaran berada dalam status terkunci (Read-Only).
                </span>
              </div>
            ) : null}

            {/* Tabel Pembayaran Billing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider text-slate-700">
                  Daftar Alokasi Pembayaran Akun Lawan
                </h4>
                <span className="text-xs text-slate-500">
                  {allPayments.length} baris terdaftar
                </span>
              </div>

              <div className="rounded-md border border-slate-200 overflow-hidden p-4">
                <BaseTable
                  data={allPayments}
                  columns={paymentColumns}
                  loading={false}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Informasi Tambahan & Bukti Dokumen */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-4">
              <CardTitle className="text-sm font-semibold">Keterangan Jurnal</CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {journal.note || <span className="text-slate-400 italic">Tidak ada catatan</span>}
            </CardContent>
          </Card>

          <Card className="rounded-md border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Bukti Dokumen Pendukung</CardTitle>
                <CardDescription className="text-xs mt-0.5">Lampiran fisik/digital</CardDescription>
              </div>
              {proofUrl ? (
                isImageProof(journal.payment_proof) || isImageProof(proofUrl) ? (
                  <Button variant="outline" size="sm" onClick={() => setPreviewUrl(proofUrl)} type="button">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Preview
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href={proofUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Lihat File
                    </a>
                  </Button>
                )
              ) : null}
            </CardHeader>
            <CardContent className="p-5">
              {proofUrl ? (
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-800 break-all">{journal.payment_proof}</p>
                  <p className="mt-1 text-slate-400">File tersimpan aman di server.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Tidak ada bukti dokumen yang dilampirkan.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog Posting Status */}
        <ToggleGeneralJournalPostingDialog
          open={isToggleOpen}
          onOpenChange={setIsToggleOpen}
          data={journal}
          targetStatus={targetStatus}
        />

        {/* Dialog Edit Pembayaran Billing */}
        <BillingPaymentEditDialog
          open={isPaymentEditOpen}
          onOpenChange={setIsPaymentEditOpen}
          payment={selectedPayment}
          journalId={journal.id}
          accounts={accountOptions}
          isUsd={isUsd}
        />

        {/* Dialog Hapus Pembayaran Billing */}
        <BillingPaymentDeleteDialog
          open={isPaymentDeleteOpen}
          onOpenChange={setIsPaymentDeleteOpen}
          payment={selectedPayment}
          journalId={journal.id}
        />

        {/* Preview Gambar */}
        <ImagePreview open={previewUrl !== null} onClose={() => setPreviewUrl(null)} src={previewUrl} />
      </div>
    </DashboardLayout>
  );
}
