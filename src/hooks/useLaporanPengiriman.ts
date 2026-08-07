import { useState, useEffect, useCallback } from 'react';
import { getLaporanPengiriman, PengirimanParams, PengirimanItem } from '@/services/laporan-pengiriman.service';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export type ReportType = 'per-nota' | 'per-tipe' | 'per-customer';

interface UseLaporanPengirimanReturn {
  data: PengirimanItem[];
  type: string | null,
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
  startDate: string | null;
  endDate: string | null;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  setSearch: (search: string) => void;
  applyFilters: (filters: {
    startDate: string | null;
    endDate: string | null;
    search: string;
  }) => void;
  refetch: () => void;
}

export const useLaporanPengiriman = (): UseLaporanPengirimanReturn => {
  const [data, setData] = useState<PengirimanItem[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 50,
    total: 0,
    from: 0,
    to: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { companyId } = useCompany();

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPerPage, setCurrentPerPage] = useState(25);
  const [type, setType] = useState<string | null>('sales');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [currentSearch, setCurrentSearch] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: PengirimanParams = {
        page: currentPage,
        type: type || 'sales',
        per_page: currentPerPage,
        company_id: companyId ? Number(companyId) : undefined,
      };

      // Disable backend date matching/person matching to apply frontend matching
      // if (startDate) params.start_date = startDate;
      // if (endDate) params.end_date = endDate;

      const result = await getLaporanPengiriman(params);

      // Client-Side Robust Filtering
      let filteredData = Array.isArray(result.data) ? result.data : [];

      if (startDate && endDate) {
        filteredData = filteredData.filter(item => {
          if (!item?.receipt_date) return true;
          try {
            const dateOnly = String(item.receipt_date).split(/[T ]/)[0]; 
            return dateOnly >= startDate && dateOnly <= endDate;
          } catch {
            return true;
          }
        });
      }

      if (currentSearch) {
        const q = String(currentSearch).toLowerCase();
        filteredData = filteredData.filter(item => {
          const uName = String(item.unit_type?.name || '').toLowerCase();
          const pName = String(item.person || '').toLowerCase();
          return uName.includes(q) || pName.includes(q);
        });
      }

      setData(filteredData);
      setPagination({
        currentPage: result.current_page,
        lastPage: result.last_page,
        perPage: result.per_page,
        total: result.total,
        from: result.from || 0,
        to: result.to || 0,
      });
    } catch (err: any) {
      console.error('Fetch Data Error:', err);
      setError(err.message || 'Gagal mengambil data laporan pengiriman');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentPerPage, type, startDate, endDate, currentSearch, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    type,
    pagination,
    isLoading,
    error,
    startDate,
    endDate,
    setPage: setCurrentPage,
    setPerPage: (perPage: number) => {
      setCurrentPerPage(perPage);
      setCurrentPage(1);
    },
    setDateRange: (start: string | null, end: string | null) => {
      setStartDate(start);
      setEndDate(end);
      setCurrentPage(1);
    },
    setSearch: (search: string) => {
      setCurrentSearch(search);
      setCurrentPage(1);
    },
    applyFilters: ({ startDate: nextStartDate, endDate: nextEndDate, search }) => {
      setStartDate(nextStartDate);
      setEndDate(nextEndDate);
      setCurrentSearch(search);
      setCurrentPage(1);
    },
    refetch: fetchData,
  };
};
