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
import { ReportArchiveAction } from '@/components/features/report-archive/ReportArchiveAction';
import type { ReportArchiveColumn } from '@/lib/report-archive';
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
  const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD' || String((line as any).currency ?? '').toUpperCase() === 'USD';
  return isUsd ? 0 : toNumber(line.balance ?? line.amount ?? line.value ?? line.total);
};

const getLineUsdAmount = (line: BalanceAccountItem): number => {
  const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD' || String((line as any).currency ?? '').toUpperCase() === 'USD';
  return isUsd ? toNumber(line.balance ?? line.amount ?? line.value ?? line.total) : 0;
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

function StandardBalanceSection({
  title,
  subtotalLabel,
  accounts,
  subtotalIdr,
  subtotalUsd,
  searchKeyword,
  accountMap,
}: {
  title: string;
  subtotalLabel: string;
  accounts: BalanceAccountItem[];
  subtotalIdr: number;
  subtotalUsd: number;
  searchKeyword: string;
  accountMap?: Map<number, Account>;
}) {
  const filteredAccounts = useMemo(() => {
    if (!searchKeyword) return accounts;
    return accounts.filter((acc) => {
      const code = (acc.account_code ?? acc.code ?? '').toLowerCase();
      const name = (acc.account_name ?? acc.name ?? '').toLowerCase();
      return code.includes(searchKeyword) || name.includes(searchKeyword);
    });
  }, [accounts, searchKeyword]);

  return (
    <section className="border-t border-slate-200 px-4 py-3.5 first:border-t-0">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{accounts.length} akun terdaftar</p>
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
                {currenciesFormat('idr', subtotalIdr)}
              </TableCell>
              <TableCell className="text-right text-xs font-bold text-sky-700 tabular-nums py-2.5">
                {currenciesFormat('usd', subtotalUsd)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function FixedAssetsBalanceSection({
  title,
  subtotalLabel,
  accounts,
  contraAccounts,
  grossTotalIdr,
  grossTotalUsd,
  subtotalIdr,
  subtotalUsd,
  searchKeyword,
  accountMap,
}: {
  title: string;
  subtotalLabel: string;
  accounts: BalanceAccountItem[];
  contraAccounts: BalanceAccountItem[];
  grossTotalIdr?: number;
  grossTotalUsd?: number;
  subtotalIdr: number;
  subtotalUsd: number;
  searchKeyword: string;
  accountMap?: Map<number, Account>;
}) {
  const filteredAccounts = useMemo(() => {
    if (!searchKeyword) return accounts;
    return accounts.filter((acc) => {
      const code = (acc.account_code ?? acc.code ?? '').toLowerCase();
      const name = (acc.account_name ?? acc.name ?? '').toLowerCase();
      return code.includes(searchKeyword) || name.includes(searchKeyword);
    });
  }, [accounts, searchKeyword]);

  const filteredContra = useMemo(() => {
    if (!searchKeyword) return contraAccounts;
    return contraAccounts.filter((acc) => {
      const code = (acc.account_code ?? acc.code ?? '').toLowerCase();
      const name = (acc.account_name ?? acc.name ?? '').toLowerCase();
      return code.includes(searchKeyword) || name.includes(searchKeyword);
    });
  }, [contraAccounts, searchKeyword]);

  const totalCount = accounts.length + contraAccounts.length;

  return (
    <section className="border-t border-slate-200 px-4 py-3.5 first:border-t-0">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            {totalCount} akun terdaftar {contraAccounts.length > 0 ? `(${contraAccounts.length} akun kontra)` : ''}
          </p>
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
            {filteredAccounts.length === 0 && filteredContra.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-4 text-center text-xs text-slate-400 italic">
                  {searchKeyword ? 'Akun tidak cocok dengan pencarian.' : 'Belum ada akun aset tetap.'}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* 1. Akun Aset Tetap Perolehan */}
                {filteredAccounts.map((line, index) => {
                  const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD';
                  const idrAmt = getLineIdrAmount(line);
                  const usdAmt = getLineUsdAmount(line);

                  return (
                    <TableRow key={`fa-${line.id ?? line.account_id ?? index}`} className="hover:bg-slate-50">
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
                })}

                {/* Subtotal Gross jika ada akun kontra */}
                {contraAccounts.length > 0 && grossTotalIdr !== undefined && (
                  <TableRow className="bg-slate-50/40 text-xs font-medium text-slate-600 border-t border-slate-100 hover:bg-slate-50/60">
                    <TableCell className="py-1.5 italic pl-6">
                      Total Aset Tetap (Nilai Perolehan)
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700 tabular-nums py-1.5">
                      {currenciesFormat('idr', grossTotalIdr)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sky-700 tabular-nums py-1.5">
                      {grossTotalUsd ? currenciesFormat('usd', grossTotalUsd) : '-'}
                    </TableCell>
                  </TableRow>
                )}

                {/* 2. Akun Kontra (Akumulasi Penyusutan) */}
                {filteredContra.map((line, index) => {
                  const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD';
                  const idrAmt = getLineIdrAmount(line);
                  const usdAmt = getLineUsdAmount(line);

                  return (
                    <TableRow key={`contra-${line.id ?? line.account_id ?? index}`} className="bg-rose-50/30 hover:bg-rose-50/50">
                      <TableCell className="min-w-[180px] text-xs font-medium text-rose-700 py-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span title={getLineLabel(line, accountMap)} className="truncate">
                            {getLineLabel(line, accountMap)}
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                            Akun Kontra
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-rose-700 tabular-nums py-2">
                        {isUsd ? '-' : `(${currenciesFormat('idr', Math.abs(idrAmt))})`}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-rose-600 tabular-nums py-2">
                        {!isUsd && usdAmt === 0 ? '-' : `(${currenciesFormat('usd', Math.abs(usdAmt))})`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </>
            )}

            {/* Subtotal Nilai Buku Row */}
            <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200 hover:bg-slate-50">
              <TableCell className="text-xs font-bold uppercase text-slate-700 py-2.5">
                {subtotalLabel}
              </TableCell>
              <TableCell className="text-right text-xs font-bold text-slate-900 tabular-nums py-2.5">
                {currenciesFormat('idr', subtotalIdr)}
              </TableCell>
              <TableCell className="text-right text-xs font-bold text-sky-700 tabular-nums py-2.5">
                {currenciesFormat('usd', subtotalUsd)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function EquityBalanceSection({
  title,
  subtotalLabel,
  modalAwalAccounts,
  labaDitahan,
  labaPeriodeBerjalan,
  subtotalIdr,
  subtotalUsd,
  searchKeyword,
  accountMap,
  legacyAccounts,
}: {
  title: string;
  subtotalLabel: string;
  modalAwalAccounts: BalanceAccountItem[];
  labaDitahan?: { amount: number; amountUsd?: number; note?: string };
  labaPeriodeBerjalan?: { amount: number; amountUsd?: number; note?: string };
  subtotalIdr: number;
  subtotalUsd: number;
  searchKeyword: string;
  accountMap?: Map<number, Account>;
  legacyAccounts?: BalanceAccountItem[];
}) {
  const isStructuredEquity = modalAwalAccounts.length > 0 || labaDitahan !== undefined || labaPeriodeBerjalan !== undefined;

  const filteredModalAwal = useMemo(() => {
    if (!searchKeyword) return modalAwalAccounts;
    return modalAwalAccounts.filter((acc) => {
      const code = (acc.account_code ?? acc.code ?? '').toLowerCase();
      const name = (acc.account_name ?? acc.name ?? '').toLowerCase();
      return code.includes(searchKeyword) || name.includes(searchKeyword);
    });
  }, [modalAwalAccounts, searchKeyword]);

  const filteredLegacy = useMemo(() => {
    if (!searchKeyword || !legacyAccounts) return legacyAccounts ?? [];
    return legacyAccounts.filter((acc) => {
      const code = (acc.account_code ?? acc.code ?? '').toLowerCase();
      const name = (acc.account_name ?? acc.name ?? '').toLowerCase();
      return code.includes(searchKeyword) || name.includes(searchKeyword);
    });
  }, [legacyAccounts, searchKeyword]);

  return (
    <section className="border-t border-slate-200 px-4 py-3.5 first:border-t-0">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            {isStructuredEquity
              ? `${modalAwalAccounts.length} akun modal awal + laba ditahan & laba periode berjalan`
              : `${legacyAccounts?.length ?? 0} akun terdaftar`}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead className="text-xs font-semibold uppercase text-slate-600">Akun / Komponen</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase text-slate-600 w-36">IDR</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase text-slate-600 w-32">USD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isStructuredEquity ? (
              <>
                {/* 1. Modal Awal Accounts */}
                {filteredModalAwal.map((line, index) => {
                  const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD';
                  const idrAmt = getLineIdrAmount(line);
                  const usdAmt = getLineUsdAmount(line);

                  return (
                    <TableRow key={`ma-${line.id ?? line.account_id ?? index}`} className="hover:bg-slate-50">
                      <TableCell className="min-w-[180px] text-xs font-medium text-slate-700 py-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span title={getLineLabel(line, accountMap)} className="truncate">
                            {getLineLabel(line, accountMap)}
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            Modal Awal
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-900 tabular-nums py-2">
                        {isUsd ? '-' : currenciesFormat('idr', idrAmt)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-sky-700 tabular-nums py-2">
                        {!isUsd && usdAmt === 0 ? '-' : currenciesFormat('usd', usdAmt)}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* 2. Laba Ditahan */}
                {labaDitahan && (
                  <TableRow className="hover:bg-slate-50">
                    <TableCell className="min-w-[180px] text-xs font-medium text-slate-700 py-2">
                      <div>
                        <span className="font-semibold text-slate-800">Laba Ditahan</span>
                        {labaDitahan.note && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{labaDitahan.note}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-slate-900 tabular-nums py-2">
                      {currenciesFormat('idr', labaDitahan.amount)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-sky-700 tabular-nums py-2">
                      {labaDitahan.amountUsd ? currenciesFormat('usd', labaDitahan.amountUsd) : '-'}
                    </TableCell>
                  </TableRow>
                )}

                {/* 3. Laba Periode Berjalan */}
                {labaPeriodeBerjalan && (
                  <TableRow className="bg-indigo-50/30 hover:bg-indigo-50/50">
                    <TableCell className="min-w-[180px] text-xs font-medium text-indigo-900 py-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <div>
                          <span className="font-semibold text-indigo-950">Laba Periode Berjalan</span>
                          {labaPeriodeBerjalan.note && (
                            <p className="text-[10px] text-indigo-600 mt-0.5">{labaPeriodeBerjalan.note}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 ml-auto mr-2">
                          Dari Laba Rugi
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={cn(
                      'text-right text-xs font-bold tabular-nums py-2',
                      labaPeriodeBerjalan.amount >= 0 ? 'text-indigo-900' : 'text-rose-700',
                    )}>
                      {currenciesFormat('idr', labaPeriodeBerjalan.amount)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-sky-700 tabular-nums py-2">
                      {labaPeriodeBerjalan.amountUsd ? currenciesFormat('usd', labaPeriodeBerjalan.amountUsd) : '-'}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              /* Legacy Fallback */
              filteredLegacy.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="py-4 text-center text-xs text-slate-400 italic">
                    {searchKeyword ? 'Akun tidak cocok dengan pencarian.' : 'Belum ada akun pada grup modal.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLegacy.map((line, index) => {
                  const isUsd = String(line.type ?? 'IDR').toUpperCase() === 'USD';
                  const idrAmt = getLineIdrAmount(line);
                  const usdAmt = getLineUsdAmount(line);

                  return (
                    <TableRow key={`leg-eq-${line.id ?? line.account_id ?? index}`} className="hover:bg-slate-50">
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
              )
            )}

            {/* Subtotal Row */}
            <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200 hover:bg-slate-50">
              <TableCell className="text-xs font-bold uppercase text-slate-700 py-2.5">
                {subtotalLabel}
              </TableCell>
              <TableCell className="text-right text-xs font-bold text-slate-900 tabular-nums py-2.5">
                {currenciesFormat('idr', subtotalIdr)}
              </TableCell>
              <TableCell className="text-right text-xs font-bold text-sky-700 tabular-nums py-2.5">
                {currenciesFormat('usd', subtotalUsd)}
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
  const [transactionFilter, setTransactionFilter] = useState<'accounts' | 'account_with_transactions'>('accounts');
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
    const filters: BalanceReportFilters = {
      transaction_filter: transactionFilter,
    };
    if (selectedYear !== 'all' && selectedYear) {
      filters.year = Number(selectedYear);
    }
    if (selectedMonth !== 'all' && selectedMonth) {
      filters.month = selectedMonth;
    }
    return filters;
  }, [selectedMonth, selectedYear, transactionFilter]);

  const reportQuery = useBalanceReport(
    resolvedCompanyId,
    reportFilters,
    Boolean(resolvedCompanyId),
  );

  const reportData = reportQuery.data?.data;
  const searchKeyword = searchInput.trim().toLowerCase();

  // Normalize legacy categories as robust fallbacks
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

  // 1. Current Assets
  const currentAssetsAccounts = useMemo(() => {
    if (reportData?.sections?.current_assets?.accounts) {
      return reportData.sections.current_assets.accounts;
    }
    return currentAssetCat.accounts;
  }, [reportData?.sections?.current_assets?.accounts, currentAssetCat.accounts]);

  const jumlahAsetLancar = useMemo(() => {
    if (reportData?.subtotals?.jumlah_aset_lancar !== undefined && reportData?.subtotals?.jumlah_aset_lancar !== null) {
      return toNumber(reportData.subtotals.jumlah_aset_lancar);
    }
    if (reportData?.sections?.current_assets?.subtotal !== undefined && reportData?.sections?.current_assets?.subtotal !== null) {
      return toNumber(reportData.sections.current_assets.subtotal);
    }
    return currentAssetCat.totalIdr;
  }, [reportData?.subtotals?.jumlah_aset_lancar, reportData?.sections?.current_assets?.subtotal, currentAssetCat.totalIdr]);

  const jumlahAsetLancarUsd = useMemo(() => {
    if (reportData?.subtotals?.jumlah_aset_lancar_usd !== undefined && reportData?.subtotals?.jumlah_aset_lancar_usd !== null) {
      return toNumber(reportData.subtotals.jumlah_aset_lancar_usd);
    }
    return currentAssetCat.totalUsd;
  }, [reportData?.subtotals?.jumlah_aset_lancar_usd, currentAssetCat.totalUsd]);

  // 2. Fixed Assets
  const fixedAssetsAccounts = useMemo(() => {
    if (reportData?.sections?.fixed_assets?.accounts) {
      return reportData.sections.fixed_assets.accounts;
    }
    return fixedAssetCat.accounts;
  }, [reportData?.sections?.fixed_assets?.accounts, fixedAssetCat.accounts]);

  const accumulatedDepreciationAccounts = useMemo(() => {
    if (reportData?.sections?.fixed_assets?.accumulated_depreciation_accounts) {
      return reportData.sections.fixed_assets.accumulated_depreciation_accounts;
    }
    return [];
  }, [reportData?.sections?.fixed_assets?.accumulated_depreciation_accounts]);

  const fixedAssetsGrossTotalIdr = useMemo(() => {
    if (reportData?.sections?.fixed_assets?.gross_total !== undefined && reportData?.sections?.fixed_assets?.gross_total !== null) {
      return toNumber(reportData.sections.fixed_assets.gross_total);
    }
    return undefined;
  }, [reportData?.sections?.fixed_assets?.gross_total]);

  const fixedAssetsGrossTotalUsd = useMemo(() => {
    if (reportData?.sections?.fixed_assets?.gross_total_usd !== undefined && reportData?.sections?.fixed_assets?.gross_total_usd !== null) {
      return toNumber(reportData.sections.fixed_assets.gross_total_usd);
    }
    return undefined;
  }, [reportData?.sections?.fixed_assets?.gross_total_usd]);

  const jumlahAsetTetap = useMemo(() => {
    if (reportData?.subtotals?.jumlah_aset_tetap !== undefined && reportData?.subtotals?.jumlah_aset_tetap !== null) {
      return toNumber(reportData.subtotals.jumlah_aset_tetap);
    }
    if (reportData?.sections?.fixed_assets?.subtotal !== undefined && reportData?.sections?.fixed_assets?.subtotal !== null) {
      return toNumber(reportData.sections.fixed_assets.subtotal);
    }
    return fixedAssetCat.totalIdr;
  }, [reportData?.subtotals?.jumlah_aset_tetap, reportData?.sections?.fixed_assets?.subtotal, fixedAssetCat.totalIdr]);

  const jumlahAsetTetapUsd = useMemo(() => {
    if (reportData?.subtotals?.jumlah_aset_tetap_usd !== undefined && reportData?.subtotals?.jumlah_aset_tetap_usd !== null) {
      return toNumber(reportData.subtotals.jumlah_aset_tetap_usd);
    }
    return fixedAssetCat.totalUsd;
  }, [reportData?.subtotals?.jumlah_aset_tetap_usd, fixedAssetCat.totalUsd]);

  // 3. Total Aktiva
  const totalAktiva = useMemo(() => {
    if (reportData?.subtotals?.total_aktiva !== undefined && reportData?.subtotals?.total_aktiva !== null) {
      return toNumber(reportData.subtotals.total_aktiva);
    }
    if (reportData?.total_assets !== undefined && reportData?.total_assets !== null) {
      return toNumber(reportData.total_assets);
    }
    return jumlahAsetLancar + jumlahAsetTetap;
  }, [reportData?.subtotals?.total_aktiva, reportData?.total_assets, jumlahAsetLancar, jumlahAsetTetap]);

  const totalAktivaUsd = useMemo(() => {
    if (reportData?.subtotals?.total_aktiva_usd !== undefined && reportData?.subtotals?.total_aktiva_usd !== null) {
      return toNumber(reportData.subtotals.total_aktiva_usd);
    }
    if (reportData?.total_assets_usd !== undefined && reportData?.total_assets_usd !== null) {
      return toNumber(reportData.total_assets_usd);
    }
    return jumlahAsetLancarUsd + jumlahAsetTetapUsd;
  }, [reportData?.subtotals?.total_aktiva_usd, reportData?.total_assets_usd, jumlahAsetLancarUsd, jumlahAsetTetapUsd]);

  // 4. Liabilities
  const liabilitiesAccounts = useMemo(() => {
    if (reportData?.sections?.liabilities?.accounts) {
      return reportData.sections.liabilities.accounts;
    }
    return liabilityCat.accounts;
  }, [reportData?.sections?.liabilities?.accounts, liabilityCat.accounts]);

  const jumlahKewajiban = useMemo(() => {
    if (reportData?.subtotals?.jumlah_kewajiban !== undefined && reportData?.subtotals?.jumlah_kewajiban !== null) {
      return toNumber(reportData.subtotals.jumlah_kewajiban);
    }
    if (reportData?.sections?.liabilities?.subtotal !== undefined && reportData?.sections?.liabilities?.subtotal !== null) {
      return toNumber(reportData.sections.liabilities.subtotal);
    }
    return liabilityCat.totalIdr;
  }, [reportData?.subtotals?.jumlah_kewajiban, reportData?.sections?.liabilities?.subtotal, liabilityCat.totalIdr]);

  const jumlahKewajibanUsd = useMemo(() => {
    if (reportData?.subtotals?.jumlah_kewajiban_usd !== undefined && reportData?.subtotals?.jumlah_kewajiban_usd !== null) {
      return toNumber(reportData.subtotals.jumlah_kewajiban_usd);
    }
    return liabilityCat.totalUsd;
  }, [reportData?.subtotals?.jumlah_kewajiban_usd, liabilityCat.totalUsd]);

  // 5. Equity
  const equityModalAwalAccounts = useMemo(() => {
    if (reportData?.sections?.equity?.modal_awal?.accounts) {
      return reportData.sections.equity.modal_awal.accounts;
    }
    return [];
  }, [reportData?.sections?.equity?.modal_awal?.accounts]);

  const equityLabaDitahan = useMemo(() => {
    if (reportData?.sections?.equity?.laba_ditahan) {
      return {
        amount: toNumber(reportData.sections.equity.laba_ditahan.amount),
        amountUsd: reportData.sections.equity.laba_ditahan.amount_usd !== undefined ? toNumber(reportData.sections.equity.laba_ditahan.amount_usd) : undefined,
        note: reportData.sections.equity.laba_ditahan.note || 'Akumulasi hasil tutup buku periode-periode sebelumnya',
      };
    }
    return undefined;
  }, [reportData?.sections?.equity?.laba_ditahan]);

  const equityLabaPeriodeBerjalan = useMemo(() => {
    if (reportData?.sections?.equity?.laba_periode_berjalan) {
      return {
        amount: toNumber(reportData.sections.equity.laba_periode_berjalan.amount),
        amountUsd: reportData.sections.equity.laba_periode_berjalan.amount_usd !== undefined ? toNumber(reportData.sections.equity.laba_periode_berjalan.amount_usd) : undefined,
        note: reportData.sections.equity.laba_periode_berjalan.note || 'Hasil perhitungan Laporan Laba Rugi periode berjalan',
      };
    }
    return undefined;
  }, [reportData?.sections?.equity?.laba_periode_berjalan]);

  const jumlahModal = useMemo(() => {
    if (reportData?.subtotals?.jumlah_modal !== undefined && reportData?.subtotals?.jumlah_modal !== null) {
      return toNumber(reportData.subtotals.jumlah_modal);
    }
    if (reportData?.sections?.equity?.subtotal !== undefined && reportData?.sections?.equity?.subtotal !== null) {
      return toNumber(reportData.sections.equity.subtotal);
    }
    return equityCat.totalIdr;
  }, [reportData?.subtotals?.jumlah_modal, reportData?.sections?.equity?.subtotal, equityCat.totalIdr]);

  const jumlahModalUsd = useMemo(() => {
    if (reportData?.subtotals?.jumlah_modal_usd !== undefined && reportData?.subtotals?.jumlah_modal_usd !== null) {
      return toNumber(reportData.subtotals.jumlah_modal_usd);
    }
    return equityCat.totalUsd;
  }, [reportData?.subtotals?.jumlah_modal_usd, equityCat.totalUsd]);

  // 6. Total Pasiva
  const totalPasiva = useMemo(() => {
    if (reportData?.subtotals?.total_pasiva !== undefined && reportData?.subtotals?.total_pasiva !== null) {
      return toNumber(reportData.subtotals.total_pasiva);
    }
    if (reportData?.total_passiva !== undefined && reportData?.total_passiva !== null) {
      return toNumber(reportData.total_passiva);
    }
    return jumlahKewajiban + jumlahModal;
  }, [reportData?.subtotals?.total_pasiva, reportData?.total_passiva, jumlahKewajiban, jumlahModal]);

  const totalPasivaUsd = useMemo(() => {
    if (reportData?.subtotals?.total_pasiva_usd !== undefined && reportData?.subtotals?.total_pasiva_usd !== null) {
      return toNumber(reportData.subtotals.total_pasiva_usd);
    }
    if (reportData?.total_passiva_usd !== undefined && reportData?.total_passiva_usd !== null) {
      return toNumber(reportData.total_passiva_usd);
    }
    return jumlahKewajibanUsd + jumlahModalUsd;
  }, [reportData?.subtotals?.total_pasiva_usd, reportData?.total_passiva_usd, jumlahKewajibanUsd, jumlahModalUsd]);

  // 7. Balance Check
  const isBalanced = useMemo(() => {
    if (reportData?.subtotals?.is_balance !== undefined && reportData?.subtotals?.is_balance !== null) {
      return Boolean(reportData.subtotals.is_balance);
    }
    return totalAktiva === totalPasiva;
  }, [reportData?.subtotals?.is_balance, totalAktiva, totalPasiva]);

  const statusBalanceText = useMemo(() => {
    if (reportData?.subtotals?.status_balance) {
      return String(reportData.subtotals.status_balance).toUpperCase();
    }
    return isBalanced ? 'BALANCE' : 'TIDAK BALANCE';
  }, [reportData?.subtotals?.status_balance, isBalanced]);

  const difference = useMemo(() => {
    if (reportData?.subtotals?.difference !== undefined && reportData?.subtotals?.difference !== null) {
      return Math.abs(toNumber(reportData.subtotals.difference));
    }
    return Math.abs(totalAktiva - totalPasiva);
  }, [reportData?.subtotals?.difference, totalAktiva, totalPasiva]);

  const differenceUsd = useMemo(() => {
    if (reportData?.subtotals?.difference_usd !== undefined && reportData?.subtotals?.difference_usd !== null) {
      return Math.abs(toNumber(reportData.subtotals.difference_usd));
    }
    return Math.abs(totalAktivaUsd - totalPasivaUsd);
  }, [reportData?.subtotals?.difference_usd, totalAktivaUsd, totalPasivaUsd]);

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
    accounts: currentAssetsAccounts,
    totalIdr: jumlahAsetLancar,
    totalUsd: jumlahAsetLancarUsd,
  }), [currentAssetsAccounts, jumlahAsetLancar, jumlahAsetLancarUsd]);

  const printFixedAssets: BalancePrintCategory = useMemo(() => ({
    title: 'Aset Tetap',
    subtotalLabel: 'Jumlah Aset Tetap (Nilai Buku)',
    accounts: [
      ...fixedAssetsAccounts,
      ...accumulatedDepreciationAccounts.map((a) => ({ ...a, is_contra: true })),
    ],
    totalIdr: jumlahAsetTetap,
    totalUsd: jumlahAsetTetapUsd,
  }), [fixedAssetsAccounts, accumulatedDepreciationAccounts, jumlahAsetTetap, jumlahAsetTetapUsd]);

  const printLiabilities: BalancePrintCategory = useMemo(() => ({
    title: 'Kewajiban',
    subtotalLabel: 'Jumlah Kewajiban',
    accounts: liabilitiesAccounts,
    totalIdr: jumlahKewajiban,
    totalUsd: jumlahKewajibanUsd,
  }), [liabilitiesAccounts, jumlahKewajiban, jumlahKewajibanUsd]);

  const printEquity: BalancePrintCategory = useMemo(() => {
    if (equityModalAwalAccounts.length > 0 || equityLabaDitahan || equityLabaPeriodeBerjalan) {
      const items: BalanceAccountItem[] = [
        ...equityModalAwalAccounts.map((acc) => ({
          ...acc,
          account_name: `${acc.account_name ?? acc.name ?? 'Modal'} (Modal Awal)`,
          name: `${acc.name ?? acc.account_name ?? 'Modal'} (Modal Awal)`,
        })),
      ];
      if (equityLabaDitahan) {
        items.push({
          id: 'laba_ditahan',
          code: '-',
          name: 'Laba Ditahan',
          account_name: 'Laba Ditahan',
          amount: equityLabaDitahan.amount,
          balance: equityLabaDitahan.amount,
          type: 'IDR',
        });
      }
      if (equityLabaPeriodeBerjalan) {
        items.push({
          id: 'laba_periode_berjalan',
          code: '-',
          name: 'Laba Periode Berjalan (dari Laba Rugi)',
          account_name: 'Laba Periode Berjalan (dari Laba Rugi)',
          amount: equityLabaPeriodeBerjalan.amount,
          balance: equityLabaPeriodeBerjalan.amount,
          type: 'IDR',
        });
      }
      return {
        title: 'Modal',
        subtotalLabel: 'Jumlah Modal',
        accounts: items,
        totalIdr: jumlahModal,
        totalUsd: jumlahModalUsd,
      };
    }
    return {
      title: 'Modal',
      subtotalLabel: 'Jumlah Modal',
      accounts: equityCat.accounts,
      totalIdr: jumlahModal,
      totalUsd: jumlahModalUsd,
    };
  }, [equityModalAwalAccounts, equityLabaDitahan, equityLabaPeriodeBerjalan, equityCat.accounts, jumlahModal, jumlahModalUsd]);

  const archiveColumns: ReportArchiveColumn[] = [
    { key: 'kategori', label: 'Kategori', width: 22 },
    { key: 'akun', label: 'Akun / Komponen', width: 34 },
    { key: 'idr', label: 'IDR', align: 'right', width: 24 },
    { key: 'usd', label: 'USD', align: 'right', width: 18 },
  ];

  const archiveRows = useMemo(() => {
    const rows: Array<{ kategori: string; akun: string; idr: string; usd: string }> = [];

    // 1. Aset Lancar
    currentAssetsAccounts.forEach((line) => {
      rows.push({
        kategori: 'Aset Lancar',
        akun: getLineLabel(line, accountMap),
        idr: currenciesFormat('idr', getLineIdrAmount(line)),
        usd: currenciesFormat('usd', getLineUsdAmount(line)),
      });
    });
    rows.push({
      kategori: 'Aset Lancar',
      akun: 'Jumlah Aset Lancar',
      idr: currenciesFormat('idr', jumlahAsetLancar),
      usd: currenciesFormat('usd', jumlahAsetLancarUsd),
    });

    // 2. Aset Tetap
    fixedAssetsAccounts.forEach((line) => {
      rows.push({
        kategori: 'Aset Tetap',
        akun: getLineLabel(line, accountMap),
        idr: currenciesFormat('idr', getLineIdrAmount(line)),
        usd: currenciesFormat('usd', getLineUsdAmount(line)),
      });
    });
    accumulatedDepreciationAccounts.forEach((line) => {
      const amt = getLineIdrAmount(line);
      const amtUsd = getLineUsdAmount(line);
      rows.push({
        kategori: 'Aset Tetap',
        akun: `${getLineLabel(line, accountMap)} (Akun Kontra)`,
        idr: `(${currenciesFormat('idr', Math.abs(amt))})`,
        usd: amtUsd > 0 ? `(${currenciesFormat('usd', Math.abs(amtUsd))})` : '-',
      });
    });
    rows.push({
      kategori: 'Aset Tetap',
      akun: 'Jumlah Aset Tetap (Nilai Buku)',
      idr: currenciesFormat('idr', jumlahAsetTetap),
      usd: currenciesFormat('usd', jumlahAsetTetapUsd),
    });

    // 3. Kewajiban
    liabilitiesAccounts.forEach((line) => {
      rows.push({
        kategori: 'Kewajiban',
        akun: getLineLabel(line, accountMap),
        idr: currenciesFormat('idr', getLineIdrAmount(line)),
        usd: currenciesFormat('usd', getLineUsdAmount(line)),
      });
    });
    rows.push({
      kategori: 'Kewajiban',
      akun: 'Jumlah Kewajiban',
      idr: currenciesFormat('idr', jumlahKewajiban),
      usd: currenciesFormat('usd', jumlahKewajibanUsd),
    });

    // 4. Modal
    if (equityModalAwalAccounts.length > 0 || equityLabaDitahan || equityLabaPeriodeBerjalan) {
      equityModalAwalAccounts.forEach((line) => {
        rows.push({
          kategori: 'Modal',
          akun: `${getLineLabel(line, accountMap)} (Modal Awal)`,
          idr: currenciesFormat('idr', getLineIdrAmount(line)),
          usd: currenciesFormat('usd', getLineUsdAmount(line)),
        });
      });
      if (equityLabaDitahan) {
        rows.push({
          kategori: 'Modal',
          akun: 'Laba Ditahan (Akumulasi Tutup Buku)',
          idr: currenciesFormat('idr', equityLabaDitahan.amount),
          usd: equityLabaDitahan.amountUsd ? currenciesFormat('usd', equityLabaDitahan.amountUsd) : '-',
        });
      }
      if (equityLabaPeriodeBerjalan) {
        rows.push({
          kategori: 'Modal',
          akun: 'Laba Periode Berjalan (dari Laba Rugi)',
          idr: currenciesFormat('idr', equityLabaPeriodeBerjalan.amount),
          usd: equityLabaPeriodeBerjalan.amountUsd ? currenciesFormat('usd', equityLabaPeriodeBerjalan.amountUsd) : '-',
        });
      }
    } else {
      equityCat.accounts.forEach((line) => {
        rows.push({
          kategori: 'Modal',
          akun: getLineLabel(line, accountMap),
          idr: currenciesFormat('idr', getLineIdrAmount(line)),
          usd: currenciesFormat('usd', getLineUsdAmount(line)),
        });
      });
    }
    rows.push({
      kategori: 'Modal',
      akun: 'Jumlah Modal',
      idr: currenciesFormat('idr', jumlahModal),
      usd: currenciesFormat('usd', jumlahModalUsd),
    });

    // Ringkasan Neraca
    rows.push(
      {
        kategori: 'Ringkasan',
        akun: 'Total Aktiva',
        idr: currenciesFormat('idr', totalAktiva),
        usd: currenciesFormat('usd', totalAktivaUsd),
      },
      {
        kategori: 'Ringkasan',
        akun: 'Total Pasiva',
        idr: currenciesFormat('idr', totalPasiva),
        usd: currenciesFormat('usd', totalPasivaUsd),
      },
      {
        kategori: 'Ringkasan',
        akun: `Status Neraca (${statusBalanceText})`,
        idr: isBalanced ? 'SEIMBANG' : `Selisih: ${currenciesFormat('idr', difference)}`,
        usd: isBalanced ? '-' : (differenceUsd > 0 ? `Selisih: ${currenciesFormat('usd', differenceUsd)}` : '-'),
      },
    );

    return rows;
  }, [
    currentAssetsAccounts,
    fixedAssetsAccounts,
    accumulatedDepreciationAccounts,
    liabilitiesAccounts,
    equityModalAwalAccounts,
    equityLabaDitahan,
    equityLabaPeriodeBerjalan,
    equityCat.accounts,
    jumlahAsetLancar,
    jumlahAsetLancarUsd,
    jumlahAsetTetap,
    jumlahAsetTetapUsd,
    jumlahKewajiban,
    jumlahKewajibanUsd,
    jumlahModal,
    jumlahModalUsd,
    totalAktiva,
    totalAktivaUsd,
    totalPasiva,
    totalPasivaUsd,
    isBalanced,
    statusBalanceText,
    difference,
    differenceUsd,
    accountMap,
  ]);

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
              <ReportArchiveAction
                reportTitle="Laporan Neraca"
                archiveSourceLabel="Neraca"
                periodLabel={periodLabel}
                data={archiveRows}
                columns={archiveColumns}
                disabled={isLoading}
              />
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

        {/* Filter Bar (Bulan, Tahun, Filter Transaksi, Search, Reset) */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="w-full sm:w-[180px]">
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

          <div className="w-full sm:w-[160px]">
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

          <div className="w-full sm:w-[210px]">
            <Select value={transactionFilter} onValueChange={(val) => setTransactionFilter(val as any)}>
              <SelectTrigger className="h-9 w-full bg-white">
                <SelectValue placeholder="Filter Transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accounts">Semua Akun (Default)</SelectItem>
                <SelectItem value="account_with_transactions">Hanya Akun Bertransaksi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SearchInput
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            placeholder="Cari akun pada laporan..."
            aria-label="Cari akun pada Laporan Neraca"
            wrapperClassName="w-full sm:w-[240px]"
          />

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full sm:w-auto"
            onClick={() => {
              setSelectedMonth('all');
              setSelectedYear('all');
              setTransactionFilter('accounts');
              setSearchInput('');
            }}
            disabled={selectedMonth === 'all' && selectedYear === 'all' && transactionFilter === 'accounts' && !searchInput}
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
              <p className="text-[11px] text-slate-500">Nilai buku aset tetap</p>
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
              <p className="text-[11px] text-slate-500">Modal + Laba Ditahan + Laba Berjalan</p>
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
            'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border',
            isBalanced
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800',
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider',
                isBalanced ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white',
              )}
            >
              {statusBalanceText}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {isBalanced
                  ? 'Total Aktiva seimbang sempurna dengan Total Pasiva.'
                  : `Terdapat selisih balance sebesar ${currenciesFormat('idr', difference)}.`}
              </p>
              {differenceUsd > 0 && !isBalanced && (
                <p className="text-xs text-rose-600 font-medium">
                  Selisih USD: {currenciesFormat('usd', differenceUsd)}
                </p>
              )}
            </div>
          </div>

          <div className="text-sm font-mono font-semibold">
            Aktiva: {currenciesFormat('idr', totalAktiva)} | Pasiva: {currenciesFormat('idr', totalPasiva)}
          </div>
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
              <StandardBalanceSection
                title="1. Aset Lancar"
                subtotalLabel="Jumlah Aset Lancar"
                accounts={currentAssetsAccounts}
                subtotalIdr={jumlahAsetLancar}
                subtotalUsd={jumlahAsetLancarUsd}
                searchKeyword={searchKeyword}
                accountMap={accountMap}
              />

              {/* 2. ASET TETAP */}
              <FixedAssetsBalanceSection
                title="2. Aset Tetap"
                subtotalLabel="Jumlah Aset Tetap (Nilai Buku)"
                accounts={fixedAssetsAccounts}
                contraAccounts={accumulatedDepreciationAccounts}
                grossTotalIdr={fixedAssetsGrossTotalIdr}
                grossTotalUsd={fixedAssetsGrossTotalUsd}
                subtotalIdr={jumlahAsetTetap}
                subtotalUsd={jumlahAsetTetapUsd}
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

              {/* 3. KEWAJIBAN */}
              <StandardBalanceSection
                title="3. Kewajiban"
                subtotalLabel="Jumlah Kewajiban"
                accounts={liabilitiesAccounts}
                subtotalIdr={jumlahKewajiban}
                subtotalUsd={jumlahKewajibanUsd}
                searchKeyword={searchKeyword}
                accountMap={accountMap}
              />

              {/* 4. MODAL */}
              <EquityBalanceSection
                title="4. Modal"
                subtotalLabel="Jumlah Modal"
                modalAwalAccounts={equityModalAwalAccounts}
                labaDitahan={equityLabaDitahan}
                labaPeriodeBerjalan={equityLabaPeriodeBerjalan}
                subtotalIdr={jumlahModal}
                subtotalUsd={jumlahModalUsd}
                searchKeyword={searchKeyword}
                accountMap={accountMap}
                legacyAccounts={equityCat.accounts}
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
