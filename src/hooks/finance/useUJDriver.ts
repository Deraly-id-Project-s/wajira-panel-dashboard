import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UJDriverFilterParams, CreateUJDriverPaymentPayload } from '@/types/uj-driver.types';
import { getUJDriverList, createUJDriverBillingPayment } from '@/services/finance/ujDriver.service';

const UJ_DRIVER_KEYS = {
  all: ['uj-driver-list'] as const,
  list: (params: UJDriverFilterParams) => [...UJ_DRIVER_KEYS.all, params] as const,
};

export function useUJDriverList(params: UJDriverFilterParams) {
  return useQuery({
    queryKey: UJ_DRIVER_KEYS.list(params),
    queryFn: () => getUJDriverList(params),
  });
}

export function useCreateUJDriverPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUJDriverPaymentPayload) => createUJDriverBillingPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UJ_DRIVER_KEYS.all });
    },
  });
}
