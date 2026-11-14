import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId } from '@/lib/print-letterhead';
import { useCashFlowReport } from '@/hooks/report/useCashFlowReport';
import { exportCashFlowReport } from '@/services/report/cashFlowReport.service';
import type { CashFlowReportItem, CashFlowReportParams } from '@/@types/cash-flow-report.types';

export interface UseLaporanKasReturn {
  data: CashFlowReportItem[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number;
    to: number;
  };
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  totals: {
    debitCashIdr: number;
    kreditCashIdr: number;
    debitBankIdr: number;
    kreditBankIdr: number;
    debitBankUsd: number;
    kreditBankUsd: number;
  };
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  setSearch: (search: string) => void;
  setSort: (key: string, direction: 'asc' | 'desc') => void;
  sortKey: string;
  sortOrder: 'asc' | 'desc';
  refetch: () => void;
  handleExport: () => Promise<void>;
  isExporting: boolean;
}

export const useLaporanKas = (defaultPerPage = 25): UseLaporanKasReturn => {
  const router = useRouter();
  const { companyId } = useCompany();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const resolvedCompanyId = resolveCompanyId(slug, companyId);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  const queryParams = useMemo<CashFlowReportParams>(() => ({
    company_id: resolvedCompanyId ?? undefined,
    is_paid: true,
    page,
    per_page: perPage,
    start_date: startDate || undefined,
    end_date: endDate || undefined,
    search: search || undefined,
    sort_by: sortKey,
    sort_order: sortOrder,
  }), [resolvedCompanyId, page, perPage, startDate, endDate, search, sortKey, sortOrder]);

  const { data, pagination, isLoading, isFetching, error, refetch } = useCashFlowReport({
    ...queryParams,
    enabled: Boolean(resolvedCompanyId),
  });

  const totals = useMemo(() => {
    return {
      debitCashIdr: data.reduce((sum, item) => sum + (Number(item.debit_cash_idr ?? item['DEBIT (CASH IDR)']) || 0), 0),
      kreditCashIdr: data.reduce((sum, item) => sum + (Number(item.kredit_cash_idr ?? item['KREDIT (CASH IDR)']) || 0), 0),
      debitBankIdr: data.reduce((sum, item) => sum + (Number(item.debit_bank_idr ?? item['DEBIT (BANK IDR)']) || 0), 0),
      kreditBankIdr: data.reduce((sum, item) => sum + (Number(item.kredit_bank_idr ?? item['KREDIT (BANK IDR)']) || 0), 0),
      debitBankUsd: data.reduce((sum, item) => sum + (Number(item.debit_bank_usd ?? item['DEBIT (BANK USD)']) || 0), 0),
      kreditBankUsd: data.reduce((sum, item) => sum + (Number(item.kredit_bank_usd ?? item['KREDIT (BANK USD)']) || 0), 0),
    };
  }, [data]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCashFlowReport({
        ...queryParams,
        page: undefined,
        per_page: undefined,
      });
      toast.success('Laporan transaksi kas berhasil diexport');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal export laporan transaksi kas');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSetPage = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handleSetPerPage = useCallback((p: number) => {
    setPerPage(p);
    setPage(1);
  }, []);

  const handleSetDateRange = useCallback((start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  }, []);

  const handleSetSearch = useCallback((s: string) => {
    setSearch(s);
    setPage(1);
  }, []);

  const handleSetSort = useCallback((key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortOrder(direction);
    setPage(1);
  }, []);

  return {
    data,
    pagination,
    isLoading,
    isFetching,
    error,
    totals,
    setPage: handleSetPage,
    setPerPage: handleSetPerPage,
    setDateRange: handleSetDateRange,
    setSearch: handleSetSearch,
    setSort: handleSetSort,
    sortKey,
    sortOrder,
    refetch,
    handleExport,
    isExporting,
  };
};
