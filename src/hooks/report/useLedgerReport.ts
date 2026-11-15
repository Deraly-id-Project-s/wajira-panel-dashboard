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
  const cashPosition = queryResult.data?.data?.cash_position;
  const summary = queryResult.data?.data?.summary;

  const openingBalance = cashPosition?.cash_position_before ?? summary?.opening_balance ?? 0;
  const endingBalance = cashPosition?.cash_position_after ?? summary?.ending_balance ?? 0;

  return {
    data: records?.data ?? [],
    cashPosition: {
      cashPositionBefore: openingBalance,
      cashPositionAfter: endingBalance,
    },
    summary: {
      openingBalance,
      endingBalance,
      totalDebit: summary?.total_debit ?? 0,
      totalCredit: summary?.total_credit ?? 0,
      openingBalanceType: summary?.opening_balance_type ?? queryParams.opening_balance_type ?? 'monthly',
      openingBalanceDateFrom: summary?.opening_balance_date_from ?? null,
      openingBalanceDateTo: summary?.opening_balance_date_to ?? null,
      openingBalanceUsd: summary?.opening_balance_usd ?? 0,
      endingBalanceUsd: summary?.ending_balance_usd ?? 0,
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
