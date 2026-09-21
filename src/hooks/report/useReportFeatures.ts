import { useQuery } from '@tanstack/react-query';
import {
  getExpeditionReportFeature,
  getOrderListReportFeature,
  getCashAdvanceReportFeature,
  getExpeditionClaimReportFeature,
  getInvoiceReportFeature,
  BaseReportParams,
} from '@/services/report/reportFeature.service';

export function useExpeditionReportFeature(params: BaseReportParams) {
  const queryResult = useQuery({
    queryKey: ['report-feature', 'expedition', params],
    queryFn: () => getExpeditionReportFeature(params),
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });

  return {
    data: queryResult.data?.data || [],
    pagination: {
      currentPage: queryResult.data?.current_page || params.page || 1,
      lastPage: queryResult.data?.last_page || 1,
      perPage: queryResult.data?.per_page || params.per_page || 25,
      total: queryResult.data?.total || 0,
    },
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}

export function useOrderListReportFeature(params: BaseReportParams) {
  const queryResult = useQuery({
    queryKey: ['report-feature', 'order-list', params],
    queryFn: () => getOrderListReportFeature(params),
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });

  return {
    data: queryResult.data?.data || [],
    pagination: {
      currentPage: queryResult.data?.current_page || params.page || 1,
      lastPage: queryResult.data?.last_page || 1,
      perPage: queryResult.data?.per_page || params.per_page || 25,
      total: queryResult.data?.total || 0,
    },
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}

export function useCashAdvanceReportFeature(params: BaseReportParams) {
  const queryResult = useQuery({
    queryKey: ['report-feature', 'cash-advance', params],
    queryFn: () => getCashAdvanceReportFeature(params),
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });

  return {
    data: queryResult.data?.data || [],
    pagination: {
      currentPage: queryResult.data?.current_page || params.page || 1,
      lastPage: queryResult.data?.last_page || 1,
      perPage: queryResult.data?.per_page || params.per_page || 25,
      total: queryResult.data?.total || 0,
    },
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}

export function useExpeditionClaimReportFeature(params: BaseReportParams) {
  const queryResult = useQuery({
    queryKey: ['report-feature', 'expedition-claim', params],
    queryFn: () => getExpeditionClaimReportFeature(params),
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });

  return {
    data: queryResult.data?.data || [],
    pagination: {
      currentPage: queryResult.data?.current_page || params.page || 1,
      lastPage: queryResult.data?.last_page || 1,
      perPage: queryResult.data?.per_page || params.per_page || 25,
      total: queryResult.data?.total || 0,
    },
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}

export function useInvoiceReportFeature(params: BaseReportParams) {
  const queryResult = useQuery({
    queryKey: ['report-feature', 'invoice', params],
    queryFn: () => getInvoiceReportFeature(params),
    placeholderData: (prev) => prev,
    staleTime: 10_000,
  });

  return {
    data: queryResult.data?.data || [],
    pagination: {
      currentPage: queryResult.data?.current_page || params.page || 1,
      lastPage: queryResult.data?.last_page || 1,
      perPage: queryResult.data?.per_page || params.per_page || 25,
      total: queryResult.data?.total || 0,
    },
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
}
