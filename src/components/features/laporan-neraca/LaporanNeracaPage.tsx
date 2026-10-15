import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Printer,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  BalanceAccountItem,
  BalanceCategoryCalc,
  BalanceReportFilters,
  MonthKey,
} from '@/@types/balance-report.types';
import type { Account } from '@/@types/account.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import {
  LaporanNeracaPrintDocument,
  type BalancePrintCategory,
} from '@/components/features/laporan-neraca/LaporanNeracaPrintDocument';
import { useCompany } from '@/contexts/CompanyContext';
import { useAccounts } from '@/hooks/useAccount';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import {
  useBalanceReport,
  useBalanceTemplate,
} from '@/hooks/report/useBalanceReport';
import { exportBalanceReport } from '@/services/report/balanceReport.service';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { cn } from '@/lib/utils';

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
  if (companyId === 2) return 'PT WAJIRA INTERNASIONAL';
  if (companyId === 3) return 'PT WAJIRA YANOTAMA';
  if (companyId === 4) return 'PT WAJIRA TRANSINDO';
  if (companyId === 5) return 'PT ADHIYASA GRADASTA';
  return 'PT WAJIRA';
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
};

const getLineIdrAmount = (line: BalanceAccountItem): number => {
  const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD';
  return isUsd ? 0 : toNumber(line.amount ?? line.value ?? line.total);
};

const getLineUsdAmount = (line: BalanceAccountItem): number => {
  const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD';
  return isUsd ? toNumber(line.amount ?? line.value ?? line.total) : 0;
};

const getAccountTypeLabel = (
  line: BalanceAccountItem,
  accountMap?: Map<number, Account>,
): 'DEBIT' | 'KREDIT' => {
  const accId = Number(line.account_id ?? line.id);
  if (accId && accountMap?.has(accId)) {
    const acc = accountMap.get(accId);
    if (acc?.type === 'credit') return 'KREDIT';
    if (acc?.type === 'debit' || acc?.type === 'debet') return 'DEBIT';
  }
  const rawType = line.account_type;
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
  line: BalanceAccountItem,
  accountMap?: Map<number, Account>,
) => {
  const code = (line.account_code ?? line.code ?? '').trim();
  const name = (line.account_name ?? line.name ?? 'Akun').trim();
  const typeLabel = getAccountTypeLabel(line, accountMap);
  const codeStr = code ? ` ${code}` : '';
  return `[${typeLabel}] ${name}${codeStr}`.trim();
};

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
      <p className="mt-0.5 text-sm font-semibold text-sky-700">{currenciesFormat('usd', usdValue)}</p>
    </div>
  );
}

interface NormalizedCategory {
  accounts: BalanceAccountItem[];
  totalIdr: number;
  totalUsd: number;
}

const normalizeCategory = (cat?: BalanceCategoryCalc | null): NormalizedCategory => {
  if (!cat) return { accounts: [], totalIdr: 0, totalUsd: 0 };
  const accounts = Array.isArray(cat.accounts) ? cat.accounts : [];

  let calcIdr = 0;
  let calcUsd = 0;
  accounts.forEach((acc) => {
    calcIdr += getLineIdrAmount(acc);
    calcUsd += getLineUsdAmount(acc);
  });

  return {
    accounts,
    totalIdr: cat.total !== undefined && cat.total !== null ? toNumber(cat.total) : calcIdr,
    totalUsd: cat.total_usd !== undefined && cat.total_usd !== null ? toNumber(cat.total_usd) : calcUsd,
  };
};

function BalanceSheetSection({
  title,
  subtotalLabel,
  category,
  searchKeyword,
  accountMap,
}: {
  title: string;
  subtotalLabel: string;
  category: NormalizedCategory;
  searchKeyword: string;
  accountMap?: Map<number, Account>;
}) {
  const filteredAccounts = useMemo(() => {
    if (!searchKeyword) return category.accounts;
    return category.accounts.filter((acc) => {
      const code = (acc.account_code ?? acc.code ?? '').toLowerCase();
      const name = (acc.account_name ?? acc.name ?? '').toLowerCase();
      return code.includes(searchKeyword) || name.includes(searchKeyword);
    });
  }, [category.accounts, searchKeyword]);

  return (
    <section className="border-t border-slate-200 px-4 py-3.5 first:border-t-0">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{category.accounts.length} akun terdaftar</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="text-xs font-semibold uppercase text-slate-600">Akun</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase text-slate-600 w-36">IDR</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase text-slate-600 w-32">USD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-4 text-center text-xs text-slate-400 italic">
                  {searchKeyword ? 'Akun tidak cocok dengan pencarian.' : 'Belum ada akun pada grup ini.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((line, index) => {
                const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD';
                const idrAmt = getLineIdrAmount(line);
                const usdAmt = getLineUsdAmount(line);

                return (
                  <TableRow key={`${line.id ?? line.account_id ?? index}`} className="hover:bg-slate-50">
                    <TableCell className="min-w-[180px] text-xs font-medium text-slate-700 py-2">
                      <span title={getLineLabel(line, accountMap)} className="truncate block">
                        {getLineLabel(line, accountMap)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-slate-900 tabular-nums py-2">
                      {isUsd ? '-' : currenciesFormat('idr', idrAmt)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-sky-700 tabular-nums py-2">
                      {!isUsd && usdAmt === 0 ? '-' : currenciesFormat('usd', usdAmt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}

            {/* Subtotal Row */}
            <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200 hover:bg-slate-50">
              <TableCell className="text-xs font-bold uppercase text-slate-700 py-2.5">
                {subtotalLabel}
              </TableCell>
              <TableCell className="text-right text-xs font-bold text-slate-900 tabular-nums py-2.5">
                {currenciesFormat('idr', category.totalIdr)}
              </TableCell>
              <TableCell className="text-right text-xs font-bold text-sky-700 tabular-nums py-2.5">
                {currenciesFormat('usd', category.totalUsd)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export default function LaporanNeracaPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const [searchInput, setSearchInput] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Template query for available configured years
  const templateQuery = useBalanceTemplate(
    resolvedCompanyId,
    undefined,
    Boolean(resolvedCompanyId),
  );

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const configuredYears =
      templateQuery.data?.data?.template?.ballance_template_years
        ?.map((item) => Number(item.year))
        .filter((y) => !isNaN(y) && y > 0) ?? [];

    const defaultYearRange = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);
    const merged = Array.from(new Set([...configuredYears, ...defaultYearRange, currentYear]));
    return merged.sort((a, b) => b - a);
  }, [templateQuery.data?.data?.template?.ballance_template_years]);

  // Load master accounts for label and type resolution
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

  // Filters for Report Query
  const reportFilters = useMemo<BalanceReportFilters>(() => {
    const filters: BalanceReportFilters = {};
    if (selectedYear !== 'all' && selectedYear) {
      filters.year = Number(selectedYear);
    }
    if (selectedMonth !== 'all' && selectedMonth) {
      filters.month = selectedMonth;
    }
    return filters;
  }, [selectedMonth, selectedYear]);

  const reportQuery = useBalanceReport(
    resolvedCompanyId,
    reportFilters,
    Boolean(resolvedCompanyId),
  );

  const reportData = reportQuery.data?.data;
  const searchKeyword = searchInput.trim().toLowerCase();

  // Normalize 4 main categories
  const currentAssetCat = useMemo(
    () => normalizeCategory(reportData?.current_asset_calc),
    [reportData?.current_asset_calc],
  );

  const fixedAssetCat = useMemo(
    () => normalizeCategory(reportData?.fixed_asset_calc),
    [reportData?.fixed_asset_calc],
  );

  const liabilityCat = useMemo(
    () => normalizeCategory(reportData?.liability_calc),
    [reportData?.liability_calc],
  );

  const equityCat = useMemo(
    () => normalizeCategory(reportData?.equity_calc),
    [reportData?.equity_calc],
  );

  // Calculations:
  // 1. Jumlah Aset Lancar = sum all dari Aset Lancar
  const jumlahAsetLancar = currentAssetCat.totalIdr;
  const jumlahAsetLancarUsd = currentAssetCat.totalUsd;

  // 2. Jumlah Aset Tetap = sum all dari Aset Tetap
  const jumlahAsetTetap = fixedAssetCat.totalIdr;
  const jumlahAsetTetapUsd = fixedAssetCat.totalUsd;

  // 3. Total Aktiva = Jumlah Aset Lancar + Jumlah Aset Tetap
  const totalAktiva = reportData?.total_assets !== undefined && reportData?.total_assets !== null
    ? toNumber(reportData.total_assets)
    : jumlahAsetLancar + jumlahAsetTetap;
  const totalAktivaUsd = reportData?.total_assets_usd !== undefined && reportData?.total_assets_usd !== null
    ? toNumber(reportData.total_assets_usd)
    : jumlahAsetLancarUsd + jumlahAsetTetapUsd;

  // 4. Jumlah Kewajiban = sum all dari Kewajiban
  const jumlahKewajiban = liabilityCat.totalIdr;
  const jumlahKewajibanUsd = liabilityCat.totalUsd;

  // 5. Jumlah Modal = sum all dari Modal
  const jumlahModal = equityCat.totalIdr;
  const jumlahModalUsd = equityCat.totalUsd;

  // 6. Total Pasiva = Jumlah Kewajiban + Jumlah Modal
  const totalPasiva = reportData?.total_passiva !== undefined && reportData?.total_passiva !== null
    ? toNumber(reportData.total_passiva)
    : jumlahKewajiban + jumlahModal;
  const totalPasivaUsd = reportData?.total_passiva_usd !== undefined && reportData?.total_passiva_usd !== null
    ? toNumber(reportData.total_passiva_usd)
    : jumlahKewajibanUsd + jumlahModalUsd;

  // Balance Check
  const isBalanced = totalAktiva === totalPasiva;
  const difference = Math.abs(totalAktiva - totalPasiva);
  const differenceUsd = Math.abs(totalAktivaUsd - totalPasivaUsd);

  // Active Period Label
  const activeMonthLabel = useMemo(() => {
    const m = selectedMonth !== 'all' ? selectedMonth : reportData?.month;
    if (!m) return null;
    return MONTHS.find((item) => item.key.toLowerCase() === String(m).toLowerCase())?.label || String(m);
  }, [selectedMonth, reportData?.month]);

  const activeYear = useMemo(() => {
    if (selectedYear !== 'all') return selectedYear;
    if (reportData?.year) return String(reportData.year);
    return null;
  }, [selectedYear, reportData?.year]);

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
    return 'Semua Periode';
  }, [activeMonthLabel, activeYear]);

  // Excel Export Handler
  const handleExport = async () => {
    if (!resolvedCompanyId) {
      toast.error('Perusahaan belum dipilih.');
      return;
    }

    setIsExporting(true);
    try {
      await exportBalanceReport(resolvedCompanyId, reportFilters);
      toast.success('Export Laporan Neraca berhasil diproses.');
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal export laporan neraca.');
    } finally {
      setIsExporting(false);
    }
  };

  // Print Document Categories
  const printCurrentAssets: BalancePrintCategory = useMemo(() => ({
    title: 'Aset Lancar',
    subtotalLabel: 'Jumlah Aset Lancar',
    accounts: currentAssetCat.accounts,
    totalIdr: jumlahAsetLancar,
    totalUsd: jumlahAsetLancarUsd,
  }), [currentAssetCat.accounts, jumlahAsetLancar, jumlahAsetLancarUsd]);

  const printFixedAssets: BalancePrintCategory = useMemo(() => ({
    title: 'Aset Tetap',
    subtotalLabel: 'Jumlah Aset Tetap',
    accounts: fixedAssetCat.accounts,
    totalIdr: jumlahAsetTetap,
    totalUsd: jumlahAsetTetapUsd,
  }), [fixedAssetCat.accounts, jumlahAsetTetap, jumlahAsetTetapUsd]);

  const printLiabilities: BalancePrintCategory = useMemo(() => ({
    title: 'Kewajiban',
    subtotalLabel: 'Jumlah Kewajiban',
    accounts: liabilityCat.accounts,
    totalIdr: jumlahKewajiban,
    totalUsd: jumlahKewajibanUsd,
  }), [liabilityCat.accounts, jumlahKewajiban, jumlahKewajibanUsd]);

  const printEquity: BalancePrintCategory = useMemo(() => ({
    title: 'Modal',
    subtotalLabel: 'Jumlah Modal',
    accounts: equityCat.accounts,
    totalIdr: jumlahModal,
    totalUsd: jumlahModalUsd,
  }), [equityCat.accounts, jumlahModal, jumlahModalUsd]);

  const isLoading = reportQuery.isLoading || accountQuery.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <PageHeader
          title="Laporan Neraca"
          subtitle="Posisi keuangan perusahaan mencakup rincian aktiva (aset lancar & aset tetap) dan pasiva (kewajiban & modal)."
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
                disabled={isExporting || !resolvedCompanyId || isLoading}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={templatePrint.openPrintDialog}
                disabled={isLoading || reportQuery.isError}
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  const slug = router.query.slug ? String(router.query.slug) : '';
                  void router.push(`/dashboard/${slug}/laporan/ballance-report/template`);
                }}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Sesuaikan template
              </Button>
            </>
          }
        />

        {/* Filter Bar (Bulan, Tahun, Search, Reset) */}
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

          <SearchInput
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            placeholder="Cari akun pada laporan..."
            aria-label="Cari akun pada Laporan Neraca"
            wrapperClassName="w-full sm:w-[280px]"
          />

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full sm:w-auto"
            onClick={() => {
              setSelectedMonth('all');
              setSelectedYear('all');
              setSearchInput('');
            }}
            disabled={selectedMonth === 'all' && selectedYear === 'all' && !searchInput}
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

        {/* Summary Information Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* 1. JUMLAH ASET LANCAR */}
          <div className="flex flex-col justify-between rounded-lg border border-emerald-200/90 bg-linear-to-b from-emerald-50/50 to-white p-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800">
                  ASET LANCAR
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Sum all Aset Lancar</p>
            </div>
            <AmountSummary
              idrValue={jumlahAsetLancar}
              usdValue={jumlahAsetLancarUsd}
              className="mt-3 text-emerald-700 [&>p:first-child]:text-lg [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 2. JUMLAH ASET TETAP */}
          <div className="flex flex-col justify-between rounded-lg border border-teal-200/90 bg-linear-to-b from-teal-50/50 to-white p-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-teal-800">
                  ASET TETAP
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Sum all Aset Tetap</p>
            </div>
            <AmountSummary
              idrValue={jumlahAsetTetap}
              usdValue={jumlahAsetTetapUsd}
              className="mt-3 text-teal-700 [&>p:first-child]:text-lg [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 3. TOTAL AKTIVA */}
          <div className="flex flex-col justify-between rounded-lg border-2 border-emerald-500/80 bg-linear-to-b from-emerald-50 to-white p-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-900">
                  TOTAL AKTIVA
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Scale className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Aset Lancar + Aset Tetap</p>
            </div>
            <AmountSummary
              idrValue={totalAktiva}
              usdValue={totalAktivaUsd}
              className="mt-3 text-emerald-800 [&>p:first-child]:text-lg [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 4. JUMLAH KEWAJIBAN */}
          <div className="flex flex-col justify-between rounded-lg border border-rose-200/90 bg-linear-to-b from-rose-50/40 to-white p-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-rose-800">
                  KEWAJIBAN
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <TrendingDown className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Sum all Kewajiban</p>
            </div>
            <AmountSummary
              idrValue={jumlahKewajiban}
              usdValue={jumlahKewajibanUsd}
              className="mt-3 text-rose-700 [&>p:first-child]:text-lg [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 5. JUMLAH MODAL */}
          <div className="flex flex-col justify-between rounded-lg border border-blue-200 bg-linear-to-b from-blue-50/40 to-white p-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-blue-900">
                  MODAL
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Wallet className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Sum all Modal</p>
            </div>
            <AmountSummary
              idrValue={jumlahModal}
              usdValue={jumlahModalUsd}
              className="mt-3 text-blue-800 [&>p:first-child]:text-lg [&>p:first-child]:font-extrabold"
            />
          </div>

          {/* 6. TOTAL PASIVA */}
          <div className="flex flex-col justify-between rounded-lg border-2 border-blue-500/80 bg-linear-to-b from-blue-50 to-white p-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-blue-900">
                  TOTAL PASIVA
                </span>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Kewajiban + Modal</p>
            </div>
            <AmountSummary
              idrValue={totalPasiva}
              usdValue={totalPasivaUsd}
              className="mt-3 text-blue-900 [&>p:first-child]:text-lg [&>p:first-child]:font-extrabold"
            />
          </div>
        </div>

        {/* Status Keseimbangan Neraca (Balance Check Bar) */}
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border',
            isBalanced
              ? 'bg-emerald-50/80 border-emerald-200'
              : 'bg-rose-50/80 border-rose-200',
          )}
        >
          <div className="flex items-start gap-3">
            {isBalanced ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className={cn('text-sm font-bold', isBalanced ? 'text-emerald-900' : 'text-rose-900')}>
                Status Neraca: {isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG (UNBALANCED)'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Total Aktiva: <strong>{currenciesFormat('idr', totalAktiva)}</strong> | Total Pasiva: <strong>{currenciesFormat('idr', totalPasiva)}</strong>
              </p>
            </div>
          </div>

          {!isBalanced && (
            <div className="text-left sm:text-right">
              <span className="text-rose-700 font-extrabold text-sm block">
                Selisih: {currenciesFormat('idr', difference)}
              </span>
              {differenceUsd > 0 && (
                <span className="text-rose-600 font-semibold text-xs block">
                  Selisih USD: {currenciesFormat('usd', differenceUsd)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <Skeleton className="h-96 w-full rounded-md" />
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
        ) : reportQuery.isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Gagal memuat Laporan Neraca. Silakan muat ulang atau periksa koneksi.
          </div>
        ) : (
          /* Two Column Balance Sheet Layout: Aktiva vs Pasiva */
          <div className="grid gap-6 xl:grid-cols-2 items-start">
            {/* ========================================== */}
            {/* KOLOM KIRI: AKTIVA */}
            {/* ========================================== */}
            <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xs">
              {/* Header Kolom Aktiva */}
              <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-5 py-3.5">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
                    Aktiva
                  </h2>
                  <p className="text-xs text-slate-500">Aset Lancar dan Aset Tetap Perusahaan</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase text-slate-500">Total Aktiva</p>
                  <p className="text-base font-extrabold text-slate-900">{currenciesFormat('idr', totalAktiva)}</p>
                  <p className="text-xs font-semibold text-sky-700">{currenciesFormat('usd', totalAktivaUsd)}</p>
                </div>
              </div>

              {/* 1. ASET LANCAR */}
              <BalanceSheetSection
                title="Aset Lancar"
                subtotalLabel="Jumlah Aset Lancar"
                category={currentAssetCat}
                searchKeyword={searchKeyword}
                accountMap={accountMap}
              />

              {/* 2. ASET TETAP */}
              <BalanceSheetSection
                title="Aset Tetap"
                subtotalLabel="Jumlah Aset Tetap"
                category={fixedAssetCat}
                searchKeyword={searchKeyword}
                accountMap={accountMap}
              />

              {/* Footer Total Aktiva */}
              <div className="flex items-center justify-between border-t-2 border-slate-300 bg-emerald-50/60 px-5 py-3">
                <span className="text-sm font-extrabold uppercase tracking-wide text-emerald-900">
                  Total Aktiva
                </span>
                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-900">{currenciesFormat('idr', totalAktiva)}</p>
                  <p className="text-xs font-semibold text-sky-700">{currenciesFormat('usd', totalAktivaUsd)}</p>
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* KOLOM KANAN: PASIVA */}
            {/* ========================================== */}
            <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xs">
              {/* Header Kolom Pasiva */}
              <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-5 py-3.5">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
                    Pasiva
                  </h2>
                  <p className="text-xs text-slate-500">Kewajiban dan Modal Pemilik</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase text-slate-500">Total Pasiva</p>
                  <p className="text-base font-extrabold text-slate-900">{currenciesFormat('idr', totalPasiva)}</p>
                  <p className="text-xs font-semibold text-sky-700">{currenciesFormat('usd', totalPasivaUsd)}</p>
                </div>
              </div>

              {/* 1. KEWAJIBAN */}
              <BalanceSheetSection
                title="Kewajiban"
                subtotalLabel="Jumlah Kewajiban"
                category={liabilityCat}
                searchKeyword={searchKeyword}
                accountMap={accountMap}
              />

              {/* 2. MODAL */}
              <BalanceSheetSection
                title="Modal"
                subtotalLabel="Jumlah Modal"
                category={equityCat}
                searchKeyword={searchKeyword}
                accountMap={accountMap}
              />

              {/* Footer Total Pasiva */}
              <div className="flex items-center justify-between border-t-2 border-slate-300 bg-blue-50/60 px-5 py-3">
                <span className="text-sm font-extrabold uppercase tracking-wide text-blue-900">
                  Total Pasiva
                </span>
                <div className="text-right">
                  <p className="text-base font-extrabold text-blue-900">{currenciesFormat('idr', totalPasiva)}</p>
                  <p className="text-xs font-semibold text-sky-700">{currenciesFormat('usd', totalPasivaUsd)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Document & Modal */}
        <LaporanNeracaPrintDocument
          template={templatePrint.selectedTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          periodLabel={periodLabel}
          printedAt={templatePrint.printedAt}
          currentAssets={printCurrentAssets}
          fixedAssets={printFixedAssets}
          totalAssetsIdr={totalAktiva}
          totalAssetsUsd={totalAktivaUsd}
          liabilities={printLiabilities}
          equity={printEquity}
          totalPassivaIdr={totalPasiva}
          totalPassivaUsd={totalPasivaUsd}
        />

        <ReportTemplatePrintDialog
          open={templatePrint.isDialogOpen}
          onOpenChange={templatePrint.setIsDialogOpen}
          selectedTemplateId={templatePrint.selectedTemplateId}
          onTemplateChange={templatePrint.setSelectedTemplateId}
          onPrint={templatePrint.printWithSelectedTemplate}
          isPreparingPrint={templatePrint.isPreparingPrint}
          reportName="laporan neraca"
        />
      </div>
    </DashboardLayout>
  );
}
