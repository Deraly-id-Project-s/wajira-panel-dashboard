import type { TypeUnit, TypeUnitListResponse, TypeUnitPayload, UnitBrand } from '@/types/type-unit.types';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError, LaravelApiResponse, ensureSuccess } from '@/lib/api/response';

interface TypeUnitApiModel {
  id: number;
  uuid?: string;
  brand_id: number;
  code: string;
  name: string;
  capacity?: number | null;
  image?: string | null;
  unit_type?: string | null;
  unit_model?: string | null;
  netto_weight?: number | string | null;
  bruto_weight?: number | string | null;
  buy_price?: number | string | null;
  sell_price?: number | string | null;
  available_stock?: number | string | null;
  created_at?: string;
  updated_at?: string;
  brand?: {
    id: number;
    uuid?: string;
    name: string;
    image?: string | null;
    created_at?: string;
    updated_at?: string;
  } | null;
}

type TypeUnitListApiResponse = LaravelApiResponse<
  | TypeUnitApiModel[]
  | TypeUnitApiModel
  | {
      data: TypeUnitApiModel[];
      current_page?: number;
      perPage?: number;
      total?: number;
      last_page?: number;
    }
>;
type TypeUnitItemResponse = LaravelApiResponse<TypeUnitApiModel>;
type DeleteResponse = LaravelApiResponse<null>;

const basePath = '/wapi/master-data/unit-type';

const mapBrand = (brand?: TypeUnitApiModel['brand']): UnitBrand | null => {
  if (!brand) return null;
  return {
    id: brand.id,
    uuid: brand.uuid,
    name: brand.name,
    image: brand.image ?? null,
    createdAt: brand.created_at,
    updatedAt: brand.updated_at,
  };
};

const mapTypeUnit = (payload: TypeUnitApiModel): TypeUnit => ({
  id: payload.id,
  uuid: payload.uuid,
  // Some endpoints only return the nested brand without brand_id; fallback to brand.id so the form can prefill correctly
  brandId: payload.brand_id ?? payload.brand?.id ?? 0,
  code: payload.code,
  name: payload.name,
  capacity: payload.capacity ?? null,
  image: payload.image ?? null,
  unitType: payload.unit_type ?? null,
  unitModel: payload.unit_model ?? null,
  nettoWeight: payload.netto_weight === undefined || payload.netto_weight === null ? null : Number(payload.netto_weight),
  brutoWeight: payload.bruto_weight === undefined || payload.bruto_weight === null ? null : Number(payload.bruto_weight),
  buyPrice: payload.buy_price === undefined || payload.buy_price === null ? null : Number(payload.buy_price),
  sellPrice: payload.sell_price === undefined || payload.sell_price === null ? null : Number(payload.sell_price),
  availableStock: payload.available_stock === undefined || payload.available_stock === null ? null : Number(payload.available_stock),
  createdAt: payload.created_at,
  updatedAt: payload.updated_at,
  brand: mapBrand(payload.brand),
});

const normalizeList = (
  data: TypeUnitApiModel[] | TypeUnitApiModel | { data: TypeUnitApiModel[]; current_page?: number; perPage?: number; total?: number; last_page?: number },
): { list: TypeUnitApiModel[]; meta?: { current_page?: number; perPage?: number; total?: number; last_page?: number } } => {
  const walk = (input: any): { list: TypeUnitApiModel[]; meta?: { current_page?: number; perPage?: number; total?: number; last_page?: number } } => {
    if (!input) return { list: [] };

    if (Array.isArray(input)) {
      return { list: input as TypeUnitApiModel[] };
    }

    if (typeof input === 'object') {
      if (Array.isArray(input.data)) {
        return {
          list: input.data as TypeUnitApiModel[],
          meta: {
            current_page: input.current_page,
            perPage: input.perPage,
            total: input.total,
            last_page: input.last_page,
          },
        };
      }

      if (Array.isArray(input.items)) {
        return { list: input.items as TypeUnitApiModel[] };
      }

      if (input.data) {
        return walk(input.data);
      }
    }

    return { list: [input as TypeUnitApiModel] };
  };

  return walk(data);
};

export const getTypeUnits = async (params?: {
  in_stock?: boolean | string;
  company_id?: number | string;
  sort_by?: string;
  sort_order?: string;
}): Promise<TypeUnitListResponse> => {
  const response = await apiClient.get<TypeUnitListApiResponse>(basePath, {
    params: {
      sort_by: params?.sort_by || 'created_at',
      sort_order: params?.sort_order || 'desc',
      in_stock: params?.in_stock,
      company_id: params?.company_id,
    },
  });
  const data = ensureSuccess(response.data);
  const { list: rawList, meta } = normalizeList(data);
  const list = rawList.map(mapTypeUnit);
  return {
    data: list,
    meta: {
      currentPage: meta?.current_page ?? 1,
      perPage: meta?.perPage ?? (list.length || 1),
      total: meta?.total ?? list.length,
      lastPage: meta?.last_page ?? 1,
    },
  };
};

export const getTypeUnitById = async (id: number | string, options?: { companyId?: number | string }): Promise<TypeUnit> => {
  const response = await apiClient.get<TypeUnitItemResponse>(`${basePath}/${id}`, {
    params: {
      company_id: options?.companyId,
    },
  });
  const data = ensureSuccess(response.data);
  return mapTypeUnit(data);
};

export type TypeUnitDetailParams = {
  company_id?: number | string;
  in_stock?: boolean | string;
  color?: string;
  machine_number?: string;
  chassis_number?: string;
  sort_by?: string;
  sort_dir?: string;
  per_page?: number | string;
  page?: number | string;
};

export const getTypeUnitDetail = async (id: number | string, params?: TypeUnitDetailParams): Promise<any> => {
  const response = await apiClient.get<LaravelApiResponse<any>>(`${basePath}/${id}`, {
    params: {
      company_id: params?.company_id,
      in_stock: params?.in_stock,
      color: params?.color || undefined,
      machine_number: params?.machine_number || undefined,
      chassis_number: params?.chassis_number || undefined,
      sort_by: params?.sort_by || 'created_at',
      sort_dir: params?.sort_dir || 'asc',
      per_page: params?.per_page || 5,
      page: params?.page || 1,
    },
  });
  return ensureSuccess(response.data);
};

const buildPayload = (payload: TypeUnitPayload, opts?: { asUpdate?: boolean }) => {
  const body = new FormData();
  if (opts?.asUpdate) body.append('_method', 'PUT');

  body.append('code', payload.code);
  body.append('brand_id', String(payload.brandId));
  body.append('name', payload.name);

  if (payload.capacity !== undefined && payload.capacity !== null) body.append('capacity', String(payload.capacity));
  if (payload.unitType) body.append('unit_type', payload.unitType);
  if (payload.unitModel) body.append('unit_model', payload.unitModel);
  if (payload.brutoWeight !== undefined && payload.brutoWeight !== null) body.append('bruto_weight', String(payload.brutoWeight));
  if (payload.nettoWeight !== undefined && payload.nettoWeight !== null) body.append('netto_weight', String(payload.nettoWeight));
  
  if (opts?.asUpdate) {
    // Backend expects 'price' on Update (PUT)
    if (payload.sellPrice !== undefined && payload.sellPrice !== null) {
      body.append('price', String(payload.sellPrice));
    }
  }

  // Preserve 'buy_price' and 'sell_price' for create and as fallback for update
  if (payload.sellPrice !== undefined && payload.sellPrice !== null) body.append('sell_price', String(payload.sellPrice));
  if (payload.buyPrice !== undefined && payload.buyPrice !== null) body.append('buy_price', String(payload.buyPrice));
  if (payload.image) body.append('image', payload.image);

  return body;
};

export const createTypeUnit = async (payload: TypeUnitPayload): Promise<TypeUnit> => {
  const body = buildPayload(payload);
  const response = await apiClient.post<TypeUnitItemResponse>(basePath, body); // biarkan browser set boundary multipart
  const data = ensureSuccess(response.data);
  return mapTypeUnit(data);
};

export const updateTypeUnit = async (id: number | string, payload: TypeUnitPayload): Promise<TypeUnit> => {
  const body = buildPayload(payload, { asUpdate: true });
  const response = await apiClient.post<TypeUnitItemResponse>(`${basePath}/${id}`, body); // _method=PUT di body
  const data = ensureSuccess(response.data);
  return mapTypeUnit(data);
};

export const deleteTypeUnit = async (id: number | string): Promise<void> => {
  const response = await apiClient.delete<DeleteResponse>(`${basePath}/${id}`);
  const payload = response.data;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to delete type unit');
  }
};

export const importTypeUnit = async (file: File, companyId?: string | number): Promise<void> => {
  const body = new FormData();
  body.append('file', file);
  if (companyId) body.append('company_id', String(companyId));

  const response = await apiClient.post(`${basePath}/import`, body, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const payload = response.data as LaravelApiResponse<null>;
  if (!payload.status) {
    throw new ApiResponseError(payload.message ?? 'Failed to import type unit');
  }
};

