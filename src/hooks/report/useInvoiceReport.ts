import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getInvoiceReport } from '@/services/report/invoiceReport.service';
import { getDoInvoiceById } from '@/services/do-invoice.service';
import type { DoInvoice } from '@/types/create-invoice.types';

export function useInvoiceReport({
  page,
  perPage,
  search,
  orderBy,
  orderSort,
  date,
  isPrinted,
}: {
  page: number;
  perPage: number;
  search: string;
  orderBy?: string;
  orderSort?: 'asc' | 'desc';
  date?: string;
  isPrinted?: boolean;
}) {
  const queryResult = useQuery({
    queryKey: ['invoice-report', page, perPage, search, orderBy, orderSort, date, isPrinted],
    queryFn: async () => {
      const params: any = {
        page,
        perPage,
        order_by: orderBy || 'created_at',
        order_sort: orderSort || 'desc',
      };

      if (search?.trim()) {
        params.search = search.trim();
      }
      if (date) {
        params.date = date;
      }
      if (isPrinted !== undefined) {
        params.is_printed = isPrinted ? '1' : '0';
      }

      return getInvoiceReport(params);
    },
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });

  const rawItems = useMemo(() => queryResult.data?.data || [], [queryResult.data?.data]);

  // Fetch details for each invoice to get missing vehicle, driver, loading_in, loading_out data
  const detailQueries = useQueries({
    queries: rawItems.map((item: DoInvoice) => ({
      queryKey: ['invoice-report-detail', item.id],
      queryFn: () => getDoInvoiceById(item.id),
      staleTime: 60_000,
    })),
  });

  const mergedItems = useMemo(() => {
    return rawItems.map((item: DoInvoice, index: number) => {
      const detail = detailQueries[index]?.data;
      if (!detail) return item;

      // Merge the detail data into the item
      return {
        ...item,
        vehicle: detail.vehicle || item.vehicle,
        driver: detail.driver || item.driver,
        orderList: detail.orderList || item.orderList,
        expeditions: detail.expeditions || item.expeditions,
      };
    });
  }, [rawItems, detailQueries]);

  // Safe client-side search filtering fallback in case backend doesn't support full search
  const filteredData = useMemo(() => {
    if (!search?.trim()) return mergedItems;
    const q = search.trim().toLowerCase();

    return mergedItems.filter((item: DoInvoice) => {
      const code = item.code || '';
      const orderCode = item.orderList?.code || '';
      const custName = item.customer?.name || '';
      const regNum = item.vehicle?.registrationNumber || '';
      const vehType = item.vehicle?.type || '';
      const drvName = item.driver?.name || '';
      const loadIn = item.orderList?.loadingIn || '';
      const loadOut = item.orderList?.loadingOut || '';
      const dest = item.orderList?.doDeliveryDestination || '';
      const subject = item.subject || '';
      const description = item.description || '';

      return (
        code.toLowerCase().includes(q) ||
        orderCode.toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        regNum.toLowerCase().includes(q) ||
        vehType.toLowerCase().includes(q) ||
        drvName.toLowerCase().includes(q) ||
        loadIn.toLowerCase().includes(q) ||
        loadOut.toLowerCase().includes(q) ||
        dest.toLowerCase().includes(q) ||
        subject.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q)
      );
    });
  }, [mergedItems, search]);

  const pagination = useMemo(() => {
    const meta = queryResult.data?.meta;
    const currentPage = meta?.currentPage || page;
    const perPageVal = meta?.perPage || perPage;
    const total = meta?.total || 0;

    const from = total === 0 ? 0 : (currentPage - 1) * perPageVal + 1;
    const to = total === 0 ? 0 : Math.min(currentPage * perPageVal, total);

    return {
      currentPage,
      lastPage: meta?.lastPage || 1,
      perPage: perPageVal,
      total,
      from,
      to,
    };
  }, [queryResult.data, page, perPage]);

  return {
    data: filteredData,
    pagination,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
