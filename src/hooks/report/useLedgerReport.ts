import { useQuery } from '@tanstack/react-query';
import { LedgerReportParams } from '@/@types/ledger-report.types';
import { getLedgerReport } from '@/services/report/ledgerReport.service';

export function useLedgerReport(params: LedgerReportParams & { enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params;

  const queryResult = useQuery({
    queryKey: ['ledger-report', queryParams],
    queryFn: () => getLedgerReport(queryParams),
    enabled,
    placeholderData: (previous) => previous,
    staleTime: 10_000,
  });

  const records = queryResult.data?.data?.records;
  const summary = queryResult.data?.data?.summary;

  return {
    data: records?.data ?? [],
    summary: {
      openingBalance: summary?.opening_balance ?? 0,
      endingBalance: summary?.ending_balance ?? 0,
    },
    pagination: {
      currentPage: records?.current_page ?? queryParams.page ?? 1,
      lastPage: records?.last_page ?? 1,
      perPage: records?.per_page ?? queryParams.per_page ?? 25,
      total: records?.total ?? 0,
      from: records?.from ?? 0,
      to: records?.to ?? 0,
    },
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
