import { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  CheckCircle2,
  AlertCircle,
  Pencil,
  Plus,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImagePreview } from '@/components/ui/image-preview';
import { LoadingState } from '@/components/ui/loading-state';
import { PageHeader } from '@/components/ui/page-header';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import GeneralJournalDetailCards from '@/components/features/general-journal/GeneralJournalDetailCards';
import GeneralJournalEntriesTable from '@/components/features/general-journal/GeneralJournalEntriesTable';
import BillingPaymentCreateDialog from '@/components/features/general-journal/BillingPaymentCreateDialog';
import BillingPaymentEditDialog from '@/components/features/general-journal/BillingPaymentEditDialog';
import BillingPaymentDeleteDialog from '@/components/features/general-journal/BillingPaymentDeleteDialog';
import ToggleGeneralJournalPostingDialog from '@/components/features/general-journal/ToggleGeneralJournalPostingDialog';
import { useGeneralJournalDetail } from '@/hooks/useGeneralJournal';
import { useAccounts } from '@/hooks/useAccount';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import type {
  GeneralJournalBillingCash,
  GeneralJournalBillingPayment,
} from '@/@types/general-journal.types';
import { cn } from '@/lib/utils';

interface Props {
  journalId?: number;
}

const buildProofUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://wajirabackend.hawk-dev.com';
  return `${base.replace(/\/$/, '')}/storage/${path.replace(/^\/+/, '')}`;
};

export default function GeneralJournalDetailView({ journalId }: Props) {
  const router = useRouter();
  const slug = router.query.slug;
  const basePath = typeof slug === 'string'
    ? `/dashboard/${slug}/finance/jurnal-umum`
    : '/dashboard';

  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('finance:edit');

  // Dialog States
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<GeneralJournalBillingPayment | null>(null);
  const [isPaymentEditOpen, setIsPaymentEditOpen] = useState(false);
  const [isPaymentDeleteOpen, setIsPaymentDeleteOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Detail Query
  const detailQuery = useGeneralJournalDetail(journalId, {
    enabled: typeof journalId === 'number' && Number.isFinite(journalId),
    refetchInterval: false,
  });

  const journal = detailQuery.data;
  const isPaid = Boolean(journal?.is_paid);
  const isBalanced = Boolean(journal?.is_balanced);
  const isUsd = Boolean(journal?.is_usd_transaction);
  const proofUrl = buildProofUrl(journal?.payment_proof);

  // Accounts Query for Payments
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: journal?.company_id,
    enabled: Boolean(journal?.company_id),
  });
  const accountOptions = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  // Aggregate cashes & payments across billings
  const billings = useMemo(() => journal?.billings ?? [], [journal?.billings]);
  const primaryBilling = billings[0];

  const allCashes = useMemo(() => {
    const list: GeneralJournalBillingCash[] = [];
    billings.forEach((b) => {
      if (b.cashes) list.push(...b.cashes);
    });
    return list;
  }, [billings]);

  const allPayments = useMemo(() => {
    const list: GeneralJournalBillingPayment[] = [];
    billings.forEach((b) => {
      if (b.payments) list.push(...b.payments);
    });
    return list;
  }, [billings]);

  // Debet, Credit, Remaining calculations
  const totalDebit = Number(journal?.total_debit ?? journal?.total_amount ?? journal?.amount ?? 0);
  const totalCredit = Number(journal?.total_credit ?? journal?.total_paid ?? 0);
  const remainingAmount = Number(journal?.remaining_amount ?? (totalDebit - totalCredit));
  const hasBillings = billings.length > 0;
  const canMarkPaid = canEdit && !isPaid && isBalanced && totalDebit > 0 && hasBillings;

  const totalAmount = useMemo(() => {
    const rawBillingTotal = Number(primaryBilling?.total_amount ?? 0);
    if (rawBillingTotal > 0) return rawBillingTotal;

    const cashesTotal = (primaryBilling?.cashes ?? []).reduce(
      (sum, c) => sum + Number(c.amount || 0),
      0,
    );
    if (cashesTotal > 0) return cashesTotal;

    return totalDebit;
  }, [primaryBilling?.total_amount, primaryBilling?.cashes, totalDebit]);

  const markPaidDisabledReason = useMemo(() => {
    if (!canEdit) return 'Anda tidak memiliki hak akses untuk mengubah status jurnal.';
    if (isPaid) return 'Jurnal ini sudah ditandai lunas.';
    if (!hasBillings) return 'Jurnal tidak dapat ditandai lunas tanpa item billing.';
    if (!isBalanced || totalDebit <= 0) {
      return `Jurnal belum seimbang (Debet: ${currenciesFormat(isUsd ? 'usd' : 'idr', totalDebit)}, Kredit: ${currenciesFormat(isUsd ? 'usd' : 'idr', totalCredit)}).`;
    }
    return '';
  }, [canEdit, hasBillings, isBalanced, isPaid, isUsd, totalCredit, totalDebit]);

  const backToList = () => void router.push(basePath);

  if (detailQuery.isLoading) {
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
            onBack={backToList}
          />
          <Card className="rounded-md border-red-200 bg-red-50 shadow-none">
            <CardContent className="p-6 text-sm text-red-700">
              <p className="font-semibold">Data jurnal umum tidak ditemukan.</p>
              <p className="mt-1 text-red-600">Periksa kembali ID jurnal pada URL browser Anda.</p>
              <div className="mt-4">
                <Button type="button" variant="outline" onClick={backToList}>
                  Kembali ke Daftar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Detail Jurnal Umum {journal.code} - Wajira Dashboard</title>
      </Head>

      <div className="space-y-6">
        {/* PageHeader per file-instruction.md standard */}
        <PageHeader
          breadcrumbs={[
            { label: 'Jurnal Umum', onClick: backToList },
            { label: 'Detail Jurnal' },
          ]}
          title="Detail Jurnal Umum"
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">{journal.code}</span>
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-2.5 py-0.5 font-semibold text-xs',
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
                  'rounded-full px-2.5 py-0.5 font-semibold text-xs',
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
                  'rounded-full px-2.5 py-0.5 font-semibold text-xs',
                  isUsd
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-100 text-slate-700',
                )}
              >
                {isUsd ? 'Transaksi USD ($)' : 'Transaksi IDR (Rp)'}
              </Badge>
            </div>
          }
          onBack={backToList}
          actions={
            <>
              {/* Tombol Edit Jurnal */}
              {!isPaid && canEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void router.push(`${basePath}/${journal.id}/edit`)}
                  className="btn-outline h-9"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Jurnal
                </Button>
              ) : null}

              {/* Tombol Tambah Akun Lawan (jika belum seimbang) */}
              {!isPaid && canEdit && primaryBilling?.id && remainingAmount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="h-9 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Akun Lawan
                </Button>
              ) : null}

              {/* Tombol Tandai Lunas / Batal Tandai Lunas */}
              {canEdit ? (
                isPaid ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 h-9"
                    onClick={() => {
                      setTargetStatus(false);
                      setIsToggleOpen(true);
                    }}
                  >
                    Batal Tandai Lunas
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block">
                        <Button
                          type="button"
                          variant="success"
                          disabled={!canMarkPaid}
                          onClick={() => {
                            setTargetStatus(true);
                            setIsToggleOpen(true);
                          }}
                          className="h-9"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Tandai Lunas
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
                      {canMarkPaid
                        ? 'Menandai jurnal sebagai lunas akan membukukan transaksi ke laporan keuangan dan mengunci rincian jurnal.'
                        : markPaidDisabledReason}
                    </TooltipContent>
                  </Tooltip>
                )
              ) : null}
            </>
          }
        />

        {/* Section 1: Detail Overview Cards (Informasi & Finansial) */}
        <GeneralJournalDetailCards
          journal={journal}
          isPaid={isPaid}
          isBalanced={isBalanced}
          isUsd={isUsd}
          totalDebit={totalDebit}
          totalCredit={totalCredit}
          remainingAmount={remainingAmount}
          cashesCount={allCashes.length}
          paymentsCount={allPayments.length}
          proofUrl={proofUrl}
          onPreviewProof={(url) => setPreviewUrl(url)}
        />

        {/* Section 2: Ayat Jurnal Umum Memorial Table */}
        <GeneralJournalEntriesTable
          journal={journal}
          cashes={allCashes}
          payments={allPayments}
          isPaid={isPaid}
          canEdit={canEdit}
          isUsd={isUsd}
          totalDebit={totalDebit}
          totalCredit={totalCredit}
          remainingAmount={remainingAmount}
          onAddPayment={() => setIsAddPaymentOpen(true)}
          onEditPayment={(payment) => {
            setSelectedPayment(payment);
            setIsPaymentEditOpen(true);
          }}
          onDeletePayment={(payment) => {
            setSelectedPayment(payment);
            setIsPaymentDeleteOpen(true);
          }}
        />

        {/* Dialog Tambah Pembayaran Kredit */}
        {primaryBilling?.id ? (
          <BillingPaymentCreateDialog
            open={isAddPaymentOpen}
            onOpenChange={setIsAddPaymentOpen}
            billingId={primaryBilling.id}
            journalId={journal.id}
            totalAmount={totalAmount}
            remainingAmount={remainingAmount > 0 ? remainingAmount : 0}
            accounts={accountOptions}
            isAccountsLoading={accountQuery.isLoading}
            isUsd={isUsd}
          />
        ) : null}

        {/* Dialog Edit Pembayaran Kredit */}
        <BillingPaymentEditDialog
          open={isPaymentEditOpen}
          onOpenChange={setIsPaymentEditOpen}
          payment={selectedPayment}
          journalId={journal.id}
          totalAmount={totalAmount}
          accounts={accountOptions}
          isUsd={isUsd}
        />

        {/* Dialog Hapus Pembayaran Kredit */}
        <BillingPaymentDeleteDialog
          open={isPaymentDeleteOpen}
          onOpenChange={setIsPaymentDeleteOpen}
          payment={selectedPayment}
          journalId={journal.id}
          isUsd={isUsd}
        />

        {/* Dialog Posting Status */}
        <ToggleGeneralJournalPostingDialog
          open={isToggleOpen}
          onOpenChange={setIsToggleOpen}
          data={journal}
          targetStatus={targetStatus}
        />

        {/* Preview Bukti Gambar */}
        <ImagePreview
          open={previewUrl !== null}
          onClose={() => setPreviewUrl(null)}
          src={previewUrl}
        />
      </div>
    </DashboardLayout>
  );
}
