import { useQuery } from '@tanstack/react-query';

import type { BalanceColumnReportParams } from '@/@types/balance-column-report.types';
import { getBalanceColumnReport } from '@/services/report/balanceColumnReport.service';

export function useBalanceColumnReport(
  params: BalanceColumnReportParams & { enabled?: boolean },
) {
  const { enabled = true, ...queryParams } = params;

  const queryResult = useQuery({
    queryKey: ['balance-column-report', queryParams],
    queryFn: () => getBalanceColumnReport(queryParams),
    enabled,
    placeholderData: (previous) => previous,
    staleTime: 10_000,
  });

  const records = queryResult.data?.data;

  return {
    data: records?.data ?? [],
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
