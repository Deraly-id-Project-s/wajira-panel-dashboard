import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { Plus, Printer, RefreshCw, RotateCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import type { Account } from '@/@types/account.types';
import type {
  BalanceReportAccountLine,
  BalanceReportCash,
  BalanceReportTemplateKey,
  BalanceReportTemplatePayload,
} from '@/@types/balance-report.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  LaporanNeracaPrintDocument,
  type BalancePrintSection,
} from '@/components/features/laporan-neraca/LaporanNeracaPrintDocument';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { MoneyInput } from '@/components/ui/money-input';
import { SearchInput } from '@/components/ui/search-input';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { useCompany } from '@/contexts/CompanyContext';
import { useAccounts } from '@/hooks/useAccount';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import {
  useBalanceReport,
  useBalanceReportCashOptions,
  useCreateBalanceReportCash,
  useUpdateBalanceReportCash,
  useUpdateBalanceReportTemplate,
} from '@/hooks/report/useBalanceReport';
import { getLetterheadByCompanyId, resolveCompanyId } from '@/lib/print-letterhead';
import { cn } from '@/lib/utils';

type BalanceSide = 'assets' | 'liabilities';

interface BalanceSectionConfig {
  key: string;
  title: string;
  templateKey: BalanceReportTemplateKey;
  calcKey: string;
  side: BalanceSide;
  expectedType?: 'debet' | 'credit';
}

interface NormalizedSection {
  rows: BalanceReportAccountLine[];
  totalIdr: number;
  totalUsd: number;
}

interface CashFormState {
  id?: number;
  cash_id: number | null;
  value: number;
}

const EMPTY_VALUE = '__empty__';

const getCompanyName = (companyId?: number | null) => {
  if (companyId === 1) return 'PT WAJIRA JAGRATARA MORINDO';
  if (companyId === 2) return 'PT WAJIRA INTERNASIONAL';
  if (companyId === 3) return 'PT WAJIRA YANOTAMA';
  if (companyId === 4) return 'PT WAJIRA TRANSINDO';
  if (companyId === 5) return 'PT ADHIYASA GRADASTA';
  return 'PT WAJIRA';
};

const ASSET_TEMPLATE_KEYS: BalanceReportTemplateKey[] = [
  'receivable_ids',
  'down_payment_ids',
  'fixed_asset_ids',
];

const LIABILITY_TEMPLATE_KEYS: BalanceReportTemplateKey[] = [
  'accounts_payable_ids',
  'tax_payable_ids',
  'miscellaneous_debts_ids',
  'equity_ids',
];

const REPORT_SECTIONS: BalanceSectionConfig[] = [
  {
    key: 'receivable',
    title: 'Piutang',
    templateKey: 'receivable_ids',
    calcKey: 'receivable_calc',
    side: 'assets',
    expectedType: 'debet',
  },
  {
    key: 'down_payment',
    title: 'Uang Muka',
    templateKey: 'down_payment_ids',
    calcKey: 'down_payment_calc',
    side: 'assets',
    expectedType: 'debet',
  },
  {
    key: 'fixed_asset',
    title: 'Aktiva Tetap',
    templateKey: 'fixed_asset_ids',
    calcKey: 'fixed_asset_calc',
    side: 'assets',
    expectedType: 'debet',
  },
  {
    key: 'accounts_payable',
    title: 'Hutang Usaha',
    templateKey: 'accounts_payable_ids',
    calcKey: 'accounts_payable_calc',
    side: 'liabilities',
    expectedType: 'credit',
  },
  {
    key: 'tax_payable',
    title: 'Hutang Pajak',
    templateKey: 'tax_payable_ids',
    calcKey: 'tax_payable_calc',
    side: 'liabilities',
    expectedType: 'credit',
  },
  {
    key: 'miscellaneous_debts',
    title: 'Hutang Lain-Lain',
    templateKey: 'miscellaneous_debts_ids',
    calcKey: 'miscellaneous_debts_calc',
    side: 'liabilities',
    expectedType: 'credit',
  },
  {
    key: 'equity',
    title: 'Ekuitas',
    templateKey: 'equity_ids',
    calcKey: 'equity_calc',
    side: 'liabilities',
    expectedType: 'credit',
  },
];

const buildEmptyTemplateState = (): Record<BalanceReportTemplateKey, number[]> => ({
  receivable_ids: [],
  down_payment_ids: [],
  fixed_asset_ids: [],
  accounts_payable_ids: [],
  tax_payable_ids: [],
  miscellaneous_debts_ids: [],
  equity_ids: [],
});

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(normalized) ? normalized : 0;
  }
  return 0;
};

const uniqueNumbers = (values: Array<number | string | null | undefined>) =>
  values
    .map((value) => Number(value))
    .filter((value, index, array) => Number.isFinite(value) && value > 0 && array.indexOf(value) === index);

const getLineAmount = (line: BalanceReportAccountLine) =>
  toNumber(line.amount ?? line.total ?? line.value);

const getLineCurrency = (line: BalanceReportAccountLine): 'idr' | 'usd' =>
  String(line.type ?? 'IDR').toUpperCase() === 'USD' ? 'usd' : 'idr';

const getLineAmountByCurrency = (
  line: BalanceReportAccountLine,
  currency: 'idr' | 'usd',
) => getLineCurrency(line) === currency ? getLineAmount(line) : 0;

const getLineLabel = (line: BalanceReportAccountLine) => {
  const code = line.account_code ?? line.code;
  const name = line.account_name ?? line.name ?? 'Akun';
  return code ? `${code} - ${name}` : name;
};

const normalizeSection = (value: unknown): NormalizedSection => {
  if (Array.isArray(value)) {
    const rows = value as BalanceReportAccountLine[];
    return {
      rows,
      totalIdr: rows.reduce((sum, row) => sum + getLineAmountByCurrency(row, 'idr'), 0),
      totalUsd: rows.reduce((sum, row) => sum + getLineAmountByCurrency(row, 'usd'), 0),
    };
  }

  if (value && typeof value === 'object') {
    const section = value as {
      total?: unknown;
      total_idr?: unknown;
      total_usd?: unknown;
      accounts?: BalanceReportAccountLine[];
    };
    const rows = Array.isArray(section.accounts) ? section.accounts : [];
    const calculatedIdr = rows.reduce((sum, row) => sum + getLineAmountByCurrency(row, 'idr'), 0);
    const calculatedUsd = rows.reduce((sum, row) => sum + getLineAmountByCurrency(row, 'usd'), 0);

    return {
      rows,
      totalIdr: section.total_idr !== undefined && section.total_idr !== null
        ? toNumber(section.total_idr)
        : rows.length > 0
          ? calculatedIdr
          : toNumber(section.total),
      totalUsd: section.total_usd !== undefined && section.total_usd !== null
        ? toNumber(section.total_usd)
        : calculatedUsd,
    };
  }

  return { rows: [], totalIdr: 0, totalUsd: 0 };
};

function AccountSelect({
  value,
  accounts,
  expectedType,
  onChange,
}: {
  value: number | null;
  accounts: Account[];
  expectedType?: 'debet' | 'credit';
  onChange: (value: number | null) => void;
}) {
  const filteredAccounts = useMemo(() => {
    if (!expectedType) return accounts;
    return accounts.filter((account) => {
      if (value && Number(account.id) === Number(value)) return true;
      if (!account.type) return true;
      const normalizedType = account.type === 'debit' ? 'debet' : account.type;
      return normalizedType === expectedType;
    });
  }, [accounts, expectedType, value]);

  const placeholderText = expectedType
    ? `Pilih akun (${expectedType === 'debet' ? 'Debet' : 'Kredit'})`
    : 'Pilih akun';

  const searchPlaceholderText = expectedType
    ? `Cari akun ${expectedType === 'debet' ? 'debet' : 'kredit'}...`
    : 'Cari akun...';

  return (
    <Select
      value={value ? String(value) : EMPTY_VALUE}
      onValueChange={(nextValue) => onChange(nextValue === EMPTY_VALUE ? null : Number(nextValue))}
    >
      <SelectTrigger className="h-9 bg-white">
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>
      <SelectContent showSearch searchPlaceholder={searchPlaceholderText} className="max-h-80">
        <SelectItem value={EMPTY_VALUE}>{placeholderText}</SelectItem>
        {filteredAccounts.map((account) => (
          <SelectItem key={account.id} value={String(account.id)}>
            {account.code} - {account.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TemplateAccountEditor({
  config,
  accountIds,
  accounts,
  section,
  searchKeyword,
  onChange,
}: {
  config: BalanceSectionConfig;
  accountIds: number[];
  accounts: Account[];
  section: NormalizedSection;
  searchKeyword: string;
  onChange: (nextIds: number[]) => void;
}) {
  const filteredRows = searchKeyword
    ? section.rows.filter((line) => getLineLabel(line).toLowerCase().includes(searchKeyword))
    : section.rows;

  return (
    <section className="border-t border-slate-200 px-4 py-4 first:border-t-0">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{config.title}</h3>
          <p className="mt-1 text-xs text-slate-500">{uniqueNumbers(accountIds).length} akun template</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{currenciesFormat('idr', section.totalIdr)}</p>
          <p className="mt-1 text-sm font-semibold text-sky-700">{currenciesFormat('usd', section.totalUsd)}</p>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(220px,320px)_1fr]">
        <div className="space-y-2">
          {accountIds.map((accountId, index) => (
            <div key={`${config.templateKey}-${index}`} className="grid grid-cols-[1fr_auto] gap-2">
              <AccountSelect
                value={accountId || null}
                accounts={accounts}
                expectedType={config.expectedType}
                onChange={(nextValue) => {
                  const nextIds = [...accountIds];
                  if (nextValue) {
                    nextIds[index] = nextValue;
                  } else {
                    nextIds.splice(index, 1);
                  }
                  onChange(nextIds);
                }}
              />
              <Button
                type="button"
                size="icon"
                aria-label="Hapus akun"
                onClick={() => onChange(accountIds.filter((_, itemIndex) => itemIndex !== index))}
                className="btn-outline! px-2"
                disabled={accountIds.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={() => onChange([...accountIds, 0])}
          >
            <Plus className="h-4 w-4" />
            Tambah Akun
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Akun</TableHead>
              <TableHead className="text-right">IDR</TableHead>
              <TableHead className="text-right">USD</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-5 text-center text-sm text-slate-500">
                  Belum ada rincian.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((line, index) => (
                <TableRow key={`${line.id ?? line.account_id ?? index}`} className="hover:bg-slate-50">
                  <TableCell className="min-w-[180px] max-w-[260px] truncate text-slate-700">
                    {getLineLabel(line)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    {currenciesFormat('idr', getLineAmountByCurrency(line, 'idr'))}
                  </TableCell>
                  <TableCell className="text-right font-medium text-sky-700">
                    {currenciesFormat('usd', getLineAmountByCurrency(line, 'usd'))}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function CashManagement({
  cashForms,
  cashOptions,
  usedCashIds,
  createPending,
  updatePending,
  onChange,
  onAdd,
  onRemoveDraft,
  onSave,
}: {
  cashForms: CashFormState[];
  cashOptions: Array<{ id: string | number; cash_name?: string; code: string; amount: number | string }>;
  usedCashIds: Set<number>;
  createPending: boolean;
  updatePending: boolean;
  onChange: (index: number, value: CashFormState) => void;
  onAdd: () => void;
  onRemoveDraft: (index: number) => void;
  onSave: (form: CashFormState) => void;
}) {
  return (
    <section className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Kas dan Setara Kas</h3>
          <p className="mt-1 text-xs text-slate-500">Nominal cash manual untuk laporan neraca.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Tambah Kas
        </Button>
      </div>

      <div className="space-y-2">
        {cashForms.map((form, index) => (
          <div key={form.id ?? `new-${index}`} className="grid gap-2 md:grid-cols-[1fr_180px_auto_auto]">
            <Select
              value={form.cash_id ? String(form.cash_id) : EMPTY_VALUE}
              onValueChange={(nextValue) => {
                onChange(index, {
                  ...form,
                  cash_id: nextValue === EMPTY_VALUE ? null : Number(nextValue),
                });
              }}
              disabled={Boolean(form.id)}
            >
              <SelectTrigger className="h-9 bg-white">
                <SelectValue placeholder="Pilih kas" />
              </SelectTrigger>
              <SelectContent showSearch searchPlaceholder="Cari kas..." className="max-h-80">
                <SelectItem value={EMPTY_VALUE}>Pilih kas</SelectItem>
                {cashOptions.map((cash) => {
                  const cashId = Number(cash.id);
                  const disabled = usedCashIds.has(cashId) && form.cash_id !== cashId;
                  return (
                    <SelectItem key={cash.id} value={String(cash.id)} disabled={disabled}>
                      {cash.cash_name ?? cash.code} ({currenciesFormat('idr', toNumber(cash.amount))})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <MoneyInput
              value={form.value}
              onChangeValue={(nextValue) => onChange(index, { ...form, value: nextValue })}
              placeholder="Nominal"
              className="h-9 bg-white"
            />

            <Button
              type="button"
              size="sm"
              onClick={() => onSave(form)}
              disabled={!form.cash_id || createPending || updatePending}
              className="h-9"
            >
              <Save className="h-4 w-4" />
              Simpan
            </Button>

            <Button
              type="button"
              size="icon"
              aria-label="Hapus baris kas"
              onClick={() => onRemoveDraft(index)}
              className="btn-outline! h-9 px-2"
              disabled={Boolean(form.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {cashForms.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
            Belum ada kas manual pada template.
          </div>
        )}
      </div>
    </section>
  );
}

function BalanceColumn({
  title,
  totalLabel,
  total,
  totalUsd,
  children,
}: {
  title: string;
  totalLabel: string;
  total: number;
  totalUsd: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-300 bg-slate-50 px-4 py-3">
        <h2 className="text-base font-bold uppercase tracking-normal text-slate-900">{title}</h2>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase text-slate-500">{totalLabel}</p>
          <p className="mt-1 text-base font-bold text-slate-900">{currenciesFormat('idr', total)}</p>
          <p className="mt-1 text-sm font-semibold text-sky-700">{currenciesFormat('usd', totalUsd)}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function LaporanNeracaPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId);
  const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
  const templatePrint = useReportTemplatePrint(selectedPrintBackground);

  const [templateState, setTemplateState] = useState<Record<BalanceReportTemplateKey, number[]>>(
    buildEmptyTemplateState,
  );
  const [cashForms, setCashForms] = useState<CashFormState[]>([]);
  const [searchInput, setSearchInput] = useState('');

  const reportQuery = useBalanceReport(resolvedCompanyId, Boolean(resolvedCompanyId));
  const cashOptionsQuery = useBalanceReportCashOptions(resolvedCompanyId, Boolean(resolvedCompanyId));
  const updateTemplateMutation = useUpdateBalanceReportTemplate(resolvedCompanyId);
  const createCashMutation = useCreateBalanceReportCash(resolvedCompanyId);
  const updateCashMutation = useUpdateBalanceReportCash(resolvedCompanyId);

  const accountQuery = useAccounts({
    page: 1,
    perPage: 1000,
    search: '',
    company_id: resolvedCompanyId ?? undefined,
    enabled: Boolean(resolvedCompanyId),
  });
  const accounts = useMemo(() => accountQuery.data?.data ?? [], [accountQuery.data?.data]);

  const reportData = reportQuery.data?.data;
  const searchKeyword = searchInput.trim().toLowerCase();

  useEffect(() => {
    if (!reportData) return;

    const nextState = buildEmptyTemplateState();
    const assetsTemplate = reportData.assets_template;
    const liabilitiesTemplate = reportData.liabilities_template;

    ASSET_TEMPLATE_KEYS.forEach((key) => {
      nextState[key] = uniqueNumbers(assetsTemplate?.[key] ?? []);
    });
    LIABILITY_TEMPLATE_KEYS.forEach((key) => {
      nextState[key] = uniqueNumbers(liabilitiesTemplate?.[key] ?? []);
    });

    setTemplateState(nextState);
    setCashForms((reportData.company_cashes ?? []).map((item: BalanceReportCash) => ({
      id: item.id,
      cash_id: Number(item.cash_id),
      value: toNumber(item.value),
    })));
  }, [reportData]);

  const normalizedSections = useMemo(() => {
    return REPORT_SECTIONS.reduce<Record<string, NormalizedSection>>((acc, section) => {
      acc[section.key] = normalizeSection(reportData?.[section.calcKey]);
      return acc;
    }, {});
  }, [reportData]);

  const cashRows = useMemo(
    () => reportData?.cashes_calc?.items ?? [],
    [reportData?.cashes_calc?.items],
  );
  const cashTotals = useMemo(() => {
    if (cashRows.length === 0) {
      return {
        idr: toNumber(reportData?.cashes_calc?.total_idr ?? reportData?.cashes_calc?.total),
        usd: toNumber(reportData?.cashes_calc?.total_usd),
      };
    }

    return cashRows.reduce((totals, row) => {
      const currency = String(row.type ?? 'IDR').toUpperCase() === 'USD' ? 'usd' : 'idr';
      totals[currency] += toNumber(row.value);
      return totals;
    }, { idr: 0, usd: 0 });
  }, [cashRows, reportData?.cashes_calc?.total, reportData?.cashes_calc?.total_idr, reportData?.cashes_calc?.total_usd]);

  const calculatedTotals = useMemo(() => {
    const sumSections = (keys: BalanceReportTemplateKey[], currency: 'totalIdr' | 'totalUsd') =>
      REPORT_SECTIONS
        .filter((section) => keys.includes(section.templateKey))
        .reduce((sum, section) => sum + (normalizedSections[section.key]?.[currency] ?? 0), 0);

    const assetIdr = cashTotals.idr + sumSections(ASSET_TEMPLATE_KEYS, 'totalIdr');
    const assetUsd = cashTotals.usd + sumSections(ASSET_TEMPLATE_KEYS, 'totalUsd');
    const liabilityKeys = LIABILITY_TEMPLATE_KEYS.filter((key) => key !== 'equity_ids');
    const liabilitiesIdr = sumSections(liabilityKeys, 'totalIdr');
    const liabilitiesUsd = sumSections(liabilityKeys, 'totalUsd');
    const equityIdr = sumSections(['equity_ids'], 'totalIdr');
    const equityUsd = sumSections(['equity_ids'], 'totalUsd');

    return {
      assetIdr,
      assetUsd,
      liabilitiesIdr,
      liabilitiesUsd,
      equityIdr,
      equityUsd,
      passivaIdr: liabilitiesIdr + equityIdr,
      passivaUsd: liabilitiesUsd + equityUsd,
    };
  }, [cashTotals, normalizedSections]);

  const hasReportRows = cashRows.length > 0
    || Object.values(normalizedSections).some((section) => section.rows.length > 0);
  const totalCash = cashTotals.idr;
  const totalCashUsd = cashTotals.usd;
  const totalAssets = hasReportRows ? calculatedTotals.assetIdr : toNumber(reportData?.total_assets);
  const totalAssetsUsd = toNumber(reportData?.total_assets_usd) || calculatedTotals.assetUsd;
  const totalLiabilities = hasReportRows ? calculatedTotals.liabilitiesIdr : toNumber(reportData?.total_liabilities);
  const totalLiabilitiesUsd = toNumber(reportData?.total_liabilities_usd) || calculatedTotals.liabilitiesUsd;
  const totalEquity = hasReportRows ? calculatedTotals.equityIdr : toNumber(reportData?.total_equity);
  const totalEquityUsd = toNumber(reportData?.total_equity_usd) || calculatedTotals.equityUsd;
  const totalPassiva = hasReportRows ? calculatedTotals.passivaIdr : toNumber(reportData?.total_passiva);
  const totalPassivaUsd = toNumber(reportData?.total_passiva_usd) || calculatedTotals.passivaUsd;
  const difference = totalAssets - totalPassiva;
  const differenceUsd = totalAssetsUsd - totalPassivaUsd;
  const printSections = useMemo(() => REPORT_SECTIONS.reduce<{
    assets: BalancePrintSection[];
    liabilities: BalancePrintSection[];
  }>((result, section) => {
    const normalizedSection = normalizedSections[section.key] ?? {
      rows: [],
      totalIdr: 0,
      totalUsd: 0,
    };
    result[section.side].push({
      key: section.key,
      title: section.title,
      ...normalizedSection,
    });
    return result;
  }, { assets: [], liabilities: [] }), [normalizedSections]);
  const usedCashIds = useMemo(
    () => new Set(cashForms.map((form) => form.cash_id).filter((id): id is number => Boolean(id))),
    [cashForms],
  );

  const handleSyncTemplate = async () => {
    if (!resolvedCompanyId) {
      toast.error('Company belum dipilih.');
      return;
    }

    const assetsPayload: BalanceReportTemplatePayload = {
      type: 'assets',
      receivable_ids: uniqueNumbers(templateState.receivable_ids),
      down_payment_ids: uniqueNumbers(templateState.down_payment_ids),
      fixed_asset_ids: uniqueNumbers(templateState.fixed_asset_ids),
    };
    const liabilitiesPayload: BalanceReportTemplatePayload = {
      type: 'liabilities',
      accounts_payable_ids: uniqueNumbers(templateState.accounts_payable_ids),
      tax_payable_ids: uniqueNumbers(templateState.tax_payable_ids),
      miscellaneous_debts_ids: uniqueNumbers(templateState.miscellaneous_debts_ids),
      equity_ids: uniqueNumbers(templateState.equity_ids),
    };

    try {
      await updateTemplateMutation.mutateAsync(assetsPayload);
      await updateTemplateMutation.mutateAsync(liabilitiesPayload);
      toast.success('Template Laporan Neraca berhasil disinkronkan.');
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal sinkron template Laporan Neraca.');
    }
  };

  const handleSaveCash = async (form: CashFormState) => {
    if (!resolvedCompanyId || !form.cash_id) {
      toast.error('Company dan kas wajib dipilih.');
      return;
    }

    const payload = {
      cash_id: form.cash_id,
      value: form.value,
    };

    try {
      if (form.id) {
        await updateCashMutation.mutateAsync({ id: form.id, payload });
      } else {
        await createCashMutation.mutateAsync(payload);
      }
      toast.success('Data kas Laporan Neraca berhasil disimpan.');
    } catch (error) {
      toast.error((error as Error)?.message || 'Gagal menyimpan data kas.');
    }
  };

  const isLoading = reportQuery.isLoading || accountQuery.isLoading || cashOptionsQuery.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <PageHeader
          title="Laporan Neraca"
          subtitle="Laporan neraca dengan pengaturan kas manual, aktiva, dan passiva."
          actions={
            <>
              <Button type="button" variant="outline" onClick={templatePrint.openPrintDialog} disabled={isLoading || reportQuery.isError}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
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
                onClick={handleSyncTemplate}
                disabled={updateTemplateMutation.isPending || !resolvedCompanyId}
              >
                <RefreshCw className={cn('h-4 w-4', updateTemplateMutation.isPending && 'animate-spin')} />
                Sinkron Template
              </Button>
            </>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            placeholder="Cari akun pada laporan"
            aria-label="Cari akun pada Laporan Neraca"
            wrapperClassName="w-full sm:w-[320px]"
          />
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full sm:w-auto"
            onClick={() => setSearchInput('')}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Aktiva</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{currenciesFormat('idr', totalAssets)}</p>
            <p className="mt-1 text-sm font-semibold text-sky-700">{currenciesFormat('usd', totalAssetsUsd)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Liabilitas</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{currenciesFormat('idr', totalLiabilities)}</p>
            <p className="mt-1 text-sm font-semibold text-sky-700">{currenciesFormat('usd', totalLiabilitiesUsd)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Ekuitas</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{currenciesFormat('idr', totalEquity)}</p>
            <p className="mt-1 text-sm font-semibold text-sky-700">{currenciesFormat('usd', totalEquityUsd)}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">Selisih Neraca</p>
            <p className={cn('mt-2 text-xl font-bold', difference === 0 ? 'text-emerald-700' : 'text-rose-700')}>
              {currenciesFormat('idr', difference)}
            </p>
            <p className={cn('mt-1 text-sm font-semibold', differenceUsd === 0 ? 'text-emerald-700' : 'text-rose-700')}>
              {currenciesFormat('usd', differenceUsd)}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Skeleton className="h-96 w-full rounded-md" />
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
        ) : reportQuery.isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Gagal memuat Laporan Neraca.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <BalanceColumn title="Aktiva" totalLabel="Total Aktiva" total={totalAssets} totalUsd={totalAssetsUsd}>
              <CashManagement
                cashForms={cashForms}
                cashOptions={cashOptionsQuery.data ?? []}
                usedCashIds={usedCashIds}
                createPending={createCashMutation.isPending}
                updatePending={updateCashMutation.isPending}
                onAdd={() => setCashForms((current) => [...current, { cash_id: null, value: 0 }])}
                onChange={(index, value) => {
                  setCashForms((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
                }}
                onRemoveDraft={(index) => {
                  setCashForms((current) => current.filter((item, itemIndex) => item.id || itemIndex !== index));
                }}
                onSave={(form) => void handleSaveCash(form)}
              />

              <section className="border-t border-slate-200 px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Rincian Kas</h3>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{currenciesFormat('idr', totalCash)}</p>
                    <p className="mt-1 text-sm font-semibold text-sky-700">{currenciesFormat('usd', totalCashUsd)}</p>
                  </div>
                </div>
                <Table>
                  <TableBody>
                    {cashRows.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="py-5 text-center text-sm text-slate-500">Belum ada rincian kas.</TableCell>
                      </TableRow>
                    ) : (
                      cashRows
                        .filter((row) => !searchKeyword || `${row.cash_code ?? ''} ${row.cash_name}`.toLowerCase().includes(searchKeyword))
                        .map((row) => (
                          <TableRow key={row.id} className="hover:bg-slate-50">
                            <TableCell className="text-slate-700">{row.cash_code ? `${row.cash_code} - ${row.cash_name}` : row.cash_name}</TableCell>
                            <TableCell className={cn(
                              'text-right font-medium',
                              String(row.type ?? 'IDR').toUpperCase() === 'USD' ? 'text-sky-700' : 'text-slate-900',
                            )}>
                              {currenciesFormat(
                                String(row.type ?? 'IDR').toUpperCase() === 'USD' ? 'usd' : 'idr',
                                toNumber(row.value),
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </section>

              {REPORT_SECTIONS.filter((section) => section.side === 'assets').map((section) => (
                <TemplateAccountEditor
                  key={section.key}
                  config={section}
                  accountIds={templateState[section.templateKey]}
                  accounts={accounts}
                  section={normalizedSections[section.key] ?? { rows: [], totalIdr: 0, totalUsd: 0 }}
                  searchKeyword={searchKeyword}
                  onChange={(nextIds) => setTemplateState((current) => ({
                    ...current,
                    [section.templateKey]: nextIds,
                  }))}
                />
              ))}
            </BalanceColumn>

            <BalanceColumn title="Passiva" totalLabel="Total Passiva" total={totalPassiva} totalUsd={totalPassivaUsd}>
              {REPORT_SECTIONS.filter((section) => section.side === 'liabilities').map((section) => (
                <TemplateAccountEditor
                  key={section.key}
                  config={section}
                  accountIds={templateState[section.templateKey]}
                  accounts={accounts}
                  section={normalizedSections[section.key] ?? { rows: [], totalIdr: 0, totalUsd: 0 }}
                  searchKeyword={searchKeyword}
                  onChange={(nextIds) => setTemplateState((current) => ({
                    ...current,
                    [section.templateKey]: nextIds,
                  }))}
                />
              ))}
            </BalanceColumn>
          </div>
        )}

        <LaporanNeracaPrintDocument
          template={templatePrint.selectedTemplate}
          fallbackBackground={selectedPrintBackground}
          companyName={getCompanyName(resolvedCompanyId)}
          printedAt={templatePrint.printedAt}
          cashRows={cashRows}
          cashTotalIdr={totalCash}
          cashTotalUsd={totalCashUsd}
          assetSections={printSections.assets}
          liabilitySections={printSections.liabilities}
          totalAssets={totalAssets}
          totalAssetsUsd={totalAssetsUsd}
          totalPassiva={totalPassiva}
          totalPassivaUsd={totalPassivaUsd}
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
