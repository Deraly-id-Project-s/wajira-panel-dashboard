import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getLaporanPenjualan,
  getLaporanPenjualanSparepart,
  SalesTransactionParams,
  SalesTransactionItem,
  SalesSparepartTransactionItem,
} from '@/services/laporan-penjualan.service';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export type ReportType = 'per-nota' | 'per-type' | 'per-customer';

interface UseLaporanPenjualanReturn {
  data: Array<SalesTransactionItem | SalesSparepartTransactionItem>;
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
  setCustomer: (customerId: number | null) => void;
  setSearch: (search: string) => void;
  applyFilters: (filters: {
    startDate: string | null;
    endDate: string | null;
    customerId: number | null;
    search: string;
  }) => void;
  resetFiltersForTab: (tab: string) => void;
  refetch: () => void;
}

export const useLaporanPenjualan = (reportItem: 'unit' | 'sparepart' = 'unit'): UseLaporanPenjualanReturn => {
  const [data, setData] = useState<Array<SalesTransactionItem | SalesSparepartTransactionItem>>([]);
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

  const { companyId } = useCompany();

  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPerPage, setCurrentPerPage] = useState(25);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [currentSearch, setCurrentSearch] = useState('');
  const latestRequestRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    setIsLoading(true);
    setError(null);
    try {
      const params: SalesTransactionParams = {
        page: currentPage,
        per_page: currentPerPage,
        company_id: companyId ? Number(companyId) : undefined,
      };
      
      // CATATAN: Backend rute ini mengalami HTTP 500 Error ketika menerima parameter start_date/person_id.
      // Oleh karena itu, kita MENGHAPUS pengiriman parameter ini ke backend,
      // dan mengandalkan 100% Filter Sisi Klien (Client-Side Filtering) yang sudah kita buat di bawah.
      
      const result = reportItem === 'sparepart'
        ? await getLaporanPenjualanSparepart(params)
        : await getLaporanPenjualan(params);

      // Prevent stale response from older request overriding newest result.
      if (requestId !== latestRequestRef.current) {
        return;
      }
      
      // If backend fails to filter properly, apply client-side filtering fallback.
      let filteredData: Array<SalesTransactionItem | SalesSparepartTransactionItem> = Array.isArray(result?.data) ? result.data : [];

      if (startDate && endDate) {
        filteredData = filteredData.filter(item => {
          if (!item?.transaction_date) return true;
          try {
            // Support both T and space separated dates
            const dateOnly = String(item.transaction_date).split(/[T ]/)[0]; 
            return dateOnly >= startDate && dateOnly <= endDate;
          } catch {
            return true;
          }
        });
      }

      if (currentSearch) {
        const q = String(currentSearch).toLowerCase();
        filteredData = filteredData.filter(item => {
          const code = String(item.transaction_code || '').toLowerCase();
          const uName = String('unit_name' in item ? item.unit_name || '' : '').toLowerCase();
          const sparepartName = String('sparepart_name' in item ? item.sparepart_name || '' : '').toLowerCase();
          const sparepartCode = String('sparepart_code' in item ? item.sparepart_code || '' : '').toLowerCase();
          const pName = String(item.person_name || '').toLowerCase();
          return code.includes(q) || uName.includes(q) || sparepartName.includes(q) || sparepartCode.includes(q) || pName.includes(q);
        });
      }

      // Keep this for interface compatibility, though we rely on currentSearch for Customer matching now
      if (selectedCustomer) {
        // If we still want to filter by exact ID, but API doesn't return person_id anymore
        // We'll safely ignore this since currentSearch handles the string match
      }

      setData(filteredData);
      setPagination({
        currentPage: result?.current_page || 1,
        lastPage: result?.last_page || 1,
        perPage: result?.per_page || 10,
        total: result?.total || 0,
        from: result?.from || 0,
        to: result?.to || 0,
      });
    } catch (err: any) {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      console.error("Fetch Data Error:", err);
      setError(err.message || 'Gagal mengambil data laporan penjualan');
      toast.error('Gagal memuat data');
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, currentPerPage, startDate, endDate, selectedCustomer, currentSearch, companyId, reportItem]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
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
    setCustomer: (customerId: number | null) => {
      setSelectedCustomer(customerId);
      setCurrentPage(1);
    },
    setSearch: (search: string) => {
      setCurrentSearch(search);
      setCurrentPage(1);
    },
    applyFilters: ({ startDate: nextStartDate, endDate: nextEndDate, customerId, search }) => {
      setStartDate(nextStartDate);
      setEndDate(nextEndDate);
      setSelectedCustomer(customerId);
      setCurrentSearch(search);
      setCurrentPage(1);
    },
    resetFiltersForTab: (tab: string) => {
      setCurrentPage(1);

      if (tab === 'per-nota') {
        setSelectedCustomer(null);
        setCurrentSearch('');
        return;
      }

      if (tab === 'per-customer') {
        setCurrentSearch('');
        return;
      }

      setSelectedCustomer(null);
    },
    refetch: fetchData,
  };
};
