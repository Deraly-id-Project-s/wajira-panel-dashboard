import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTypeUnits, getTypeUnitById, getTypeUnitDetail, createTypeUnit, updateTypeUnit, deleteTypeUnit, importTypeUnit } from '@/services/type-unit.service';
import { TypeUnitPayload } from '@/types/type-unit.types';

const TYPE_UNIT_LIST_KEY = 'type-units';
const TYPE_UNIT_ITEM_KEY = 'type-unit';

export function useTypeUnits(params?: {
  in_stock?: boolean | string;
  company_id?: number | string;
  sort_by?: string;
  sort_order?: string;
}) {
  return useQuery({
    queryKey: [TYPE_UNIT_LIST_KEY, params],
    queryFn: () => getTypeUnits(params),
    placeholderData: keepPreviousData,
  });
}

export function useTypeUnit(id: string | number, options?: { companyId?: number | string }) {
  return useQuery({
    queryKey: [TYPE_UNIT_ITEM_KEY, id, options?.companyId ?? ''],
    queryFn: () => getTypeUnitById(id, options),
    enabled: !!id,
  });
}

export function useTypeUnitDetail(id: string | number, params?: {
  company_id?: number | string;
  in_stock?: boolean | string;
  color?: string;
  machine_number?: string;
  chassis_number?: string;
  sort_by?: string;
  sort_dir?: string;
  per_page?: number | string;
  page?: number | string;
}) {
  return useQuery({
    queryKey: ['type-unit-detail', id, params],
    queryFn: () => getTypeUnitDetail(id, params),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });
}

export function useCreateTypeUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TypeUnitPayload) => createTypeUnit(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TYPE_UNIT_LIST_KEY] });
    },
  });
}

export function useUpdateTypeUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: TypeUnitPayload }) => updateTypeUnit(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [TYPE_UNIT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [TYPE_UNIT_ITEM_KEY, variables.id] });
    },
  });
}

export function useDeleteTypeUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteTypeUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TYPE_UNIT_LIST_KEY] });
    },
  });
}

export function useImportTypeUnit(companyId?: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file }: { file: File }) => importTypeUnit(file, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TYPE_UNIT_LIST_KEY] });
    },
  });
}
