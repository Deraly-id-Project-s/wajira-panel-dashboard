import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Award,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  MonthKey,
  ProfitLossReportData,
  ProfitLossReportFilters,
  ProfitLossReportLine,
  ProfitLossReportSection,
  ProfitLossTemplateKey,
  ProfitLossTemplatePayload,
} from '@/@types/profit-loss-report.types';
import type { Account } from '@/@types/account.types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompany } from '@/contexts/CompanyContext';
import { useAccounts } from '@/hooks/useAccount';
import {
  useProfitLossReport,
  useProfitLossTemplate,
  useUpdateProfitLossTemplate,
} from '@/hooks/report/useProfitLossReport';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { exportProfitLossReport } from '@/services/report/profitLossReport.service';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { cn } from '@/lib/utils';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import {
  LaporanLabaRugiPrintDocument,
  type ProfitLossPrintSection,
} from '@/components/features/laporan-laba-rugi/LaporanLabaRugiPrintDocument';

type SectionKey = 'revenue' | 'cogs' | 'opex' | 'non_opex';

interface ReportSectionConfig {
  key: SectionKey;
  title: string;
  description: string;
  templateKey: ProfitLossTemplateKey;
  dataKey: keyof ProfitLossReportData;
  tone: 'positive' | 'negative' | 'neutral';
}

interface NormalizedSection {
  rows: ProfitLossReportLine[];
  total: number;
  totalUsd: number;
}

const DEFAULT_TEMPLATE: ProfitLossTemplatePayload = {
  revenue_account_ids: [80, 183, 186, 181, 180],
  cogs_account_ids: [194, 191],
  opex_account_ids: [],
  non_opex_account_ids: [],
  tax: 0,
};

const EMPTY_REPORT_DATA: ProfitLossReportData = {};

const MONTHS: { key: MonthKey; label: string }[] = [
  { key: 'january', label: 'Januari' },
  { key: 'february', label: 'Februari' },
  { key: 'march', label: 'Maret' },
  { key: 'april', label: 'April' },
  { key: 'may', label: 'Mei' },
  { key: 'june', label: 'Juni' },
  { key: 'july', label: 'Juli' },
  { key: 'august', label: 'Agustus' },
  { key: 'september', label: 'September' },
  { key: 'october', label: 'Oktober' },
  { key: 'november', label: 'November' },
  { key: 'december', label: 'Desember' },
];

const getCompanyName = (companyId?: number | null) => {
  if (companyId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
  if (companyId === 3) return 'PT WAJIRA YANOTAMA';
  if (companyId === 4) return 'PT WAJIRA TRANSINDO';
  return 'PT WAJIRA';
};

const REPORT_SECTIONS: ReportSectionConfig[] = [
  {
    key: 'revenue',
    title: 'Pendapatan',
    description: 'Akun penjualan dan pendapatan utama.',
    templateKey: 'revenue_account_ids',
    dataKey: 'revenue_calc',
    tone: 'positive',
  },
  {
    key: 'cogs',
    title: 'Biaya Atas Pendapatan',
    description: 'Akun biaya atas pendapatan / beban pokok usaha.',
    templateKey: 'cogs_account_ids',
    dataKey: 'cogs_calc',
    tone: 'negative',
  },
  {
    key: 'opex',
    title: 'Biaya Operasional',
    description: 'Akun beban dan biaya operasional kantor dan usaha.',
    templateKey: 'opex_account_ids',
    dataKey: 'opex_calc',
    tone: 'negative',
  },
  {
    key: 'non_opex',
    title: 'Beban Non-Operasional',
    description: 'Akun beban non-operasional (bunga pinjaman, dsb).',
    templateKey: 'non_opex_account_ids',
    dataKey: 'non_opex_calc',
    tone: 'negative',
  },
];

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
};

const getLineBaseAmount = (line: ProfitLossReportLine): number =>
  toNumber(line.amount ?? line.total ?? line.value ?? line.balance);

const getLineCurrency = (line: ProfitLossReportLine) =>
  String(line.type ?? 'IDR').toUpperCase() === 'USD' ? 'usd' : 'idr';

const getLineUsdAmount = (line: ProfitLossReportLine): number => {
  const explicitUsd = line.amount_usd ?? line.total_usd ?? line.value_usd ?? line.balance_usd;
  if (explicitUsd !== undefined && explicitUsd !== null) return toNumber(explicitUsd);
  return getLineCurrency(line) === 'usd' ? getLineBaseAmount(line) : 0;
};

const getLineIdrAmount = (line: ProfitLossReportLine): number => {
  const hasExplicitUsd = [line.amount_usd, line.total_usd, line.value_usd, line.balance_usd]
    .some((value) => value !== undefined && value !== null);
  return !hasExplicitUsd && getLineCurrency(line) === 'usd' ? 0 : getLineBaseAmount(line);
};

const getUsdTotal = (rows: ProfitLossReportLine[]) =>
  rows.reduce((sum, line) => sum + getLineUsdAmount(line), 0);

const normalizeSection = (
  value: unknown,
  accountMap?: Map<number, Account>,
): NormalizedSection => {
  if (Array.isArray(value)) {
    const rows = value as ProfitLossReportLine[];
    let total = 0;
    let totalUsd = 0;
    for (const line of rows) {
      total += getLineIdrAmount(line);
      totalUsd += getLineUsdAmount(line);
    }
    return { rows, total, totalUsd };
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return { rows: [], total: toNumber(value), totalUsd: 0 };
  }

  if (value && typeof value === 'object') {
    const section = value as ProfitLossReportSection;
    const rows = section.accounts ?? section.rows ?? section.items ?? section.data ?? [];
    if (rows.length > 0) {
      let totalUsd = 0;
      let totalIdr = 0;
      for (const line of rows) {
        totalIdr += getLineIdrAmount(line);
        totalUsd += getLineUsdAmount(line);
      }
      const total = section.total !== undefined && section.total !== null
        ? toNumber(section.total)
        : totalIdr;
      return { rows, total, totalUsd };
    }

    const total = section.total ?? section.amount ?? section.value;
    const totalUsd = section.total_usd ?? section.amount_usd ?? section.value_usd;

    return {
      rows: [],
      total: total === undefined || total === null ? 0 : toNumber(total),
      totalUsd: totalUsd === undefined || totalUsd === null ? 0 : toNumber(totalUsd),
    };
  }

  return { rows: [], total: 0, totalUsd: 0 };
};

const getAccountTypeLabel = (
  line: ProfitLossReportLine,
  accountMap?: Map<number, Account>,
): 'DEBIT' | 'KREDIT' => {
  const accId = Number(line.account_id ?? line.id);
  if (accId && accountMap?.has(accId)) {
    const acc = accountMap.get(accId);
    if (acc?.type === 'credit') return 'KREDIT';
    if (acc?.type === 'debit' || acc?.type === 'debet') return 'DEBIT';
  }
  const rawType =
    line.account_type ||
    (line as { account?: { type?: string } }).account?.type ||
    (line.type && ['debit', 'debet', 'credit', 'kredit'].includes(String(line.type).toLowerCase())
      ? line.type
      : undefined);
  if (rawType) {
    const lower = String(rawType).toLowerCase();
    if (lower === 'credit' || lower === 'kredit') return 'KREDIT';
    if (lower === 'debit' || lower === 'debet') return 'DEBIT';
  }
  const code = (line.account_code ?? line.code ?? '').trim();
  if (code && accountMap) {
    for (const acc of accountMap.values()) {
      if (acc.code === code) {
        if (acc.type === 'credit') return 'KREDIT';
        if (acc.type === 'debit' || acc.type === 'debet') return 'DEBIT';
      }
    }
  }
  return 'DEBIT';
};

const getLineLabel = (
  line: ProfitLossReportLine,
  accountMap?: Map<number, Account>,
) => {
  const code = (line.account_code ?? line.code ?? '').trim();
  const name = (line.account_name ?? line.name ?? line.label ?? 'Akun').trim();
  const typeLabel = getAccountTypeLabel(line, accountMap);
  const codeStr = code ? ` ${code}` : '';
  return `[${typeLabel}] ${name}${codeStr}`.trim();
};

const uniqueNumbers = (values?: Array<number | string | null | undefined>) =>
  (values ?? [])
    .map((value) => Number(value))
    .filter((value, index, array) => Number.isFinite(value) && value > 0 && array.indexOf(value) === index);

const buildTemplateState = (): Record<ProfitLossTemplateKey, number[]> => ({
  revenue_account_ids: [...DEFAULT_TEMPLATE.revenue_account_ids],
  cogs_account_ids: [...DEFAULT_TEMPLATE.cogs_account_ids],
  opex_account_ids: [...DEFAULT_TEMPLATE.opex_account_ids],
  non_opex_account_ids: [...(DEFAULT_TEMPLATE.non_opex_account_ids ?? [])],
});

const buildTemplateStateFromReport = (reportData: ProfitLossReportData): Record<ProfitLossTemplateKey, number[]> => ({
  revenue_account_ids: uniqueNumbers(reportData.revenue_account_ids ?? DEFAULT_TEMPLATE.revenue_account_ids),
  cogs_account_ids: uniqueNumbers(reportData.cogs_account_ids ?? DEFAULT_TEMPLATE.cogs_account_ids),
  opex_account_ids: uniqueNumbers(reportData.opex_account_ids ?? DEFAULT_TEMPLATE.opex_account_ids),
  non_opex_account_ids: uniqueNumbers(reportData.non_opex_account_ids ?? DEFAULT_TEMPLATE.non_opex_account_ids ?? []),
});

function AmountSummary({
  idrValue,
  usdValue,
  className,
}: {
  idrValue: number;
  usdValue: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-lg font-bold">{currenciesFormat('idr', idrValue)}</p>
      <p className="mt-1 text-sm font-semibold text-sky-700">{currenciesFormat('usd', usdValue)}</p>
    </div>
  );
};

function SectionViewer({
  config,
  reportSection,
  accountMap,
}: {
  config: ReportSectionConfig;
  reportSection: NormalizedSection;
  accountMap?: Map<number, Account>;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="grid gap-4 border-b border-slate-100 p-4 lg:grid-cols-[minmax(260px,1fr)_220px] lg:items-start">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{config.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{config.description}</p>
        </div>
        <div className="lg:text-right">
          <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
          <AmountSummary
            idrValue={reportSection.total}
            usdValue={reportSection.totalUsd}
            className={cn(
              'mt-1',
              config.tone === 'positive' && 'text-emerald-700',
              config.tone === 'negative' && 'text-rose-700',
              config.tone === 'neutral' && 'text-slate-900',
            )}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[1fr_150px_130px] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
            <span>Akun</span>
            <span className="text-right">IDR</span>
            <span className="text-right">USD</span>
          </div>
          {reportSection.rows.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-slate-500">Belum ada rincian dari laporan.</div>
          ) : (
            reportSection.rows.map((line, index) => (
              <div
                key={`${line.id ?? line.account_id ?? index}`}
                className="grid grid-cols-[1fr_150px_130px] gap-3 border-t border-slate-100 px-3 py-2 text-sm"
              >
                <span
                  className="min-w-0 truncate text-slate-700"
                  title={getLineLabel(line, accountMap)}
                >
                  {getLineLabel(line, accountMap)}
                </span>
                <span className="text-right font-medium text-slate-900">
                  {currenciesFormat('idr', getLineIdrAmount(line))}
                </span>
                <span className="text-right font-medium text-sky-700">
                  {currenciesFormat('usd', getLineUsdAmount(line))}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default function LaporanLabaRugiPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const [templateState, setTemplateState] = useState<Record<ProfitLossTemplateKey, number[]>>(
    buildTemplateState,
  );
  const [taxInput, setTaxInput] = useState<string>('0');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Load template query to obtain configured template years
  const templateQuery = useProfitLossTemplate(
    resolvedCompanyId,
    undefined,
    Boolean(resolvedCompanyId),
  );

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const configuredYears =
      templateQuery.data?.data?.template?.profit_loss_template_years
        ?.map((item) => Number(item.year))
        .filter((y) => !isNaN(y) && y > 0) ?? [];

    const defaultYearRange = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);
    const merged = Array.from(new Set([...configuredYears, ...defaultYearRange, currentYear]));
    return merged.sort((a, b) => b - a);
  }, [templateQuery.data?.data?.template?.profit_loss_template_years]);

  // Load accounts for resolving accurate account type (debit / kredit)
  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: resolvedCompanyId ?? undefined,
    enabled: Boolean(resolvedCompanyId),
  });
  const accounts = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);
  const accountMap = useMemo(() => {
    const map = new Map<number, Account>();
    accounts.forEach((acc) => {
      map.set(Number(acc.id), acc);
    });
    return map;
  }, [accounts]);

  // API filter: default empty ({}), only add month or year if user specifically selected it
  const reportFilters = useMemo<ProfitLossReportFilters>(() => {
    const filters: ProfitLossReportFilters = {};
    if (selectedYear !== 'all' && selectedYear) {
      filters.year = Number(selectedYear);
    }
    if (selectedMonth !== 'all' && selectedMonth) {
      filters.month = selectedMonth;
    }
    return filters;
  }, [selectedMonth, selectedYear]);

  const reportQuery = useProfitLossReport(
    resolvedCompanyId,
    reportFilters,
    Boolean(resolvedCompanyId),
  );
  const updateTemplateMutation = useUpdateProfitLossTemplate(resolvedCompanyId);

  const reportData = reportQuery.data?.data ?? EMPTY_REPORT_DATA;
  useEffect(() => {
    if (!reportQuery.data?.data) return;
    const data = reportQuery.data.data;
    setTemplateState(buildTemplateStateFromReport(data));
    const rawTax = data.tax ?? data.tax_percentage ?? data.template?.tax ?? 0;
    setTaxInput(String(rawTax ?? 0));
  }, [reportQuery.data?.data]);

  const normalizedSections = useMemo(() => {
    return REPORT_SECTIONS.reduce<Record<SectionKey, NormalizedSection>>((acc, section) => {
      acc[section.key] = normalizeSection(reportData[section.dataKey], accountMap);
      return acc;
    }, {} as Record<SectionKey, NormalizedSection>);
  }, [reportData, accountMap]);

  // 1. TOTAL PENDAPATAN = sum(dari kategori laporan pendapatan)
  const totalPendapatan = normalizedSections.revenue.total;
  const totalPendapatanUsd = normalizedSections.revenue.totalUsd;

  // 2. TOTAL BIAYA ATAS PENDAPATAN = sum(dari kategori laporan BIAYA ATAS PENDAPATAN)
  const totalBiayaAtasPendapatan = normalizedSections.cogs.total;
  const totalBiayaAtasPendapatanUsd = normalizedSections.cogs.totalUsd;

  // 3. LABA KOTOR = TOTAL PENDAPATAN - TOTAL BIAYA ATAS PENDAPATAN
  const labaKotor = totalPendapatan - totalBiayaAtasPendapatan;
  const labaKotorUsd = totalPendapatanUsd - totalBiayaAtasPendapatanUsd;

  // 4. TOTAL BIAYA OPERASIONAL = sum(dari kategori laporan BIAYA OPERASIONAL)
  const totalBiayaOperasional = normalizedSections.opex.total;
  const totalBiayaOperasionalUsd = normalizedSections.opex.totalUsd;

  // 5. TOTAL BEBAN NON-OPERASIONAL = sum(dari kategori laporan BEBAN NON-OPERASIONAL)
  const totalBebanNonOperasional = normalizedSections.non_opex.total;
  const totalBebanNonOperasionalUsd = normalizedSections.non_opex.totalUsd;

  // 6. LABA PERIODE BERJALAN = LABA KOTOR - TOTAL BIAYA OPERASIONAL - TOTAL BEBAN NON-OPERASIONAL
  const labaPeriodeBerjalan = reportData.profit_loss_before_tax !== undefined && reportData.profit_loss_before_tax !== null
    ? toNumber(reportData.profit_loss_before_tax)
    : (labaKotor - totalBiayaOperasional - totalBebanNonOperasional);
  const labaPeriodeBerjalanUsd = labaKotorUsd - totalBiayaOperasionalUsd - totalBebanNonOperasionalUsd;

  const taxPercentage = toNumber(taxInput);
  const taxAmount = reportData.tax_amount !== undefined && reportData.tax_amount !== null
    ? toNumber(reportData.tax_amount)
    : (labaPeriodeBerjalan > 0 ? labaPeriodeBerjalan * (taxPercentage / 100) : 0);
  const taxAmountUsd = reportData.tax_amount_usd !== undefined && reportData.tax_amount_usd !== null
    ? toNumber(reportData.tax_amount_usd)
    : (labaPeriodeBerjalanUsd > 0 ? labaPeriodeBerjalanUsd * (taxPercentage / 100) : 0);

  const profitAfterTax = reportData.profit_loss_after_tax !== undefined && reportData.profit_loss_after_tax !== null
    ? toNumber(reportData.profit_loss_after_tax)
    : (labaPeriodeBerjalan - taxAmount);
  const profitAfterTaxUsd = labaPeriodeBerjalanUsd - taxAmountUsd;

  const printSections = useMemo<ProfitLossPrintSection[]>(() => [
    {
      key: 'revenue',
      title: 'Pendapatan',
      rows: normalizedSections.revenue.rows,
      total: normalizedSections.revenue.total,
      totalUsd: normalizedSections.revenue.totalUsd,
    },
    {
      key: 'cogs',
      title: 'Biaya Atas Pendapatan',
      rows: normalizedSections.cogs.rows,
      total: normalizedSections.cogs.total,
      totalUsd: normalizedSections.cogs.totalUsd,
      deduction: true,
    },
    {
      key: 'opex',
      title: 'Biaya Operasional',
      rows: normalizedSections.opex.rows,
      total: normalizedSections.opex.total,
      totalUsd: normalizedSections.opex.totalUsd,
      deduction: true,
    },
    {
      key: 'non_opex',
      title: 'Beban Non-Operasional',
      rows: normalizedSections.non_opex.rows,
      total: normalizedSections.non_opex.total,
      totalUsd: normalizedSections.non_opex.totalUsd,
      deduction: true,
    },
  ], [normalizedSections]);

  const activeMonthLabel = useMemo(() => {
    const m = selectedMonth !== 'all' ? selectedMonth : reportData.month;
    if (!m) return null;
    return MONTHS.find((item) => item.key.toLowerCase() === String(m).toLowerCase())?.label || String(m);
  }, [selectedMonth, reportData.month]);

  const activeYear = useMemo(() => {
    if (selectedYear !== 'all') return selectedYear;
    if (reportData.year) return String(reportData.year);
    return null;
  }, [selectedYear, reportData.year]);

  const periodLabel = useMemo(() => {
    if (activeMonthLabel && activeYear) {
      return `${activeMonthLabel} ${activeYear}`;
    }
    if (activeYear) {
      return `Tahun ${activeYear}`;
    }
    if (activeMonthLabel) {
      return `Bulan ${activeMonthLabel}`;
    }
    return 'Periode Berjalan';
  }, [activeMonthLabel, activeYear]);

  const handleExport = async () => {
    if (!resolvedCompanyId) {
      toast.error('Company belum dipilih.');
      return;
    }

    setIsExporting(true);
    try {
      await exportProfitLossReport(resolvedCompanyId, reportFilters);
      toast.success('Export laporan laba rugi berhasil diproses.');
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal export laporan laba rugi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <PageHeader
          title="Laporan Laba Rugi"
          subtitle="Ringkasan pendapatan, HPP, biaya, dan laba bersih berdasarkan template akun."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => void reportQuery.refetch()}
                disabled={reportQuery.isFetching}
              >
                <RefreshCw className={cn('h-4 w-4', reportQuery.isFetching && 'animate-spin')} />
                Muat Ulang
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || !resolvedCompanyId}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={templatePrint.openPrintDialog}
                disabled={reportQuery.isLoading}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  const slug = router.query.slug ? String(router.query.slug) : '';
                  void router.push(`/dashboard/${slug}/laporan/laporan-laba-rugi/template`);
                }}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sesuaikan template
              </Button>
            </>
          }
        />

        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="w-full sm:w-[200px]">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-9 w-full bg-white">
                <SelectValue placeholder="Pilih Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan (Default)</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[180px]">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-9 w-full bg-white">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun (Default)</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full sm:w-auto"
            onClick={() => {
              setSelectedMonth('all');
              setSelectedYear('all');
            }}
            disabled={selectedMonth === 'all' && selectedYear === 'all'}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>

          <div className="ml-auto hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Periode aktif:{' '}
              <strong className="font-semibold text-slate-700">{periodLabel}</strong>
            </span>
          </div>
        </div>

        {/* Information Cards Ringkasan Keuangan Utama */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. TOTAL PENDAPATAN */}
          <div className="flex flex-col justify-between rounded-lg border border-emerald-200/90 bg-linear-to-b from-emerald-50/50 to-white p-4 shadow-2xs transition-shadow hover:shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
                  TOTAL PENDAPATAN
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sum kategori pendapatan
              </p>
            </div>
            <AmountSummary
              idrValue={totalPendapatan}
              usdValue={totalPendapatanUsd}
              className="mt-3 text-emerald-700 [&>p:first-child]:text-xl [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 2. TOTAL BIAYA ATAS PENDAPATAN */}
          <div className="flex flex-col justify-between rounded-lg border border-rose-200/90 bg-linear-to-b from-rose-50/40 to-white p-4 shadow-2xs transition-shadow hover:shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-rose-800">
                  TOTAL BIAYA ATAS PENDAPATAN
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <TrendingDown className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sum biaya atas pendapatan (HPP)
              </p>
            </div>
            <AmountSummary
              idrValue={totalBiayaAtasPendapatan}
              usdValue={totalBiayaAtasPendapatanUsd}
              className="mt-3 text-rose-700 [&>p:first-child]:text-xl [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 3. LABA KOTOR */}
          <div className="flex flex-col justify-between rounded-lg border border-blue-200 bg-linear-to-b from-blue-50/40 to-white p-4 shadow-2xs transition-shadow hover:shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-blue-900">
                  LABA KOTOR
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Scale className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Pendapatan − Biaya Pendapatan
              </p>
            </div>
            <AmountSummary
              idrValue={labaKotor}
              usdValue={labaKotorUsd}
              className={cn(
                'mt-3 [&>p:first-child]:text-xl [&>p:first-child]:font-extrabold',
                labaKotor < 0 ? 'text-rose-700' : 'text-slate-900',
              )}
            />
          </div>

          {/* 4. TOTAL BIAYA OPERASIONAL */}
          <div className="flex flex-col justify-between rounded-lg border border-amber-200/90 bg-linear-to-b from-amber-50/40 to-white p-4 shadow-2xs transition-shadow hover:shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-amber-900">
                  TOTAL BIAYA OPERASIONAL
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sum biaya operasional
              </p>
            </div>
            <AmountSummary
              idrValue={totalBiayaOperasional}
              usdValue={totalBiayaOperasionalUsd}
              className="mt-3 text-rose-700 [&>p:first-child]:text-xl [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 5. TOTAL BEBAN NON-OPERASIONAL */}
          <div className="flex flex-col justify-between rounded-lg border border-purple-200/90 bg-linear-to-b from-purple-50/40 to-white p-4 shadow-2xs transition-shadow hover:shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-purple-900">
                  BEBAN NON-OPERASIONAL
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Sum beban non-operasional
              </p>
            </div>
            <AmountSummary
              idrValue={totalBebanNonOperasional}
              usdValue={totalBebanNonOperasionalUsd}
              className="mt-3 text-rose-700 [&>p:first-child]:text-xl [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 6. LABA PERIODE BERJALAN */}
          <div
            className={cn(
              'flex flex-col justify-between rounded-lg p-4 shadow-xs transition-shadow hover:shadow-md border-2',
              labaPeriodeBerjalan >= 0
                ? 'border-emerald-500/80 bg-linear-to-b from-emerald-50 to-white'
                : 'border-rose-400 bg-linear-to-b from-rose-50 to-white',
            )}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'text-[11px] font-extrabold tracking-wider uppercase',
                    labaPeriodeBerjalan >= 0 ? 'text-emerald-900' : 'text-rose-900',
                  )}
                >
                  LABA PERIODE BERJALAN
                </span>
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                    labaPeriodeBerjalan >= 0
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white',
                  )}
                >
                  <Award className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Laba Kotor − Beban Usaha & Non-Operasional
              </p>
            </div>
            <AmountSummary
              idrValue={labaPeriodeBerjalan}
              usdValue={labaPeriodeBerjalanUsd}
              className={cn(
                'mt-3 [&>p:first-child]:text-xl [&>p:first-child]:font-extrabold',
                labaPeriodeBerjalan < 0 ? 'text-rose-700' : 'text-emerald-700',
              )}
            />
          </div>
        </div>

        {reportQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        ) : reportQuery.isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Gagal memuat laporan laba rugi.
          </div>
        ) : (
          <div className="space-y-4">
            {REPORT_SECTIONS.map((section) => (
              <SectionViewer
                key={section.key}
                config={section}
                reportSection={normalizedSections[section.key]}
                accountMap={accountMap}
              />
            ))}
          </div>
        )}

        {/* Form Tax & Perhitungan Laba Rugi Bersih (Bagian Bawah) */}
        <section className="rounded-md border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Perhitungan Pajak & Laba Rugi Bersih</h2>
              <p className="text-sm text-slate-500">
                Atur persentase pajak (menerima masukan bilangan desimal) untuk menyesuaikan nominal Laba / (Rugi) Bersih Setelah Pajak.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="tax-input-field" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Pajak (%):
              </Label>
              <div className="relative w-36">
                <Input
                  id="tax-input-field"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={taxInput}
                  onChange={(e) => setTaxInput(e.target.value)}
                  placeholder="0"
                  className="pr-8 text-right font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Laba / (Rugi) Periode Berjalan (Sebelum Pajak)
              </p>
              <AmountSummary
                idrValue={labaPeriodeBerjalan}
                usdValue={labaPeriodeBerjalanUsd}
                className={cn('mt-2 [&>p:first-child]:text-xl', labaPeriodeBerjalan < 0 ? 'text-rose-700' : 'text-slate-900')}
              />
            </div>

            <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                Beban Pajak ({taxPercentage}%)
              </p>
              <AmountSummary
                idrValue={taxAmount}
                usdValue={taxAmountUsd}
                className="mt-2 text-amber-800 [&>p:first-child]:text-xl"
              />
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                Laba / (Rugi) Bersih Setelah Pajak
              </p>
              <AmountSummary
                idrValue={profitAfterTax}
                usdValue={profitAfterTaxUsd}
                className={cn('mt-2 [&>p:first-child]:text-xl', profitAfterTax < 0 ? 'text-rose-700' : 'text-emerald-800')}
              />
            </div>
          </div>
        </section>

        <LaporanLabaRugiPrintDocument
          template={templatePrint.selectedTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          periodLabel={periodLabel}
          sections={printSections}
          grossProfit={labaKotor}
          grossProfitUsd={labaKotorUsd}
          profitBeforeTax={labaPeriodeBerjalan}
          profitBeforeTaxUsd={labaPeriodeBerjalanUsd}
          taxPercentage={taxPercentage}
          taxAmount={taxAmount}
          taxAmountUsd={taxAmountUsd}
          profitAfterTax={profitAfterTax}
          profitAfterTaxUsd={profitAfterTaxUsd}
          printedAt={templatePrint.printedAt}
        />

        <ReportTemplatePrintDialog
          open={templatePrint.isDialogOpen}
          onOpenChange={templatePrint.setIsDialogOpen}
          selectedTemplateId={templatePrint.selectedTemplateId}
          onTemplateChange={templatePrint.setSelectedTemplateId}
          onPrint={templatePrint.printWithSelectedTemplate}
          isPreparingPrint={templatePrint.isPreparingPrint}
          reportName="laporan laba rugi"
        />
      </div>
    </DashboardLayout>
  );
}
