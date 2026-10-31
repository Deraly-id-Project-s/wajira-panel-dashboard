import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useIsMutating } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  ExternalLink,
  FileCheck2,
  Info,
  Package,
  Pencil,
  Percent,
  ReceiptText,
  Save,
  ShieldCheck,
  Truck,
  WalletCards,
  Wrench,
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
import { useKas } from '@/hooks/useKas';
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

const TRANSACTION_OF_CONFIG: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
  unit_type: {
    label: 'Unit Kendaraan',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: <Car className="mr-1 h-3.5 w-3.5" />,
  },
  sparepart: {
    label: 'Sparepart',
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: <Wrench className="mr-1 h-3.5 w-3.5" />,
  },
  goods: {
    label: 'Barang',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: <Package className="mr-1 h-3.5 w-3.5" />,
  },
  cash_advance: {
    label: 'Kas Bon Supir',
    tone: 'border-violet-200 bg-violet-50 text-violet-700',
    icon: <Coins className="mr-1 h-3.5 w-3.5" />,
  },
  other: {
    label: 'Lainnya',
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
    icon: <ReceiptText className="mr-1 h-3.5 w-3.5" />,
  },
};

const getTransactionOfConfig = (type?: string | null) => {
  if (!type) return null;
  return TRANSACTION_OF_CONFIG[type] ?? {
    label: type.replace(/_/g, ' ').toUpperCase(),
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
    icon: <ReceiptText className="mr-1 h-3.5 w-3.5" />,
  };
};

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
  const kasQuery = useKas(companyId > 0 ? companyId : undefined);
  const kasList = useMemo(() => kasQuery.data?.data ?? [], [kasQuery.data?.data]);

  const financeBillings = useMemo(() => cashFlowDetail?.finance_billings ?? [], [cashFlowDetail?.finance_billings]);
  const hasBillings = financeBillings.length > 0;

  const additionalInfo = cashFlowDetail?.additional_information
    ?? cashFlowDetail?.unit_transaction_billing?.unit_transaction?.additional_information
    ?? cashFlowDetail?.sparepart_transaction_billing?.sparepart_transaction?.additional_information;

  const transactionOf = cashFlowDetail?.transaction_of
    || additionalInfo?.transaction_of
    || (cashFlowDetail?.unit_transaction_billing_id || cashFlowDetail?.unit_transaction_billing ? 'unit_type' : undefined)
    || (cashFlowDetail?.sparepart_transaction_billing_id || cashFlowDetail?.sparepart_transaction_billing ? 'sparepart' : undefined)
    || (cashFlowDetail?.goods_transaction_billing_id || cashFlowDetail?.goods_transaction_billing ? 'goods' : undefined)
    || (cashFlowDetail?.driver_cash_advance_billing_id ? 'cash_advance' : undefined)
    || (cashFlowDetail?.do_invoice_billing_id ? 'other' : undefined);

  const transactionOfConfig = getTransactionOfConfig(transactionOf);

  const isLinkedTransaction = Boolean(
    cashFlowDetail?.unit_transaction_billing_id
    || cashFlowDetail?.goods_transaction_billing_id
    || cashFlowDetail?.sparepart_transaction_billing_id
    || cashFlowDetail?.driver_cash_advance_billing_id
    || cashFlowDetail?.do_invoice_billing_id
    || cashFlowDetail?.unit_transaction_billing
    || cashFlowDetail?.goods_transaction_billing
    || cashFlowDetail?.sparepart_transaction_billing
    || (transactionOf && transactionOf !== 'other'),
  );
  const unitTransaction = cashFlowDetail?.unit_transaction_billing?.unit_transaction;

  const unitItems = useMemo(() => {
    if (additionalInfo?.items && additionalInfo.items.length > 0) {
      return additionalInfo.items;
    }
    if (additionalInfo?.unit_type_name || additionalInfo?.unit_type) {
      return [
        {
          unit_type: additionalInfo.unit_type,
          unit_type_name: additionalInfo.unit_type_name,
          total_qty: additionalInfo.total_qty,
          dpp_per_unit: additionalInfo.dpp_per_unit,
          total_dpp: additionalInfo.total_dpp,
        },
      ];
    }
    return [];
  }, [additionalInfo]);

  const isSparepart = additionalInfo?.transaction_of === 'sparepart'
    || Boolean(additionalInfo?.sparepart)
    || Boolean(additionalInfo?.sparepart_name);

  const usdCostsList = useMemo(() => {
    const rawCosts = unitTransaction?.unit_transaction_usd_costs ?? [];
    if (!rawCosts || rawCosts.length === 0) return [];

    const costMap = new Map<string, number>();
    for (const item of rawCosts) {
      const costType = (item.cost_type || 'other').toLowerCase();
      const current = costMap.get(costType) ?? 0;
      costMap.set(costType, current + Number(item.amount || 0));
    }

    const labelMap: Record<string, string> = {
      freight: 'Biaya Ongkos Angkut (Freight)',
      box_packing: 'Biaya Box / Packing',
      admin_cost: 'Biaya Admin',
      ckd_processing_cost: 'Biaya Processing CKD',
      bill_of_lading_switch_cost: 'Biaya Switch B/L',
      customs_clearance_cost: 'Biaya Bea Cukai (Customs)',
      other: 'Biaya Lainnya (USD)',
    };

    return Array.from(costMap.entries()).map(([type, amount]) => ({
      type,
      amount,
      label: labelMap[type] || type.replace(/_/g, ' ').toUpperCase(),
    }));
  }, [unitTransaction?.unit_transaction_usd_costs]);

  const usdCostsTotal = useMemo(
    () => usdCostsList.reduce((sum, item) => sum + item.amount, 0),
    [usdCostsList],
  );

  const isUsdKasItem = (cash?: { currency_type?: string | null; code?: string | null } | null) => {
    if (!cash) return false;
    if ((cash.currency_type || '').toLowerCase() === 'usd') return true;
    return (cash.code || '').toLowerCase().includes('usd');
  };

  const originalFlowType = useMemo<'debet' | 'credit'>(() => {
    if (cashFlowDetail?.cash_flow_type === 'credit') return 'credit';
    if (cashFlowDetail?.cash_flow_type === 'debet' || cashFlowDetail?.cash_flow_type === 'debit') return 'debet';
    if (Number(cashFlowDetail?.debet_total || cashFlowDetail?.debet || cashFlowDetail?.cash_position?.debet_idr_total || 0) > 0) return 'debet';
    if (Number(cashFlowDetail?.credit_total || cashFlowDetail?.credit || cashFlowDetail?.cash_position?.credit_idr_total || 0) > 0) return 'credit';
    return 'debet';
  }, [cashFlowDetail]);

  const dualFlowType = originalFlowType === 'debet' ? 'credit' : 'debet';

  // Akumulasi total IDR dari seluruh kas di cash_flow_cashes
  const idrCashesDebet = useMemo(() => {
    return (cashFlowDetail?.cash_flow_cashes ?? [])
      .filter((c) => !isUsdKasItem(c.cash) && (c.type === 'debet' || c.type === 'debit'))
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [cashFlowDetail?.cash_flow_cashes]);

  const idrCashesCredit = useMemo(() => {
    return (cashFlowDetail?.cash_flow_cashes ?? [])
      .filter((c) => !isUsdKasItem(c.cash) && c.type === 'credit')
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }, [cashFlowDetail?.cash_flow_cashes]);

  const debetIdrTotal = Math.max(
    Number(cashFlowDetail?.debet_total || 0),
    Number(cashFlowDetail?.cash_position?.debet_idr_total || 0),
    Number(cashFlowDetail?.debet || 0),
    idrCashesDebet,
  );

  const creditIdrTotal = Math.max(
    Number(cashFlowDetail?.credit_total || 0),
    Number(cashFlowDetail?.cash_position?.credit_idr_total || 0),
    Number(cashFlowDetail?.credit || 0),
    idrCashesCredit,
  );

  const debetUsdTotal = Math.max(
    Number(cashFlowDetail?.debet_usd_total || 0),
    Number(cashFlowDetail?.cash_position?.debet_usd_total || 0),
    Number(cashFlowDetail?.debet_usd || 0),
  );

  const creditUsdTotal = Math.max(
    Number(cashFlowDetail?.credit_usd_total || 0),
    Number(cashFlowDetail?.cash_position?.credit_usd_total || 0),
    Number(cashFlowDetail?.credit_usd || 0),
  );

  const debetIdr = debetIdrTotal;
  const creditIdr = creditIdrTotal;
  const debetUsd = debetUsdTotal;
  const creditUsd = creditUsdTotal;

  const fallbackGrandTotal = Number(
    cashFlowDetail?.grand_total ||
    cashFlowDetail?.unit_transaction_billing?.grand_total ||
    cashFlowDetail?.goods_transaction_billing?.grand_total ||
    cashFlowDetail?.amount ||
    0,
  );
  const fallbackGrandTotalUsd = Number(cashFlowDetail?.grand_total_usd || 0);

  const grandTotalIdr = Number(
    cashFlowDetail?.grand_total ||
    (originalFlowType === 'debet' ? debetIdrTotal : creditIdrTotal) ||
    fallbackGrandTotal
  );
  const grandTotalUsd = fallbackGrandTotalUsd > 0
    ? fallbackGrandTotalUsd
    : (usdCostsTotal > 0 ? usdCostsTotal : (originalFlowType === 'debet' ? debetUsdTotal : creditUsdTotal));

  // Akumulasi total pembayaran IDR dari semua kas IDR
  const totalPaidIdr = useMemo(
    () => financeBillings.filter((fb) => !isUsdKasItem(fb.cash)).reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings]
  );

  const totalPaidUsd = useMemo(
    () => financeBillings.filter((fb) => isUsdKasItem(fb.cash)).reduce((sum, fb) => sum + Number(fb.amount || 0), 0),
    [financeBillings]
  );

  // Sisa alokasi dari backend API (atau fallback perhitungan lokal)
  const remainingOriginalIdr = cashFlowDetail?.remaining_payment !== undefined
    ? Number(cashFlowDetail.remaining_payment)
    : Math.max(0, (originalFlowType === 'debet' ? debetIdrTotal : creditIdrTotal) - totalPaidIdr);

  const remainingOriginalUsd = cashFlowDetail?.remaining_payment_usd !== undefined
    ? Number(cashFlowDetail.remaining_payment_usd)
    : Math.max(0, (originalFlowType === 'debet' ? debetUsdTotal : creditUsdTotal) - totalPaidUsd);

  const remainingDualIdr = cashFlowDetail?.dual_remaining_payment !== undefined
    ? Number(cashFlowDetail.dual_remaining_payment)
    : 0;

  const remainingDualUsd = cashFlowDetail?.dual_remaining_payment_usd !== undefined
    ? Number(cashFlowDetail.dual_remaining_payment_usd)
    : 0;

  const isOriginalSettled = remainingOriginalIdr <= 0 && remainingOriginalUsd <= 0;
  const isDualSettled = remainingDualIdr <= 0 && remainingDualUsd <= 0;
  const isCompletelySettled = isOriginalSettled && isDualSettled;

  const isMarkedPaid = cashFlowDetail?.is_paid === true
    || cashFlowDetail?.is_paid === '1'
    || cashFlowDetail?.is_paid === 'true';

  const remainingPayment = remainingOriginalIdr + remainingOriginalUsd;
  const proofUrl = buildProofUrl(cashFlowDetail?.payment_proof);
  const isLoading = cashFlowQuery.isLoading || router.isFallback || !router.isReady;

  const mappedSummaryCards = useMemo(() => {
    const summaries = cashFlowDetail?.cash_summaries ?? [];
    const cfCashes = cashFlowDetail?.cash_flow_cashes ?? [];

    if (kasList.length > 0) {
      return kasList.map((kas) => {
        const summary = summaries.find((s) => s.cash_id === kas.id);
        const isUsd = (kas.currency_type || '').toLowerCase() === 'usd';
        const currency = isUsd ? 'usd' : 'idr';

        let debet = 0;
        let credit = 0;

        if (summary) {
          debet = isUsd ? Number(summary.debet_usd_total || 0) : Number(summary.debet_total || 0);
          credit = isUsd ? Number(summary.credit_usd_total || 0) : Number(summary.credit_total || 0);
        } else {
          const cashFlowsForThisKas = cfCashes.filter((c) => c.cash_id === kas.id);
          debet = cashFlowsForThisKas.filter((c) => c.type === 'debet').reduce((sum, c) => sum + Number(c.amount || 0), 0);
          credit = cashFlowsForThisKas.filter((c) => c.type === 'credit').reduce((sum, c) => sum + Number(c.amount || 0), 0);
        }

        const label = kas.cash_name || kas.code || `Kas #${kas.id}`;
        const description = kas.description || `Kas ${kas.type || ''} (${currency.toUpperCase()})`;

        if (debet > 0 && credit === 0) {
          return {
            key: kas.id,
            label,
            value: currenciesFormat(currency, debet),
            description: `Uang Masuk / Debet (${description})`,
            tone: 'green' as const,
            icon: <ArrowDownLeft className="h-5 w-5" />,
          };
        }
        if (credit > 0 && debet === 0) {
          return {
            key: kas.id,
            label,
            value: currenciesFormat(currency, credit),
            description: `Uang Keluar / Kredit (${description})`,
            tone: 'red' as const,
            icon: <ArrowUpRight className="h-5 w-5" />,
          };
        }
        if (debet > 0 && credit > 0) {
          return {
            key: kas.id,
            label,
            value: `+${currenciesFormat(currency, debet)} / -${currenciesFormat(currency, credit)}`,
            description: `Arus Masuk & Keluar (${description})`,
            tone: 'blue' as const,
            icon: <CircleDollarSign className="h-5 w-5" />,
          };
        }
        return {
          key: kas.id,
          label,
          value: currenciesFormat(currency, 0),
          description: `Kas ${currency.toUpperCase()}`,
          tone: isUsd ? ('blue' as const) : ('amber' as const),
          icon: <Coins className="h-5 w-5" />,
        };
      });
    }

    if (summaries.length > 0) {
      return summaries.map((summary) => {
        const isUsd = (summary.cash?.currency_type || '').toLowerCase() === 'usd' || summary.debet_usd_total > 0 || summary.credit_usd_total > 0;
        const currency = isUsd ? 'usd' : 'idr';
        const debet = isUsd ? Number(summary.debet_usd_total || 0) : Number(summary.debet_total || 0);
        const credit = isUsd ? Number(summary.credit_usd_total || 0) : Number(summary.credit_total || 0);
        const label = summary.cash?.cash_name || summary.cash?.code || `Kas #${summary.cash_id}`;
        const description = `Kas ${summary.cash?.type || ''} (${currency.toUpperCase()})`;

        if (debet > 0 && credit === 0) {
          return {
            key: summary.cash_id,
            label,
            value: currenciesFormat(currency, debet),
            description: `Uang Masuk / Debet (${description})`,
            tone: 'green' as const,
            icon: <ArrowDownLeft className="h-5 w-5" />,
          };
        }
        if (credit > 0 && debet === 0) {
          return {
            key: summary.cash_id,
            label,
            value: currenciesFormat(currency, credit),
            description: `Uang Keluar / Kredit (${description})`,
            tone: 'red' as const,
            icon: <ArrowUpRight className="h-5 w-5" />,
          };
        }
        return {
          key: summary.cash_id,
          label,
          value: currenciesFormat(currency, debet || credit),
          description: `Kas (${currency.toUpperCase()})`,
          tone: isUsd ? ('blue' as const) : ('amber' as const),
          icon: <Coins className="h-5 w-5" />,
        };
      });
    }

    return [
      { key: 'debet-idr', label: 'Debet IDR', value: currenciesFormat('idr', debetIdr), description: 'Uang masuk dalam Rupiah', tone: 'green' as const, icon: <ArrowDownLeft className="h-5 w-5" /> },
      { key: 'credit-idr', label: 'Kredit IDR', value: currenciesFormat('idr', creditIdr), description: 'Uang keluar dalam Rupiah', tone: 'red' as const, icon: <ArrowUpRight className="h-5 w-5" /> },
      { key: 'debet-usd', label: 'Debet USD', value: currenciesFormat('usd', debetUsd), description: 'Uang masuk dalam Dollar', tone: 'blue' as const, icon: <CircleDollarSign className="h-5 w-5" /> },
      { key: 'credit-usd', label: 'Kredit USD', value: currenciesFormat('usd', creditUsd), description: 'Uang keluar dalam Dollar', tone: 'amber' as const, icon: <CircleDollarSign className="h-5 w-5" /> },
    ];
  }, [kasList, cashFlowDetail?.cash_summaries, cashFlowDetail?.cash_flow_cashes, debetIdr, creditIdr, debetUsd, creditUsd]);
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
                {isMarkedPaid ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : null}
                {isMarkedPaid ? 'Lunas' : 'Belum Lunas'}
              </Badge>
              {transactionOfConfig && (
                <Badge variant="outline" className={transactionOfConfig.tone}>
                  {transactionOfConfig.icon}
                  {transactionOfConfig.label}
                </Badge>
              )}
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
                disabled={(!isMarkedPaid && remainingPayment !== 0 && !cashFlowDetail.is_valid) || isStatusUpdating}
                loading={isStatusUpdating}
              >
                {cashFlowDetail.is_paid ? 'Batal Posting Jurnal' : 'Posting Jurnal'}
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
              <div className="flex flex-wrap items-center gap-2">
                {transactionOfConfig && (
                  <Badge variant="outline" className={transactionOfConfig.tone}>
                    {transactionOfConfig.icon}
                    {transactionOfConfig.label}
                  </Badge>
                )}
                {isLinkedTransaction ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                          <Info className="mr-1 h-3.5 w-3.5" />
                          Terhubung Administrasi
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Transaksi ini dibuat dari data administrasi.</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Transaksi Manual</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-5">
            <DetailItem label="Kode Transaksi" icon={<ReceiptText className="h-4 w-4" />}><CopyBox text={cashFlowDetail.code || '-'} /></DetailItem>
            <DetailItem label="Tanggal Transaksi" icon={<CalendarDays className="h-4 w-4" />}>{formatDate(cashFlowDetail.date)}</DetailItem>
            <DetailItem label="Perusahaan" icon={<Building2 className="h-4 w-4" />}>{cashFlowDetail.company?.name || '-'}</DetailItem>
            <DetailItem label="Nomor Invoice" icon={<FileCheck2 className="h-4 w-4" />}>{cashFlowDetail.invoice_number || '-'}</DetailItem>
            <DetailItem label="Jenis Transaksi" icon={transactionOfConfig ? transactionOfConfig.icon : <ReceiptText className="h-4 w-4" />}>
              {transactionOfConfig ? transactionOfConfig.label : '-'}
            </DetailItem>
          </CardContent>

          {unitItems.length > 0 && (
            <>
              <Separator />
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rincian Unit Transaksi
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Informasi tipe unit, kuantitas, dan nilai DPP transaksi
                    </p>
                  </div>
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                    Total: {additionalInfo?.total_qty ?? unitItems.reduce((acc, it) => acc + (it.total_qty ?? 0), 0)} Unit
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-md border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Nama Unit</th>
                        <th className="px-4 py-3">Tipe / Model</th>
                        <th className="px-4 py-3 text-right">Kuantitas</th>
                        <th className="px-4 py-3 text-right">DPP / Unit</th>
                        <th className="px-4 py-3 text-right">Total DPP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {unitItems.map((item, idx) => {
                        const typeModel = [item.unit_type?.unit_type, item.unit_type?.unit_model].filter(Boolean).join(' / ');
                        return (
                          <tr key={item.unit_type?.id ?? idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{item.unit_type_name || item.unit_type?.name || '-'}</div>
                              {item.unit_type?.code && (
                                <div className="text-xs text-slate-400 font-mono">{item.unit_type.code}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">
                              {typeModel || '-'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-800">
                              {item.total_qty ?? 0} Unit
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {currenciesFormat('idr', item.dpp_per_unit ?? 0)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              {currenciesFormat('idr', item.total_dpp ?? 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {(additionalInfo?.total_dpp !== undefined || additionalInfo?.total_qty !== undefined) && (
                      <tfoot className="border-t border-slate-200 bg-slate-50/80 font-medium text-slate-700 text-xs">
                        <tr>
                          <td colSpan={2} className="px-4 py-2.5 font-semibold text-slate-900">
                            Total Keseluruhan
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                            {additionalInfo?.total_qty ?? unitItems.reduce((acc, it) => acc + (it.total_qty ?? 0), 0)} Unit
                          </td>
                          <td className="px-4 py-2.5 text-right">-</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                            {currenciesFormat(
                              'idr',
                              additionalInfo?.total_dpp ?? unitItems.reduce((acc, it) => acc + (it.total_dpp ?? 0), 0),
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </>
          )}

          {isSparepart && (
            <>
              <Separator />
              <div className="p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rincian Sparepart Transaksi
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Informasi item sparepart dan kuantitas transaksi
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Total: {additionalInfo?.total_qty ?? 0} Pcs
                  </Badge>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem label="Nama Sparepart" icon={<Wrench className="h-4 w-4" />}>
                    {additionalInfo?.sparepart_name || additionalInfo?.sparepart?.name || '-'}
                  </DetailItem>
                  <DetailItem label="Kode Sparepart" icon={<ReceiptText className="h-4 w-4" />}>
                    <span className="font-mono">{additionalInfo?.sparepart?.code || '-'}</span>
                  </DetailItem>
                  <DetailItem label="Tipe / Kompatibilitas" icon={<Package className="h-4 w-4" />}>
                    {additionalInfo?.sparepart?.unit_type || '-'}
                  </DetailItem>
                  <DetailItem label="Total Kuantitas" icon={<Coins className="h-4 w-4" />}>
                    <span className="font-semibold text-slate-900">{additionalInfo?.total_qty ?? 0} Pcs</span>
                  </DetailItem>
                </div>
              </div>
            </>
          )}
          {unitTransaction && (
            <>
              <Separator />
              <CardContent className="grid gap-6 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-5">
                <DetailItem label="Total Biaya Ekspedisi" icon={<Truck className="h-4 w-4" />}>
                  {currenciesFormat('idr', unitTransaction.expedition_fee_total ?? unitTransaction.expedition_total ?? 0)}
                </DetailItem>
                <DetailItem label="Biaya Lainnya" icon={<Coins className="h-4 w-4" />}>
                  {currenciesFormat('idr', unitTransaction.other_fee_total ?? 0)}
                </DetailItem>
                <DetailItem label="Biaya BBN" icon={<ShieldCheck className="h-4 w-4" />}>
                  {currenciesFormat('idr', unitTransaction.bbn_price_total ?? 0)}
                </DetailItem>
                <DetailItem label="Total Biaya DPP" icon={<ReceiptText className="h-4 w-4" />}>
                  {currenciesFormat('idr', unitTransaction.dpp_total ?? 0)}
                </DetailItem>
                <DetailItem label="Total Biaya PPN" icon={<Percent className="h-4 w-4" />}>
                  {currenciesFormat('idr', unitTransaction.ppn_total ?? 0)}
                </DetailItem>
              </CardContent>
              {usdCostsList.length > 0 && (
                <>
                  <Separator />
                  <div className="p-4 sm:p-6 bg-slate-50/50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Rincian Biaya USD Unit Transaksi</p>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {usdCostsList.map((cost) => (
                        <DetailItem key={cost.type} label={cost.label} icon={<CircleDollarSign className="h-4 w-4" />}>
                          {currenciesFormat('usd', cost.amount)}
                        </DetailItem>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          <Separator />
          <CardContent className="grid gap-4 px-4 py-4 text-xs text-slate-500 sm:grid-cols-2 sm:px-6">
            <span>Dibuat: {formatDate(cashFlowDetail.created_at)}</span>
            <span>Terakhir diperbarui: {formatDate(cashFlowDetail.updated_at)}</span>
          </CardContent>
        </Card>

        {/* list kas */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {mappedSummaryCards.map((card, idx) => (
            <SummaryCard
              key={card.key ?? idx}
              label={card.label}
              value={card.value}
              description={card.description}
              tone={card.tone}
              icon={card.icon}
            />
          ))}
        </div>

        <Card className="rounded-md border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 py-5">
            <CardTitle>Ringkasan Pembayaran</CardTitle>
            <CardDescription>Progres pembayaran terpisah berdasarkan IDR dan USD dengan akumulasi total kas</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 p-4 rounded-md bg-slate-50/60 border border-slate-200/80">
                <h4 className="font-semibold text-slate-800 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>Ringkasan Pembayaran (IDR)</span>
                  <span className="text-xs font-normal text-slate-500">Akumulasi Semua Kas IDR</span>
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Grand Total (IDR)" icon={<WalletCards className="h-4 w-4 text-slate-600" />}>
                    {currenciesFormat('idr', grandTotalIdr)}
                  </DetailItem>
                  <DetailItem label="Total Terbayar (IDR)" icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}>
                    {currenciesFormat('idr', totalPaidIdr)}
                  </DetailItem>
                  <DetailItem label={`Sisa Original (${originalFlowType === 'debet' ? 'Debit' : 'Kredit'})`} icon={<ReceiptText className="h-4 w-4 text-amber-600" />}>
                    <span className={remainingOriginalIdr > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                      {currenciesFormat('idr', remainingOriginalIdr)}
                    </span>
                  </DetailItem>
                  <DetailItem label={`Sisa Dual Flow (${dualFlowType === 'debet' ? 'Debit' : 'Kredit'})`} icon={<ReceiptText className="h-4 w-4 text-purple-600" />}>
                    <span className={remainingDualIdr > 0 ? 'text-purple-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                      {currenciesFormat('idr', remainingDualIdr)}
                    </span>
                  </DetailItem>
                </div>
              </div>

              <div className="space-y-4 p-4 rounded-md bg-blue-50/30 border border-blue-100">
                <h4 className="font-semibold text-blue-900 text-sm border-blue-100 border-b pb-2 flex items-center justify-between">
                  <span>Ringkasan Pembayaran (USD)</span>
                  <span className="text-xs font-normal text-blue-700">Akumulasi Kas USD</span>
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Grand Total (USD)" icon={<WalletCards className="h-4 w-4 text-blue-600" />}>
                    {currenciesFormat('usd', grandTotalUsd)}
                  </DetailItem>
                  <DetailItem label="Total Terbayar (USD)" icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}>
                    {currenciesFormat('usd', totalPaidUsd)}
                  </DetailItem>
                  <DetailItem label={`Sisa Original (${originalFlowType === 'debet' ? 'Debit' : 'Kredit'})`} icon={<ReceiptText className="h-4 w-4 text-amber-600" />}>
                    <span className={remainingOriginalUsd > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                      {currenciesFormat('usd', remainingOriginalUsd)}
                    </span>
                  </DetailItem>
                  <DetailItem label={`Sisa Dual Flow (${dualFlowType === 'debet' ? 'Debit' : 'Kredit'})`} icon={<ReceiptText className="h-4 w-4 text-purple-600" />}>
                    <span className={remainingDualUsd > 0 ? 'text-purple-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                      {currenciesFormat('usd', remainingDualUsd)}
                    </span>
                  </DetailItem>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isCompletelySettled && hasBillings ? (
          <Card className="rounded-md border-emerald-200 bg-emerald-50/60 shadow-none">
            <CardContent className="flex items-start gap-3 p-5 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div><p className="font-semibold">Pembayaran sudah lengkap</p><p className="mt-1 text-sm text-emerald-700">Seluruh rincian pembayaran transaksi ini (original dan dual flow) telah dilengkapi.</p></div>
            </CardContent>
          </Card>
        ) : null}

        <FinanceBillingTable financeBillings={financeBillings} cashFlowDetail={cashFlowDetail} companyId={companyId} disabled={isCompletelySettled && isMarkedPaid} />

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
                    <Button variant="outline" onClick={() => setPreviewUrl(proofUrl)} type="button">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Preview Bukti
                    </Button>
                  ) : (
                    <Button variant="outline" asChild>
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
