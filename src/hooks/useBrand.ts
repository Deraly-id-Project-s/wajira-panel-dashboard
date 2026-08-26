import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BrandDetail, BrandPayload } from '@/types/brand.types';
import type { PaginationParams } from '@/types/pagination.types';
import { createBrand, deleteBrand, getBrandById, getBrands, updateBrand } from '@/services/brand.service';

export const brandKeys = {
  all: ['brands'] as const,
  lists: () => [...brandKeys.all, 'list'] as const,
  list: (params: any) => [...brandKeys.lists(), params] as const,
  details: () => [...brandKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...brandKeys.details(), id] as const,
};

export const useBrands = (params?: PaginationParams & { search?: string; enabled?: boolean }) => {
  const { enabled = true, ...rest } = params ?? {};

  return useQuery({
    queryKey: brandKeys.list(rest),
    queryFn: () => getBrands(rest),
    placeholderData: (previous) => previous,
    enabled,
  });
};

export const useBrand = (id: string | number | undefined) =>
  useQuery<BrandDetail>({
    queryKey: brandKeys.detail(id!),
    queryFn: () => getBrandById(id!),
    enabled: !!id,
    retry: false,
  });

export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BrandPayload) => createBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: BrandPayload }) => updateBrand(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all });
    },
  });
};
