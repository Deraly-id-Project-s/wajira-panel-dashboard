import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getLaporanPembelian,
  getLaporanPembelianSparepart,
  PurchaseTransactionParams,
  PurchaseTransactionItem,
  PurchaseSparepartTransactionItem,
} from '@/services/laporan-pembelian.service';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';

export type ReportType = 'per-nota' | 'per-type' | 'per-supplier';

interface UseLaporanPembelianReturn {
  data: Array<PurchaseTransactionItem | PurchaseSparepartTransactionItem>;
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
  setSupplier: (supplierId: number | null) => void;
  setSearch: (search: string) => void;
  applyFilters: (filters: {
    startDate: string | null;
    endDate: string | null;
    supplierId: number | null;
    search: string;
  }) => void;
  resetFiltersForTab: (tab: string) => void;
  refetch: () => void;
}

export const useLaporanPembelian = (reportItem: 'unit' | 'sparepart' = 'unit'): UseLaporanPembelianReturn => {
  const [data, setData] = useState<Array<PurchaseTransactionItem | PurchaseSparepartTransactionItem>>([]);
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

  // Filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPerPage, setCurrentPerPage] = useState(25);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);
  const [currentSearch, setCurrentSearch] = useState('');
  const latestRequestRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    setIsLoading(true);
    setError(null);
    try {
      const params: PurchaseTransactionParams = {
        page: currentPage,
        per_page: currentPerPage,
        company_id: companyId ? Number(companyId) : undefined,
      };
      
      // CATATAN: Backend rute ini mengalami HTTP 500 Error ketika menerima parameter start_date/person_id.
      // Oleh karena itu, kita MENGHAPUS pengiriman parameter ini ke backend,
      // dan mengandalkan 100% Filter Sisi Klien (Client-Side Filtering) yang sudah kita buat di bawah.
      
      const result = reportItem === 'sparepart'
        ? await getLaporanPembelianSparepart(params)
        : await getLaporanPembelian(params);

      // Prevent stale response from older request overriding newest result.
      if (requestId !== latestRequestRef.current) {
        return;
      }
      
      // If backend fails to filter properly, apply client-side filtering fallback.
      let filteredData: Array<PurchaseTransactionItem | PurchaseSparepartTransactionItem> = Array.isArray(result?.data) ? result.data : [];

      if (startDate && endDate) {
        filteredData = filteredData.filter(item => {
          const transactionDate = (item as any)?.transaction_date ?? (item as any)?.created_at;
          if (!transactionDate) return true;
          try {
            // Support both T and space separated dates
            const dateOnly = String(transactionDate).split(/[T ]/)[0];
            return dateOnly >= startDate && dateOnly <= endDate;
          } catch {
            return true;
          }
        });
      }

      if (selectedSupplier) {
        filteredData = filteredData.filter((item: any) => item?.person?.id === selectedSupplier || item?.person_id === selectedSupplier);
      }

      if (currentSearch) {
        const q = String(currentSearch).toLowerCase();
        filteredData = filteredData.filter((item: any) => {
          const matchesCode = String(item?.transaction_code ?? item?.code ?? '').toLowerCase().includes(q);
          const matchesSupplier = String(item?.person_name ?? item?.person?.name ?? '').toLowerCase().includes(q);
          const matchesSparepart = String(item?.sparepart_name ?? '').toLowerCase().includes(q)
            || String(item?.sparepart_code ?? '').toLowerCase().includes(q);
          const matchesUnitType = (item?.unit_transaction_items || []).some(
            (u: any) => u?.unit_type?.name?.toLowerCase().includes(q)
          ) || String(item?.unit_name ?? '').toLowerCase().includes(q);
          return Boolean(matchesCode || matchesSupplier || matchesSparepart || matchesUnitType);
        });
      }

      setData(filteredData);
      setPagination({
        currentPage: result?.current_page || 1,
        lastPage: result?.last_page || 1,
        perPage: result?.per_page || 50,
        total: result?.total || 0,
        from: result?.from || 0,
        to: result?.to || 0,
      });
    } catch (err: any) {
      if (requestId !== latestRequestRef.current) {
        return;
      }

      console.error("Fetch Data Error:", err);
      setError(err.message || 'Gagal mengambil data laporan pembelian');
      toast.error('Gagal memuat data');
    } finally {
      if (requestId === latestRequestRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, currentPerPage, startDate, endDate, selectedSupplier, currentSearch, companyId, reportItem]);

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
    setSupplier: (supplierId: number | null) => {
      setSelectedSupplier(supplierId);
      setCurrentPage(1);
    },
    setSearch: (search: string) => {
      setCurrentSearch(search);
      setCurrentPage(1);
    },
    applyFilters: ({ startDate: nextStartDate, endDate: nextEndDate, supplierId, search }) => {
      setStartDate(nextStartDate);
      setEndDate(nextEndDate);
      setSelectedSupplier(supplierId);
      setCurrentSearch(search);
      setCurrentPage(1);
    },
    resetFiltersForTab: (tab: string) => {
      setCurrentPage(1);

      if (tab === 'per-nota') {
        setSelectedSupplier(null);
        setCurrentSearch('');
        return;
      }

      if (tab === 'per-supplier') {
        setCurrentSearch('');
        return;
      }

      setSelectedSupplier(null);
    },
    refetch: fetchData,
  };
};
