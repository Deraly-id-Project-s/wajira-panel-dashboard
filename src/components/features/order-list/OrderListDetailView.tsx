import * as React from 'react';
import {
  ArrowRight,
  CalendarDays,
  CircleUserRound,
  ClipboardList,
  Copy,
  FileText,
  MapPin,
  Package,
  Route,
  Truck,
  UserRound,
  Wallet,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import BaseTable from '@/components/ui/base-table';

import type { OrderList, OrderListStatus, OrderListTarifItem, OrderListVehicleType } from '@/@types/order-list.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { ReferenceLink } from '@/components/ui/reference-link';
import RequiredMark from '@/components/ui/required-mark';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormDialog } from '@/components/ui/form-dialog';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Hooks
import {
  useCreateOrderListTarif,
  useUpdateOrderListTarif,
  useDeleteOrderListTarif,
  useCreateOrderListTarifItem,
  useUpdateOrderListTarifItem,
  useDeleteOrderListTarifItem,
} from '@/hooks/useOrderList';
import { useTarifs } from '@/hooks/useTarif';
import { useDrivers } from '@/hooks/useDriver';
import { useVehicleFleetLookups } from '@/hooks/useVehicleFleetLookups';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import {
  formatOrderCurrency,
  getOrderStatusBadgeClassName,
  getOrderStatusLabel,
  getOrderVehicleTypeLabel,
  ORDER_LIST_STATUS_OPTIONS,
  ORDER_LIST_VEHICLE_OPTIONS,
} from './order-list.utils';

const routeSchema = z.object({
  tarifId: z.string().min(1, 'Tarif wajib dipilih'),
  vehicleType: z.enum(['towing', 'cdd', 'fuso']),
  deliveryDestination: z.string().trim().min(1, 'Tujuan kirim wajib diisi'),
  vehicleId: z.string().min(1, 'Kendaraan wajib dipilih'),
  driverId: z.string().min(1, 'Driver wajib dipilih'),
});

type RouteFormValues = z.infer<typeof routeSchema>;

const cargoSchema = z.object({
  loadContent: z.string().trim().min(1, 'Nama muatan wajib diisi'),
  qty: z.coerce.number().int('Qty harus berupa bilangan bulat').min(1, 'Qty minimal 1'),
});

type CargoFormValues = z.infer<typeof cargoSchema>;

interface OrderListDetailViewProps {
  data: OrderList;
  onBack: () => void;
  onUpdateStatus?: (status: OrderListStatus) => void;
  canUpdateStatus?: boolean;
  isUpdatingStatus?: boolean;
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex min-w-0 items-start gap-2 text-sm font-semibold text-slate-950">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : null}
        <div className="min-w-0 break-words">{value || '-'}</div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}

function getRouteInvoice(route: OrderListTarifItem) {
  if (route.expeditionInvoice != null) return Number(route.expeditionInvoice);
  if (route.vehicleType === 'towing') return Number(route.tarif?.invTowing ?? 0);
  if (route.vehicleType === 'cdd') return Number(route.tarif?.invCdd ?? 0);
  return Number(route.tarif?.invFuso ?? 0);
}

function getRouteDriverFee(route: OrderListTarifItem) {
  if (route.driverFee != null) return Number(route.driverFee);
  if (route.vehicleType === 'towing') return Number(route.tarif?.ujTowing ?? 0);
  if (route.vehicleType === 'cdd') return Number(route.tarif?.ujCdd ?? 0);
  return Number(route.tarif?.ujFuso ?? 0);
}

function CurrencyRow({ label, value, emphasized = false }: { label: string; value?: number | null; emphasized?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 text-sm', emphasized && 'border-t border-orange-200 pt-3')}>
      <span className={emphasized ? 'font-semibold text-slate-900' : 'text-slate-500'}>{label}</span>
      <span className={cn('font-semibold text-slate-900', emphasized && 'text-base text-orange-700')}>
        {formatOrderCurrency(value)}
      </span>
    </div>
  );
}

function CargoList({
  route,
  isDraft,
  onEditCargo,
  onDeleteCargo,
}: {
  route: OrderListTarifItem;
  isDraft: boolean;
  onEditCargo?: (route: OrderListTarifItem, cargoItem: any) => void;
  onDeleteCargo?: (route: OrderListTarifItem, cargoItem: any) => void;
}) {
  const items = route.tarifItems?.length
    ? route.tarifItems
    : route.loadContent
      ? [{
        id: route.id,
        uuid: undefined,
        loadContent: route.loadContent,
        qty: Number(route.qty ?? 0),
        isFallback: true,
      }]
      : [];

  const columns = React.useMemo(() => {
    const cols = [
      {
        header: 'No',
        alignment: 'center' as const,
        headerClassName: 'w-[60px] text-slate-500 font-semibold text-center',
        cell: (_item: any, index: number) => (
          <span className="text-slate-400">{index + 1}</span>
        ),
      },
      {
        header: 'Nama Muatan',
        alignment: 'left' as const,
        headerClassName: 'text-slate-500 font-semibold',
        cell: (item: any) => (
          <span className="font-medium text-slate-900 break-words">{item.loadContent || '-'}</span>
        ),
      },
      {
        header: 'Qty',
        alignment: 'right' as const,
        headerClassName: 'text-slate-500 font-semibold text-right',
        cell: (item: any) => (
          <span className="font-semibold text-slate-900">{Number(item.qty ?? 0).toLocaleString('id-ID')} PCS</span>
        ),
      },
    ];

    if (isDraft) {
      cols.push({
        header: 'Aksi',
        alignment: 'center' as const,
        headerClassName: 'w-[100px] text-slate-500 font-semibold text-center',
        cell: (item: any) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!!item.isFallback}
              onClick={() => onEditCargo?.(route, item)}
              className="h-7 w-7 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Edit className="h-4.5 w-4.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!!item.isFallback}
              onClick={() => onDeleteCargo?.(route, item)}
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </Button>
          </div>
        ),
      });
    }

    return cols;
  }, [isDraft, route, onEditCargo, onDeleteCargo]);

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        Belum ada item muatan pada rute ini.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <BaseTable
        data={items}
        columns={columns}
        headerRowClassName="bg-orange-100"
        containerClassName="border-0 shadow-none rounded-none"
      />
    </div>
  );
}

export function OrderListDetailView({
  data,
  onBack,
  onUpdateStatus,
  canUpdateStatus = false,
  isUpdatingStatus = false,
}: OrderListDetailViewProps) {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { companyId } = useCompany();
  const isDraft = data.status === 'draft';

  // Search states for selects
  const [tarifSearch, setTarifSearch] = React.useState('');
  const [vehicleSearch, setVehicleSearch] = React.useState('');
  const [driverSearch, setDriverSearch] = React.useState('');

  const debouncedTarifSearch = useDebouncedValue(tarifSearch, 350);
  const debouncedVehicleSearch = useDebouncedValue(vehicleSearch, 350);
  const debouncedDriverSearch = useDebouncedValue(driverSearch, 350);

  // Queries
  const tarifQuery = useTarifs({
    page: 1,
    perPage: 100,
    search: debouncedTarifSearch,
    enabled: isDraft,
  });

  const fusoQuery = useVehicleFleetLookups({ page: 1, perPage: 100, search: debouncedVehicleSearch, company_id: companyId ?? '', type: 'fuso', enabled: isDraft });
  const cddQuery = useVehicleFleetLookups({ page: 1, perPage: 100, search: debouncedVehicleSearch, company_id: companyId ?? '', type: 'cdd', enabled: isDraft });
  const towingQuery = useVehicleFleetLookups({ page: 1, perPage: 100, search: debouncedVehicleSearch, company_id: companyId ?? '', type: 'towing', enabled: isDraft });

  const driverQuery = useDrivers({
    page: 1,
    perPage: 100,
    search: debouncedDriverSearch,
    company_id: companyId ?? undefined,
    enabled: isDraft,
  });

  const tarifOptions = React.useMemo(() => {
    const records = tarifQuery.data?.data ?? [];
    return records.map((item) => ({
      value: String(item.id),
      label: `${item.loadingIn || '-'} - ${item.loadingOut || '-'}`,
      subtitle: item.customer?.name,
    }));
  }, [tarifQuery.data?.data]);

  const toVehicleOptions = React.useCallback((records: any[]) =>
    records.map((item) => ({ value: String(item.id), label: item.registrationNumber, subtitle: item.type.toUpperCase() })), []);

  const vehicleOptions = React.useMemo(() => ({
    fuso: toVehicleOptions(fusoQuery.data?.data ?? []),
    cdd: toVehicleOptions(cddQuery.data?.data ?? []),
    towing: toVehicleOptions(towingQuery.data?.data ?? []),
  }), [cddQuery.data?.data, fusoQuery.data?.data, towingQuery.data?.data, toVehicleOptions]);

  const driverOptions = React.useMemo(() =>
    (driverQuery.data?.data ?? []).map((item) => ({ value: String(item.id), label: item.name, subtitle: item.code })),
    [driverQuery.data?.data]);

  // Modal / dialog states
  const [selectedRoute, setSelectedRoute] = React.useState<OrderListTarifItem | null>(null);
  const [selectedCargo, setSelectedCargo] = React.useState<{ route: OrderListTarifItem; item: any } | null>(null);

  const [isRouteOpen, setIsRouteOpen] = React.useState(false);
  const [isCargoOpen, setIsCargoOpen] = React.useState(false);

  const [deleteRouteTarget, setDeleteRouteTarget] = React.useState<OrderListTarifItem | null>(null);
  const [deleteCargoTarget, setDeleteCargoTarget] = React.useState<{ route: OrderListTarifItem; item: any } | null>(null);

  const routeForm = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      tarifId: '',
      vehicleType: 'fuso',
      deliveryDestination: '',
      vehicleId: '',
      driverId: '',
    },
  });

  const cargoForm = useForm<CargoFormValues>({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      loadContent: '',
      qty: 1,
    },
  });

  const watchedVehicleType = routeForm.watch('vehicleType') ?? 'fuso';

  // Merging options for edit mode
  const mergedTarifOptions = React.useMemo(() => {
    if (!selectedRoute?.tarif) return tarifOptions;
    const hasCurrent = tarifOptions.some((o) => o.value === String(selectedRoute.tarifId));
    if (hasCurrent) return tarifOptions;
    return [
      {
        value: String(selectedRoute.tarifId),
        label: `${selectedRoute.tarif.loadingIn || '-'} - ${selectedRoute.tarif.loadingOut || '-'}`,
        subtitle: selectedRoute.tarif.customer?.name,
      },
      ...tarifOptions,
    ];
  }, [tarifOptions, selectedRoute]);

  const mergedVehicleOptions = React.useMemo(() => {
    const currentList = vehicleOptions[watchedVehicleType] || [];
    if (!selectedRoute?.vehicle || selectedRoute.vehicleType !== watchedVehicleType) return currentList;
    const hasCurrent = currentList.some((o) => o.value === String(selectedRoute.vehicleId));
    if (hasCurrent) return currentList;
    return [
      {
        value: String(selectedRoute.vehicleId),
        label: selectedRoute.vehicle.registrationNumber,
        subtitle: selectedRoute.vehicle.type?.toUpperCase(),
      },
      ...currentList,
    ];
  }, [vehicleOptions, watchedVehicleType, selectedRoute]);

  const mergedDriverOptions = React.useMemo(() => {
    if (!selectedRoute?.driver) return driverOptions;
    const hasCurrent = driverOptions.some((o) => o.value === String(selectedRoute.driverId));
    if (hasCurrent) return driverOptions;
    return [
      {
        value: String(selectedRoute.driverId),
        label: selectedRoute.driver.name,
        subtitle: selectedRoute.driver.code,
      },
      ...driverOptions,
    ];
  }, [driverOptions, selectedRoute]);

  // Mutations
  const createRouteMutation = useCreateOrderListTarif();
  const updateRouteMutation = useUpdateOrderListTarif();
  const deleteRouteMutation = useDeleteOrderListTarif();

  const createCargoMutation = useCreateOrderListTarifItem();
  const updateCargoMutation = useUpdateOrderListTarifItem();
  const deleteCargoMutation = useDeleteOrderListTarifItem();

  const handleOpenAddRoute = () => {
    setSelectedRoute(null);
    routeForm.reset({
      tarifId: '',
      vehicleType: 'fuso',
      deliveryDestination: '',
      vehicleId: '',
      driverId: '',
    });
    setIsRouteOpen(true);
  };

  const handleOpenEditRoute = (route: OrderListTarifItem) => {
    setSelectedRoute(route);
    routeForm.reset({
      tarifId: String(route.tarifId ?? ''),
      vehicleType: (route.vehicleType as any) ?? 'fuso',
      deliveryDestination: route.deliveryDestination ?? '',
      vehicleId: String(route.vehicleId ?? ''),
      driverId: String(route.driverId ?? ''),
    });
    setIsRouteOpen(true);
  };

  const handleOpenAddCargo = (route: OrderListTarifItem) => {
    setSelectedCargo({ route, item: null });
    cargoForm.reset({
      loadContent: '',
      qty: 1,
    });
    setIsCargoOpen(true);
  };

  const handleOpenEditCargo = (route: OrderListTarifItem, cargoItem: any) => {
    setSelectedCargo({ route, item: cargoItem });
    cargoForm.reset({
      loadContent: cargoItem.loadContent ?? '',
      qty: Number(cargoItem.qty ?? 1),
    });
    setIsCargoOpen(true);
  };

  const handleOpenDeleteCargo = (route: OrderListTarifItem, cargoItem: any) => {
    setDeleteCargoTarget({ route, item: cargoItem });
  };

  const handleRouteSubmit = async (values: RouteFormValues) => {
    try {
      if (selectedRoute) {
        await updateRouteMutation.mutateAsync({
          id: selectedRoute.id,
          payload: {
            delivery_destination: values.deliveryDestination,
            tarif_id: Number(values.tarifId),
            vehicle_type: values.vehicleType,
            vehicle_id: Number(values.vehicleId),
            driver_id: Number(values.driverId),
          },
        });
        toast.success('Rute berhasil diperbarui');
      } else {
        await createRouteMutation.mutateAsync({
          do_orderlist_id: Number(data.id),
          tarif_id: Number(values.tarifId),
          vehicle_type: values.vehicleType,
          delivery_destination: values.deliveryDestination,
          vehicle_id: Number(values.vehicleId),
          driver_id: Number(values.driverId),
        });
        toast.success('Rute berhasil ditambahkan');
      }
      setIsRouteOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan rute');
    }
  };

  const handleCargoSubmit = async (values: CargoFormValues) => {
    if (!selectedCargo) return;
    try {
      if (selectedCargo.item) {
        await updateCargoMutation.mutateAsync({
          id: selectedCargo.item.id,
          payload: {
            do_order_list_tarif_id: selectedCargo.route.id,
            load_content: values.loadContent,
            qty: Number(values.qty),
          },
        });
        toast.success('Muatan berhasil diperbarui');
      } else {
        await createCargoMutation.mutateAsync({
          do_order_list_tarif_id: selectedCargo.route.id,
          load_content: values.loadContent,
          qty: Number(values.qty),
        });
        toast.success('Muatan berhasil ditambahkan');
      }
      setIsCargoOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan muatan');
    }
  };

  const handleConfirmDeleteRoute = async () => {
    if (!deleteRouteTarget) return;
    try {
      await deleteRouteMutation.mutateAsync({
        id: deleteRouteTarget.id,
        orderListId: data.id,
      });
      toast.success('Rute berhasil dihapus');
      setDeleteRouteTarget(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus rute');
    }
  };

  const handleConfirmDeleteCargo = async () => {
    if (!deleteCargoTarget) return;
    try {
      await deleteCargoMutation.mutateAsync({
        id: deleteCargoTarget.item.id,
        orderListTarifId: deleteCargoTarget.route.id,
      });
      toast.success('Muatan berhasil dihapus');
      setDeleteCargoTarget(null);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus muatan');
    }
  };

  const routes = data.tarifs ?? [];
  const expeditions = Array.isArray(data.expeditions) ? data.expeditions : [];
  const totalCargo = routes.reduce(
    (total, route) => total + (route.tarifItems ?? []).reduce((sum, item) => sum + Number(item.qty ?? 0), 0),
    0,
  );
  const totalDistance = routes.reduce((total, route) => total + Number(route.tarif?.distance ?? 0), 0);
  const totalBilling = Number(data.billInvoice ?? 0) + Number(data.ppn ?? 0) - Number(data.pph ?? 0);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        breadcrumbs={[{ label: 'Order List', onClick: onBack }, { label: 'Detail Order' }]}
        title="Detail Order List"
        onBack={onBack}
        subtitle={(
          <div className="flex flex-wrap items-center gap-2">
            Kode Order :
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(data.code)}
              className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700"
            >
              {data.code}
              <Copy className="h-3.5 w-3.5" />
            </button>
            <Badge variant="outline" className={cn('rounded-full px-3 py-1', getOrderStatusBadgeClassName(data.status))}>
              {getOrderStatusLabel(data.status)}
            </Badge>
            <span className="text-xs text-slate-500">Dibuat {formatDate(data.createdAt, true)}</span>
          </div>
        )}
        actions={
          canUpdateStatus ? (
            data.status === 'draft' ? (
              <Button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => onUpdateStatus?.('deliver')}
                className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px] cursor-pointer"
              >
                {isUpdatingStatus ? 'Memproses...' : 'Proses Order List'}
              </Button>
            ) : data.status === 'deliver' ? (
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingStatus}
                onClick={() => onUpdateStatus?.('draft')}
                className="min-w-[120px] border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {isUpdatingStatus ? 'Memproses...' : 'Jadikan Draft'}
              </Button>
            ) : undefined
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Rute', value: routes.length.toLocaleString('id-ID'), suffix: ' rute', icon: Route },
          { label: 'Total Muatan', value: totalCargo.toLocaleString('id-ID'), suffix: ' PCS', icon: Package },
          { label: 'Total Jarak', value: totalDistance.toLocaleString('id-ID'), suffix: ' KM', icon: MapPin },
          { label: 'Total UJ Driver', value: formatOrderCurrency(data.ujDriver), suffix: '', icon: Wallet },
        ].map((item) => (
          <Card key={item.label} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-orange-100 p-3 text-orange-700"><item.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-1 font-bold text-slate-950">
                  {item.value}<span className="ml-1 text-xs font-semibold text-slate-500">{item.suffix}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <SectionHeading icon={FileText} title="Informasi Order" description="Informasi customer dan rangkuman tujuan pengiriman" />
          <div className="grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Customer"
              value={
                data.customer?.name ? (
                  <ReferenceLink href={`/dashboard/${slug}/master/customer?search=${data.customer.name}`}>
                    {data.customer.name}
                  </ReferenceLink>
                ) : (
                  '-'
                )
              }
              icon={CircleUserRound}
            />
            <Field label="Kode Customer" value={data.customer?.code || '-'} icon={ClipboardList} />
            <Field label="Tipe Armada" value={getOrderVehicleTypeLabel(data)} icon={Truck} />
            <Field label="DO Ekspedisi" value={`${expeditions.length} data`} icon={FileText} />
          </div>
          <div className="grid gap-5 rounded-xl bg-orange-50 p-4 md:grid-cols-3">
            <Field label="Lokasi Muat" value={data.loadingIn || '-'} icon={MapPin} />
            <Field label="Lokasi Bongkar" value={data.loadingOut || '-'} icon={MapPin} />
            <Field label="Tujuan Pengiriman" value={data.deliveryDestination || '-'} icon={MapPin} />
          </div>
          {data.note && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Catatan / Keterangan</p>
              <p className="text-sm font-semibold text-slate-950">{data.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading icon={Route} title="Rute, Armada & Muatan" description="Data berasal dari setiap DO order list tarif" />
            {isDraft && (
              <Button
                type="button"
                onClick={handleOpenAddRoute}
                className="bg-[#1f3b5b] hover:bg-[#19314b] text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm text-sm"
              >
                <Plus className="h-4 w-4" />
                Tambah Rute
              </Button>
            )}
          </div>

          {routes.length ? (
            <div className="space-y-5">
              {routes.map((route, index) => {
                const tarif = route.tarif;
                const cargoCount = route.tarifItems?.length ?? (route.loadContent ? 1 : 0);

                return (
                  <div key={route.uuid || route.id || index} className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="flex flex-col gap-3 border-b border-orange-200 bg-orange-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-300 text-sm font-bold text-orange-950">{index + 1}</span>
                        <div>
                          <p className="font-semibold text-slate-950">{tarif?.loadingIn || route.loadingIn || '-'} <ArrowRight className="inline h-4 w-4" /> {tarif?.loadingOut || route.loadingOut || '-'}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Tarif #{route.tarifId} · Rute #{route.id} · {cargoCount} jenis muatan</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="w-fit rounded-full border-orange-200 bg-orange-100 text-orange-800">
                          {getOrderVehicleTypeLabel(data, route)}
                        </Badge>
                        {isDraft && (
                          <div className="flex items-center gap-1.5 ml-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditRoute(route)}
                              className="h-8 px-2.5 text-xs font-medium border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg"
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteRouteTarget(route)}
                              className="h-8 px-2.5 text-xs font-medium border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 rounded-lg"
                            >
                              Hapus
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-5 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Jarak" value={`${Number(tarif?.distance ?? 0).toLocaleString('id-ID')} KM`} icon={Route} />
                      <Field
                        label="Kendaraan"
                        value={
                          route.vehicle?.registrationNumber ? (
                            <ReferenceLink href={`/dashboard/${slug}/master/vehicle?search=${route.vehicle.registrationNumber}`}>
                              {route.vehicle.registrationNumber}
                            </ReferenceLink>
                          ) : route.vehicleId ? (
                            `ID ${route.vehicleId}`
                          ) : (
                            '-'
                          )
                        }
                        icon={Truck}
                      />
                      <Field
                        label="Driver"
                        value={
                          route.driver?.name ? (
                            <ReferenceLink href={`/dashboard/${slug}/master/driver?search=${route.driver.name}`}>
                              {route.driver.name}
                            </ReferenceLink>
                          ) : route.driverId ? (
                            `ID ${route.driverId}`
                          ) : (
                            '-'
                          )
                        }
                        icon={UserRound}
                      />
                      <Field label="Dibuat" value={formatDate(route.createdAt)} icon={CalendarDays} />
                    </div>

                    <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Daftar Muatan</p>
                          {isDraft && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAddCargo(route)}
                              className="h-7 px-2 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                              Tambah Muatan
                            </Button>
                          )}
                        </div>
                        <CargoList
                          route={route}
                          isDraft={isDraft}
                          onEditCargo={handleOpenEditCargo}
                          onDeleteCargo={handleOpenDeleteCargo}
                        />
                      </div>
                      <div className="space-y-3 rounded-lg bg-orange-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rincian Tarif</p>
                        <CurrencyRow label="UJ Driver" value={getRouteDriverFee(route)} />
                        <CurrencyRow label="Invoice" value={getRouteInvoice(route)} />
                        <div className="border-t border-orange-200 pt-3">
                          <p className="text-xs text-slate-500">Tujuan Pengiriman</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{route.deliveryDestination || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
              Belum ada data rute dan tarif pada order ini.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionHeading icon={Wallet} title="Ringkasan Keuangan" description="Nilai agregat dari DO order list" />
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <CurrencyRow label="Invoice Ekspedisi" value={data.billInvoice} />
            <CurrencyRow label="PPN" value={data.ppn} />
            <CurrencyRow label="PPh" value={data.pph} />
            <CurrencyRow label="Total Tagihan" value={totalBilling} emphasized />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <SectionHeading icon={Truck} title="Ringkasan Biaya per Armada" description="Nilai agregat yang dikirim oleh API detail order list" />
          <div className="grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-3">
            {[
              { label: 'Towing', uj: data.ujTowing, invoice: data.invTowing },
              { label: 'CDD', uj: data.ujCdd, invoice: data.invCdd },
              { label: 'Fuso', uj: data.ujFuso, invoice: data.invFuso },
            ].map((item) => (
              <div key={item.label} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-sm font-bold uppercase text-slate-900">{item.label}</p>
                <CurrencyRow label="UJ Driver" value={item.uj} />
                <CurrencyRow label="Invoice" value={item.invoice} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── dialog forms ── */}
      {isDraft && (
        <>
          {/* Route Form Dialog */}
          <Form {...routeForm}>
            <FormDialog
              open={isRouteOpen}
              onOpenChange={setIsRouteOpen}
              title={selectedRoute ? 'Edit Rute / Tarif' : 'Tambah Rute / Tarif'}
              description="Masukkan informasi rute, armada, dan pengemudi"
              onSubmit={routeForm.handleSubmit(handleRouteSubmit)}
              isSubmitting={createRouteMutation.isPending || updateRouteMutation.isPending}
            >
              <FormField
                control={routeForm.control}
                name="tarifId"
                render={({ field }) => (
                  <FormItem className="flex flex-col relative">
                    <FormLabel className="text-sm font-medium">Pilih Rute / Tarif<RequiredMark /></FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={mergedTarifOptions}
                        placeholder="Pilih tarif"
                        searchPlaceholder="Cari tarif..."
                        loading={tarifQuery.isLoading}
                        onSearchChange={setTarifSearch}
                        className="bg-transparent"
                      />
                    </FormControl>
                    <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0" />
                  </FormItem>
                )}
              />

              <FormField
                control={routeForm.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem className="flex flex-col relative">
                    <FormLabel className="text-sm font-medium">Tipe Armada<RequiredMark /></FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-transparent">
                          <SelectValue placeholder="Pilih armada" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fuso">Fuso</SelectItem>
                          <SelectItem value="cdd">CDD</SelectItem>
                          <SelectItem value="towing">Towing</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0" />
                  </FormItem>
                )}
              />

              <FormField
                control={routeForm.control}
                name="deliveryDestination"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel className="text-sm font-medium">Tujuan Kirim<RequiredMark /></FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Nama PT / Alamat Detail" className="bg-transparent" {...field} />
                    </FormControl>
                    <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0" />
                  </FormItem>
                )}
              />

              <FormField
                control={routeForm.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem className="flex flex-col relative">
                    <FormLabel className="text-sm font-medium">Kendaraan<RequiredMark /></FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={mergedVehicleOptions}
                        placeholder="Pilih kendaraan"
                        searchPlaceholder="Cari nomor polisi..."
                        loading={fusoQuery.isLoading || cddQuery.isLoading || towingQuery.isLoading}
                        onSearchChange={setVehicleSearch}
                      />
                    </FormControl>
                    <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0" />
                  </FormItem>
                )}
              />

              <FormField
                control={routeForm.control}
                name="driverId"
                render={({ field }) => (
                  <FormItem className="flex flex-col relative">
                    <FormLabel className="text-sm font-medium">Driver<RequiredMark /></FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={mergedDriverOptions}
                        placeholder="Pilih driver"
                        searchPlaceholder="Cari driver..."
                        loading={driverQuery.isLoading}
                        onSearchChange={setDriverSearch}
                      />
                    </FormControl>
                    <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0" />
                  </FormItem>
                )}
              />
            </FormDialog>
          </Form>

          {/* Cargo Form Dialog */}
          <Form {...cargoForm}>
            <FormDialog
              open={isCargoOpen}
              onOpenChange={setIsCargoOpen}
              title={selectedCargo?.item ? 'Edit Muatan' : 'Tambah Muatan'}
              description="Masukkan nama muatan dan kuantitas"
              onSubmit={cargoForm.handleSubmit(handleCargoSubmit)}
              isSubmitting={createCargoMutation.isPending || updateCargoMutation.isPending}
            >
              <FormField
                control={cargoForm.control}
                name="loadContent"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel className="text-sm font-medium">Nama Muatan<RequiredMark /></FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Honda Vario" className="bg-transparent" {...field} />
                    </FormControl>
                    <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0" />
                  </FormItem>
                )}
              />

              <FormField
                control={cargoForm.control}
                name="qty"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel className="text-sm font-medium">Qty<RequiredMark /></FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="1" className="bg-transparent" {...field} />
                    </FormControl>
                    <FormMessage className="absolute bottom-0 text-[11px] leading-none mt-0" />
                  </FormItem>
                )}
              />
            </FormDialog>
          </Form>

          {/* Delete Route Confirmation Dialog */}
          <AlertDialog open={deleteRouteTarget !== null} onOpenChange={(open) => !open && setDeleteRouteTarget(null)}>
            <AlertDialogContent className="rounded-xl border-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Hapus Rute</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus rute <strong>{deleteRouteTarget?.tarif?.loadingIn || deleteRouteTarget?.loadingIn || '-'} ke {deleteRouteTarget?.tarif?.loadingOut || deleteRouteTarget?.loadingOut || '-'}</strong> dari order list ini?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-md">Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDeleteRoute}
                  disabled={deleteRouteMutation.isPending}
                  className="rounded-md bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  {deleteRouteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Rute'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Cargo Confirmation Dialog */}
          <AlertDialog open={deleteCargoTarget !== null} onOpenChange={(open) => !open && setDeleteCargoTarget(null)}>
            <AlertDialogContent className="rounded-xl border-slate-200">
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Hapus Muatan</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus muatan <strong>{deleteCargoTarget?.item?.loadContent}</strong> dari rute ini?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-md">Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDeleteCargo}
                  disabled={deleteCargoMutation.isPending}
                  className="rounded-md bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  {deleteCargoMutation.isPending ? 'Menghapus...' : 'Ya, Hapus Muatan'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
