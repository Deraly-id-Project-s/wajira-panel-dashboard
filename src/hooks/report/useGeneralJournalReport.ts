import { useQuery } from '@tanstack/react-query';
import type { GeneralJournalReportParams } from '@/@types/general-journal-report.types';
import { getGeneralJournalReport } from '@/services/report/generalJournalReport.service';

export function useGeneralJournalReport(params: GeneralJournalReportParams & { enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params;

  const queryResult = useQuery({
    queryKey: ['general-journal-report', queryParams],
    queryFn: () => getGeneralJournalReport(queryParams),
    enabled,
    placeholderData: (previous) => previous,
    staleTime: 10_000,
  });

  const pagination = queryResult.data?.data;

  return {
    data: pagination?.data ?? [],
    pagination: {
      currentPage: pagination?.current_page ?? queryParams.page ?? 1,
      lastPage: pagination?.last_page ?? 1,
      perPage: pagination?.per_page ?? queryParams.per_page ?? 25,
      total: pagination?.total ?? 0,
      from: pagination?.from ?? 0,
      to: pagination?.to ?? 0,
    },
    isLoading: queryResult.isLoading,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
