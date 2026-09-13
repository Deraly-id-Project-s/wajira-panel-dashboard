import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateOrderListPayload,
  CreateOrderListTarifPayload,
  CreateOrderListTarifItemPayload,
  OrderListListParams,
  OrderListTarifItemListParams,
  OrderListTarifListParams,
  UpdateOrderListTarifItemPayload,
  UpdateOrderListPayload,
  UpdateOrderListTarifPayload,
  UpdateOrderListStatePayload,
} from '@/@types/order-list.types';
import {
  createOrderList,
  createOrderListTarif,
  createOrderListTarifItem,
  deleteOrderList,
  deleteOrderListTarif,
  deleteOrderListTarifItem,
  getOrderListById,
  getOrderListTarifById,
  getOrderListTarifItemById,
  getOrderListTarifItems,
  getOrderListTarifs,
  getOrderLists,
  updateOrderList,
  updateOrderListTarif,
  updateOrderListTarifItem,
  updateOrderListState,
  processOrderListInvoice,
} from '@/services/order-list.service';

export function useOrderLists(params: OrderListListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['order-list', 'list', rest],
    queryFn: () => getOrderLists(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useOrderListDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['order-list', 'detail', id],
    queryFn: () => getOrderListById(id as string | number),
    enabled: !!id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useOrderListTarifs(params: OrderListTarifListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['order-list-tarif', 'list', rest],
    queryFn: () => getOrderListTarifs(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useOrderListTarifDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['order-list-tarif', 'detail', id],
    queryFn: () => getOrderListTarifById(id as string | number),
    enabled: !!id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOrderListTarifItems(params: OrderListTarifItemListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['order-list-tarif-item', 'list', rest],
    queryFn: () => getOrderListTarifItems(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useOrderListTarifItemDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['order-list-tarif-item', 'detail', id],
    queryFn: () => getOrderListTarifItemById(id as string | number),
    enabled: !!id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateOrderList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderListPayload) => createOrderList(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
    },
  });
}

export function useUpdateOrderList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateOrderListPayload }) => updateOrderList(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
      queryClient.invalidateQueries({ queryKey: ['order-list', 'detail', variables.id] });
    },
  });
}

export function useUpdateOrderListState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateOrderListStatePayload }) => updateOrderListState(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
      queryClient.invalidateQueries({ queryKey: ['order-list', 'detail', variables.id] });
    },
  });
}

export function useProcessOrderListInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => processOrderListInvoice(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
      queryClient.invalidateQueries({ queryKey: ['order-list', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['do-invoice'] });
    },
  });
}

export function useDeleteOrderList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteOrderList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
    },
  });
}

export function useCreateOrderListTarif() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderListTarifPayload) => createOrderListTarif(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif'] });
      queryClient.invalidateQueries({ queryKey: ['order-list', 'detail', variables.do_orderlist_id] });
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
    },
  });
}

export function useUpdateOrderListTarif() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateOrderListTarifPayload }) => updateOrderListTarif(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif'] });
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
    },
  });
}

export function useDeleteOrderListTarif() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string | number; orderListId?: string | number }) => deleteOrderListTarif(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif'] });
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif-item'] });
      if (variables.orderListId != null) {
        queryClient.invalidateQueries({ queryKey: ['order-list', 'detail', variables.orderListId] });
      }
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
    },
  });
}

export function useCreateOrderListTarifItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderListTarifItemPayload) => createOrderListTarifItem(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif-item'] });
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif', 'detail', variables.do_order_list_tarif_id] });
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
    },
  });
}

export function useUpdateOrderListTarifItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: UpdateOrderListTarifItemPayload }) => updateOrderListTarifItem(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif-item'] });
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif-item', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
    },
  });
}

export function useDeleteOrderListTarifItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string | number; orderListTarifId?: string | number }) => deleteOrderListTarifItem(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif-item'] });
      if (variables.orderListTarifId != null) {
        queryClient.invalidateQueries({ queryKey: ['order-list-tarif', 'detail', variables.orderListTarifId] });
      }
      queryClient.invalidateQueries({ queryKey: ['order-list-tarif'] });
      queryClient.invalidateQueries({ queryKey: ['order-list'] });
    },
  });
}
