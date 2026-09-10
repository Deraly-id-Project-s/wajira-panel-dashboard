import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApplyExpeditionClaimPayload,
  DoEkspedisiItemDestinationListParams,
  DoEkspedisiItemDestinationPayload,
  DoEkspedisiItemListParams,
  DoEkspedisiItemPayload,
  DoEkspedisiListParams,
  DoEkspedisiPayload,
  DoEkspedisiDocumentationListParams,
  DoEkspedisiClaimPayload,
  DoEkspedisiClaimDocumentationPayload,
} from '@/@types/do-ekspedisi.types';
import type { PaginationParams } from '@/@types/pagination.types';
import {
  createDoEkspedisi,
  applyExpeditionClaim,
  createDoDetailResource,
  createDoEkspedisiItem,
  createDoEkspedisiItemDestination,
  deleteDoEkspedisi,
  deleteDoEkspedisiItem,
  deleteDoEkspedisiItemDestination,
  deleteDoDetailResource,
  getDoEkspedisiById,
  getAvailableExpeditionClaims,
  getDoEkspedisiItemById,
  getDoEkspedisiItemDestinationById,
  getDoEkspedisiItemDestinations,
  getDoEkspedisiItems,
  getDoEkspedisis,
  getNextDoEkspedisiCode,
  lookupDoEkspedisiCustomers,
  lookupDoEkspedisiDrivers,
  lookupDoEkspedisiVehicles,
  updateDoEkspedisi,
  updateDoExpeditionStatus,
  updateDoEkspedisiItem,
  updateDoEkspedisiItemDestination,
  updateDoDetailResource,
  getDoEkspedisiDocumentations,
  getExpeditionClaimById,
  createExpeditionClaim,
  updateExpeditionClaim,
  createExpeditionClaimDocumentation,
  type DetailResource,
} from '@/services/do-ekspedisi.service';

export function useDoEkspedisis(params: PaginationParams & DoEkspedisiListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['do-ekspedisi', rest],
    queryFn: () => getDoEkspedisis(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useDoEkspedisiDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['do-ekspedisi', 'detail', id],
    queryFn: () => getDoEkspedisiById(id as string | number),
    enabled: !!id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useExpeditionClaimDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['expedition-claim', 'detail', id],
    queryFn: () => getExpeditionClaimById(id as string | number),
    enabled: !!id,
    retry: false,
  });
}

export function useNextDoEkspedisiCode(enabled = true) {
  return useQuery({
    queryKey: ['do-ekspedisi', 'next-code'],
    queryFn: getNextDoEkspedisiCode,
    enabled,
    staleTime: 10_000,
  });
}

export function useDoEkspedisiItems(params: PaginationParams & DoEkspedisiItemListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['do-ekspedisi-item', rest],
    queryFn: () => getDoEkspedisiItems(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useDoEkspedisiItemDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['do-ekspedisi-item', 'detail', id],
    queryFn: () => getDoEkspedisiItemById(id as string | number),
    enabled: !!id,
    retry: false,
  });
}

export function useDoEkspedisiItemDestinations(params: PaginationParams & DoEkspedisiItemDestinationListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['do-ekspedisi-item-destination', rest],
    queryFn: () => getDoEkspedisiItemDestinations(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useDoEkspedisiDocumentations(params: PaginationParams & DoEkspedisiDocumentationListParams & { enabled?: boolean }) {
  const { enabled = true, ...rest } = params;

  return useQuery({
    queryKey: ['do-ekspedisi-documentation', rest],
    queryFn: () => getDoEkspedisiDocumentations(rest),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useDoEkspedisiItemDestinationDetail(id: string | number | null) {
  return useQuery({
    queryKey: ['do-ekspedisi-item-destination', 'detail', id],
    queryFn: () => getDoEkspedisiItemDestinationById(id as string | number),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateDoEkspedisi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DoEkspedisiPayload) => createDoEkspedisi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
    },
  });
}

export function useUpdateDoEkspedisi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DoEkspedisiPayload }) => updateDoEkspedisi(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', variables.id] });
    },
  });
}

export function useDeleteDoEkspedisi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteDoEkspedisi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
    },
  });
}

export function useCreateDoEkspedisiItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DoEkspedisiItemPayload) => createDoEkspedisiItem(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(variables.do_expedition_id)] });
    },
  });
}

export function useUpdateDoEkspedisiItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DoEkspedisiItemPayload }) => updateDoEkspedisiItem(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(variables.payload.do_expedition_id)] });
    },
  });
}

export function useCreateDoEkspedisiItemDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DoEkspedisiItemDestinationPayload) => createDoEkspedisiItemDestination(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item-destination'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item', 'detail', String(variables.do_expedition_item_id)] });
    },
  });
}

export function useUpdateDoEkspedisiItemDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DoEkspedisiItemDestinationPayload }) => updateDoEkspedisiItemDestination(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item-destination'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item-destination', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item', 'detail', String(variables.payload.do_expedition_item_id)] });
    },
  });
}

export function useDeleteDoEkspedisiItemDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string | number; doExpeditionItemId: string | number }) => deleteDoEkspedisiItemDestination(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item-destination'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item', 'detail', String(variables.doExpeditionItemId)] });
    },
  });
}

export function useDeleteDoEkspedisiItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string | number; doExpeditionId: string | number }) => deleteDoEkspedisiItem(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi-item'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(variables.doExpeditionId)] });
    },
  });
}

export function useDoEkspedisiCustomerLookup(search: string, enabled = true) {
  return useQuery({
    queryKey: ['do-ekspedisi', 'lookup', 'customer', search],
    queryFn: () => lookupDoEkspedisiCustomers(search),
    enabled,
    staleTime: 30_000,
  });
}

export function useDoEkspedisiVehicleLookup(search: string, enabled = true) {
  return useQuery({
    queryKey: ['do-ekspedisi', 'lookup', 'vehicle', search],
    queryFn: () => lookupDoEkspedisiVehicles(search),
    enabled,
    staleTime: 30_000,
  });
}

export function useDoEkspedisiDriverLookup(search: string, enabled = true) {
  return useQuery({
    queryKey: ['do-ekspedisi', 'lookup', 'driver', search],
    queryFn: () => lookupDoEkspedisiDrivers(search),
    enabled,
    staleTime: 30_000,
  });
}

export function useDoDetailResourceMutation(resource: DetailResource, expeditionId: string | number) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(expeditionId)] });
  return {
    create: useMutation({ mutationFn: (payload: Record<string, unknown> | FormData) => createDoDetailResource(resource, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, payload }: { id: string | number; payload: Record<string, unknown> | FormData }) => updateDoDetailResource(resource, id, payload), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string | number) => deleteDoDetailResource(resource, id), onSuccess: invalidate }),
  };
}

export function useCreateExpeditionClaim(expeditionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DoEkspedisiClaimPayload) => createExpeditionClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(expeditionId)] });
      queryClient.invalidateQueries({ queryKey: ['expedition-claim'] });
    },
  });
}

export function useUpdateExpeditionClaim(expeditionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DoEkspedisiClaimPayload }) => updateExpeditionClaim(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(expeditionId)] });
      queryClient.invalidateQueries({ queryKey: ['expedition-claim'] });
      queryClient.invalidateQueries({ queryKey: ['expedition-claim', 'detail', variables.id] });
    },
  });
}

export function useCreateExpeditionClaimDocumentation(expeditionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DoEkspedisiClaimDocumentationPayload) => createExpeditionClaimDocumentation(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(expeditionId)] });
      queryClient.invalidateQueries({ queryKey: ['expedition-claim'] });
      queryClient.invalidateQueries({ queryKey: ['expedition-claim', 'detail', String(variables.do_expedition_claim_id)] });
    },
  });
}

export function useAvailableExpeditionClaims(driverId: number | null, enabled = true) {
  return useQuery({
    queryKey: ['expedition-claim', 'available', driverId],
    queryFn: () => getAvailableExpeditionClaims(driverId as number),
    enabled: enabled && Boolean(driverId),
  });
}

export function useApplyExpeditionClaim(expeditionId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApplyExpeditionClaimPayload) => applyExpeditionClaim(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(expeditionId)] });
      queryClient.invalidateQueries({ queryKey: ['expedition-claim', 'available', payload.driver_id] });
    },
  });
}

export function useUpdateDoExpeditionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: string }) => updateDoExpeditionStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi'] });
      queryClient.invalidateQueries({ queryKey: ['do-ekspedisi', 'detail', String(variables.id)] });
    },
  });
}
