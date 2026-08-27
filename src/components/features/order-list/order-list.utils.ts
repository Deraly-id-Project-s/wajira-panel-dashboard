import type { OrderList, OrderListStatus, OrderListTarifItem, OrderListVehicleType } from '@/@types/order-list.types';
import { formatCurrency } from '@/lib/utils/currency';

export const ORDER_LIST_STATUS_OPTIONS: Array<{ value: OrderListStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'deliver', label: 'Deliver' },
  { value: 'process', label: 'Process' },
  { value: 'done', label: 'Done' },
  { value: 'reject', label: 'Reject' },
];

export const ORDER_LIST_EDIT_STATUS_OPTIONS: Array<{ value: OrderListStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'deliver', label: 'Deliver' },
  { value: 'process', label: 'Process' },
  { value: 'done', label: 'Done' },
];

export const ORDER_LIST_VEHICLE_OPTIONS: Array<{ value: OrderListVehicleType; label: string }> = [
  { value: 'towing', label: 'Towing' },
  { value: 'cdd', label: 'CDD' },
  { value: 'fuso', label: 'Fuso' },
];

export const getVehicleTypeLabel = (value?: OrderListVehicleType | null) =>
  ORDER_LIST_VEHICLE_OPTIONS.find((option) => option.value === value)?.label ?? '-';

export const getOrderVehicleTypeLabel = (order: OrderList, item?: OrderListTarifItem) => {
  const tarifType = getVehicleTypeLabel(item?.vehicleType);
  if (tarifType !== '-') return tarifType;

  const routeTypes = Array.from(
    new Set(order.tarifs.map((route) => getVehicleTypeLabel(route.vehicleType)).filter((type) => type !== '-')),
  );
  if (routeTypes.length) return routeTypes.join(', ');

  const orderType = getVehicleTypeLabel(order.vehicleType);
  if (orderType !== '-') return orderType;

  const vehicleTypes = Array.from(
    new Set(order.vehicles.map((vehicle) => vehicle.type).filter((type): type is string => Boolean(type))),
  );
  return vehicleTypes.length ? vehicleTypes.join(', ') : '-';
};

export const getOrderStatusLabel = (status?: OrderListStatus | null) =>
  ORDER_LIST_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? '-';

export const getOrderStatusBadgeClassName = (status?: OrderListStatus | null) => {
  switch (status) {
    case 'draft':
      return 'border-slate-200 bg-slate-50 text-slate-700';
    case 'deliver':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'process':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'done':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'reject':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

export const getPrimaryTarifItem = (order: OrderList): OrderListTarifItem | undefined => order.tarifs[0];

export const formatOrderCurrency = (value?: number | null) => formatCurrency(Number(value ?? 0));

export const summarizeTarifCargoItems = (items: Array<{ loadContent: string; qty: number }>) => {
  const normalizedItems = items
    .map((item) => ({
      loadContent: String(item.loadContent ?? '').trim(),
      qty: Number(item.qty ?? 0),
    }))
    .filter((item) => item.loadContent || item.qty > 0);

  return {
    qty: normalizedItems.reduce((sum, item) => sum + item.qty, 0),
    loadContent: Array.from(new Set(normalizedItems.map((item) => item.loadContent).filter(Boolean))).join(', '),
  };
};
