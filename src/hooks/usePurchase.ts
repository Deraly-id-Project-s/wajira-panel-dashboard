import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseService } from '@/services/purchase.service';
import { CreatePurchaseRequest, UpdatePurchaseRequest, CreatePurchaseUnitRequest } from '@/types/purchase.types';
import { companyQueryKeys } from '@/lib/query/company-key';

/* =====================================
   GET LIST
===================================== */

export const usePurchases = (companyId?: string | null, options: { page?: number; perPage?: number; search?: string } = {}) => {
  return useQuery({
    queryKey: companyId
      ? companyQueryKeys.list(companyId, 'purchase-items', {
          page: options.page ?? 1,
          perPage: options.perPage ?? 10,
          search: options.search ?? '',
        })
      : ['company', 'unselected', 'purchase-items'],
    queryFn: () => purchaseService.getUnitTransactionItems({ company_id: companyId, page: options.page, perPage: options.perPage, search: options.search }),
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 5, // 5 minutes,
  });
};

/* =====================================
   GET DETAIL
===================================== */

export const usePurchaseById = (id: string) => {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: () => purchaseService.getPurchaseById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !!id,
  });
};

/* =====================================
   CREATE PURCHASE
===================================== */

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseRequest) => purchaseService.createPurchase(payload),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(data.companyId) });

      queryClient.invalidateQueries({
        queryKey: ['unit-transactions'],
      });
    },
  });
};



export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePurchaseRequest }) => purchaseService.updatePurchase(id, payload),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(data.companyId) });

      queryClient.invalidateQueries({
        queryKey: ['purchase', data.id],
      });
    },
  });
};

/* =====================================
   DELETE PURCHASE
===================================== */

export const useDeletePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseService.deletePurchase(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('purchase-items'),
      });
    },
  });
};

export const useDeletePurchaseUnitItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseService.deleteUnitTransactionItem(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey.includes('purchase-items'),
      });
    },
  });
};

/* =====================================
   ADD UNIT TO PURCHASE
===================================== */

export const useAddPurchaseUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseUnitRequest) => purchaseService.addUnit(payload),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(data.companyId) });
      queryClient.invalidateQueries({
        queryKey: ['purchase', data.id],
      });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { bca: number; bcaUsd: number; cash: number } }) => purchaseService.updatePayment(id, payload),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(data.companyId) });
      queryClient.invalidateQueries({
        queryKey: ['purchase', data.id],
      });
    },
  });
};

export const useDeletePurchaseUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ purchaseId, unitId }: { purchaseId: string; unitId: string }) => purchaseService.deleteUnit(purchaseId, unitId),

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(data.companyId) });
      queryClient.invalidateQueries({
        queryKey: ['purchase', data.id],
      });
    },
  });
};

/* =====================================
   UNIT ITEM DETAIL CRUD
===================================== */

export const usePurchaseUnitItemDetails = (purchaseId?: string) => {
  return useQuery({
    queryKey: ['purchase-unit-item-details', purchaseId],
    queryFn: () => purchaseService.getUnitItemDetails(purchaseId),
    enabled: !!purchaseId,
  });
};

export const usePurchaseUnitItemDetail = (id?: string) => {
  return useQuery({
    queryKey: ['purchase-unit-item-detail', id],
    queryFn: () => purchaseService.getUnitItemDetail(id as string),
    enabled: !!id,
  });
};

export const useCreatePurchaseUnitItemDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => purchaseService.createUnitItemDetail(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-item-details', data.purchaseId] });
    },
  });
};

export const useUpdatePurchaseUnitItemDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => purchaseService.updateUnitItemDetail(id, formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-item-details', data.purchaseId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-item-detail', data.id] });
    },
  });
};

export const useDeletePurchaseUnitItemDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => purchaseService.deleteUnitItemDetail(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-item-details'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-unit-item-detail', variables.id] });
    },
  });
};

export const useUnitTransactionItemDetailsData = (id: string, params: { in_stock?: boolean; color?: string; machine_number?: string; chassis_number?: string; status?: string } = {}) => {
  return useQuery({
    queryKey: ['unit-transaction-item-details-data', id, params],
    queryFn: () => purchaseService.getUnitTransactionItemDetailsData(id, params),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};
