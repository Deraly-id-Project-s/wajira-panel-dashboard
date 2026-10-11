import { useState, useEffect, useCallback } from 'react';
import { cashFlowService, CashFlowItem, CashFlowQueryParams } from '@/services/cashFlow.service';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { resolveCompanyId } from '@/lib/print-letterhead';

interface UseLaporanKasReturn {
  data: CashFlowItem[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number;
    to: number;
  };
  isLoading: boolean;
  error: string | null;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalDebetIdr: number;
  totalCreditIdr: number;
  totalDebetUsd: number;
  totalCreditUsd: number;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  setSearch: (search: string) => void;
  setSort: (key: string, direction: 'asc' | 'desc') => void;
  sortKey: string;
  sortOrder: 'asc' | 'desc';
  refetch: () => void;
}

export const useLaporanKas = (): UseLaporanKasReturn => {
  const router = useRouter();
  const { companyId } = useCompany();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const resolvedCompanyId = resolveCompanyId(slug, companyId);

  const [data, setData] = useState<CashFlowItem[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 25,
    total: 0,
    from: 0,
    to: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPemasukan, setTotalPemasukan] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [totalDebetIdr, setTotalDebetIdr] = useState(0);
  const [totalCreditIdr, setTotalCreditIdr] = useState(0);
  const [totalDebetUsd, setTotalDebetUsd] = useState(0);
  const [totalCreditUsd, setTotalCreditUsd] = useState(0);

  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPerPage, setCurrentPerPage] = useState(25);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    if (!resolvedCompanyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: CashFlowQueryParams = {
        is_paid: true,
        page: currentPage,
        per_page: currentPerPage,
        search: currentSearch || undefined,
        sort_by: sortKey,
        sort_direction: sortOrder,
        company_id: resolvedCompanyId ?? undefined,
      };

      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const result = await cashFlowService.getCashFlow(params);

      setData(result.data);
      setPagination({
        currentPage: result.current_page,
        lastPage: result.last_page,
        perPage: result.per_page,
        total: result.total,
        from: result.from || 0,
        to: result.to || 0,
      });

      // Hitung total debit dan kredit (IDR dan USD) dari data yang ditampilkan
      const debetIdr = result.data.reduce((sum, item) => sum + (Number(item.debet_total ?? item.debet) || 0), 0);
      const creditIdr = result.data.reduce((sum, item) => sum + (Number(item.kredit_total ?? item.credit_total ?? item.credit) || 0), 0);
      const debetUsd = result.data.reduce((sum, item) => sum + (Number(item.debet_usd_total ?? item.debet_usd) || 0), 0);
      const creditUsd = result.data.reduce((sum, item) => sum + (Number(item.kredit_usd_total ?? item.credit_usd_total ?? item.credit_usd) || 0), 0);

      setTotalPemasukan(debetIdr);
      setTotalPengeluaran(creditIdr);
      setTotalDebetIdr(debetIdr);
      setTotalCreditIdr(creditIdr);
      setTotalDebetUsd(debetUsd);
      setTotalCreditUsd(creditUsd);

    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data laporan kas');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentPerPage, startDate, endDate, currentSearch, sortKey, sortOrder, resolvedCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setDateRange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
    setCurrentPage(1); // Reset ke halaman pertama
  };

  const setSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortOrder(direction);
    setCurrentPage(1);
  };

  return {
    data,
    pagination,
    isLoading,
    error,
    totalPemasukan,
    totalPengeluaran,
    totalDebetIdr,
    totalCreditIdr,
    totalDebetUsd,
    totalCreditUsd,
    setPage: setCurrentPage,
    setPerPage: (perPage: number) => {
      setCurrentPerPage(perPage);
      setCurrentPage(1);
    },
    setDateRange,
    setSearch: (search: string) => {
      setCurrentSearch(search);
      setCurrentPage(1);
    },
    setSort,
    sortKey,
    sortOrder,
    refetch: fetchData,
  };
};
