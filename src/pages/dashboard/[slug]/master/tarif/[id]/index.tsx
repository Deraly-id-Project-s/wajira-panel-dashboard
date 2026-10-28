import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Plus, MapPin, ExternalLink, ArrowRight, Route as RouteIcon, Info } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchPagination } from '@/components/ui/search-pagination';
import { LoadingState } from '@/components/ui/loading-state';
import { useTarifDetail } from '@/hooks/useTarif';
import { useCreateTarifPriceVersion, useDeleteTarifPriceVersion, useTarifPriceVersions, useUpdateTarifPriceVersion } from '@/hooks/useTarifPriceVersion';
import { TarifPriceVersionTable } from '@/components/features/tarif/TarifPriceVersionTable';
import { TarifPriceVersionForm } from '@/components/features/tarif/TarifPriceVersionForm';
import { TarifRouteLeafletMap } from '@/components/features/tarif/TarifRouteLeafletMap';
import type { TarifPriceVersion, TarifPriceVersionFormValues } from '@/@types/tarif-price-version.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { toast } from 'sonner';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { cn } from '@/lib/utils';
import { CopyBox } from '@/components/ui/copy-box';

export default function TarifDetailPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const tarifId = typeof id === 'string' ? id : '';
  const { data: tarif, isLoading, isError } = useTarifDetail(tarifId);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<TarifPriceVersion | undefined>();

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const versions = useTarifPriceVersions(tarifId, { page, per_page: perPage, search: debouncedSearch || undefined });
  const createMutation = useCreateTarifPriceVersion();
  const updateMutation = useUpdateTarifPriceVersion();
  const deleteMutation = useDeleteTarifPriceVersion(tarifId);

  const handleSubmit = (values: TarifPriceVersionFormValues) => {
    const payload = { ...values, tarif_id: Number(tarifId) };
    const options = {
      onSuccess: () => {
        toast.success(selected ? 'Versi tarif berhasil diubah' : 'Versi tarif berhasil ditambahkan');
        setFormOpen(false);
      },
      onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Gagal menyimpan versi tarif'),
    };
    if (selected) updateMutation.mutate({ id: selected.id, data: payload }, options);
    else createMutation.mutate(payload, options);
  };

  const handleDelete = (version: TarifPriceVersion) => {
    if (!window.confirm(`Hapus versi tarif "${version.name}"?`)) return;
    deleteMutation.mutate(version.id, {
      onSuccess: () => toast.success('Versi tarif berhasil dihapus'),
      onError: (error: any) => toast.error(error?.response?.data?.message || 'Gagal menghapus versi tarif'),
    });
  };

  if (isLoading) return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  if (isError || !tarif) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-red-500">Gagal memuat detail tarif</div>
      </DashboardLayout>
    );
  }

  const routes = tarif.routes || [];
  const routeTitle =
    routes.length > 0
      ? routes.map((r) => r.name).join(' ➔ ')
      : [tarif.loadingIn, tarif.loadingOut].filter(Boolean).join(' ➔ ') || '-';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Detail Data Tarif dan Route"
          subtitle={
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-800">{routeTitle}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">Jarak {tarif.distance} KM</span>
              <Badge
                variant="outline"
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs',
                  tarif.isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600',
                )}
              >
                {tarif.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          }
          breadcrumbs={[
            { label: 'Master Data Tarif', onClick: () => router.push(`/dashboard/${slug}/master/tarif`) },
            { label: 'Detail Data Tarif dan Route' },
          ]}
          onBack={() => router.push(`/dashboard/${slug}/master/tarif`)}
        />

        {/* Ringkasan Uang Jalan & Invoice */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">UJ Towing Saat Ini</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{currenciesFormat('idr', tarif.ujTowing)}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">UJ CDD Saat Ini</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{currenciesFormat('idr', tarif.ujCdd)}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">UJ Fuso Saat Ini</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{currenciesFormat('idr', tarif.ujFuso)}</p>
            </div>
          </div>

          {(tarif.invTowing || tarif.invCdd || tarif.invFuso) ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3.5">
                <p className="text-xs font-medium text-slate-500">Tagihan Inv. Towing</p>
                <p className="mt-1 text-base font-semibold text-slate-800">{currenciesFormat('idr', tarif.invTowing)}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3.5">
                <p className="text-xs font-medium text-slate-500">Tagihan Inv. CDD</p>
                <p className="mt-1 text-base font-semibold text-slate-800">{currenciesFormat('idr', tarif.invCdd)}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3.5">
                <p className="text-xs font-medium text-slate-500">Tagihan Inv. Fuso</p>
                <p className="mt-1 text-base font-semibold text-slate-800">{currenciesFormat('idr', tarif.invFuso)}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Informasi Relasi Route & Visualisasi Peta Leaflet */}
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RouteIcon className="h-5 w-5 text-orange-600" />
              Informasi Relasi Rute Logistik
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Daftar titik rute pengiriman dan visualisasi koordinat menggunakan Leaflet maps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daftar Titik Rute Berurutan */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                Urutan Titik Perjalanan ({routes.length} Titik)
              </h3>

              {routes.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  Belum ada data relasi titik rute pada tarif ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {routes.map((routeItem, index) => {
                    const order = routeItem.pivot?.order ?? index + 1;
                    const stateAt = routeItem.pivot?.state_at || (index === 0 ? 'loading_in' : 'loading_out');
                    const isOrigin = stateAt === 'loading_in';
                    const isDestination = stateAt === 'loading_out';
                    const coordString = routeItem.coordinat || (routeItem as any).coordinate || null;

                    return (
                      <div
                        key={routeItem.id || index}
                        className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 transition-all hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs',
                                isOrigin
                                  ? 'bg-blue-600 text-white'
                                  : isDestination
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-amber-600 text-white',
                              )}
                            >
                              {order}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-slate-900 text-sm">{routeItem.name}</h4>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                    isOrigin
                                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                                      : isDestination
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      : 'border-amber-200 bg-amber-50 text-amber-700',
                                  )}
                                >
                                  {isOrigin ? 'Loading In (Asal)' : isDestination ? 'Loading Out (Tujuan)' : 'Transit'}
                                </Badge>
                              </div>

                              {routeItem.address ? (
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {routeItem.address}
                                </p>
                              ) : null}

                              {routeItem.other_information ? (
                                <p className="text-xs text-slate-500 mt-0.5 italic">
                                  Info: {routeItem.other_information}
                                </p>
                              ) : null}

                              {coordString ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-orange-600 shrink-0" />
                                    Koordinat:
                                  </span>
                                  <CopyBox text={coordString} />
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 mt-1 inline-block">
                                  Koordinat belum diset
                                </span>
                              )}
                            </div>
                          </div>

                          {routeItem.link ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1 text-xs shrink-0"
                              asChild
                            >
                              <a href={routeItem.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Maps
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visualisasi Peta Leaflet */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                Visualisasi Jalur Rute pada Peta
              </h3>
              <TarifRouteLeafletMap routes={routes} className="h-[360px]" />
              <p className="text-[11px] text-slate-500 leading-normal">
                Peta menghubungkan titik rute secara berurutan sesuai rute logistik yang tercatat. Marker bernomor menunjukkan tahapan urutan perjalanan.
              </p>
            </div>
          </div>
        </div>

        {/* Riwayat Versi Tarif */}
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="mb-4 border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">Riwayat Versi Tarif</h2>
            <p className="text-sm text-slate-500">Kelola riwayat perubahan harga UJ Towing, UJ CDD, dan UJ Fuso.</p>
          </div>
          <SearchPagination
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari riwayat versi tarif..."
            searchAriaLabel="Cari versi tarif"
            page={page}
            perPage={perPage}
            total={versions.data?.total ?? 0}
            lastPage={versions.data?.last_page ?? 1}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            actions={
              canCreate && (
                <Button
                  onClick={() => {
                    setSelected(undefined);
                    setFormOpen(true);
                  }}
                  className="btn-primary!"
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Versi
                </Button>
              )
            }
          >
            <TarifPriceVersionTable
              data={versions.data?.data || []}
              isLoading={versions.isLoading}
              onEdit={(version) => {
                setSelected(version);
                setFormOpen(true);
              }}
              onDelete={handleDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </SearchPagination>
        </div>
      </div>
      <TarifPriceVersionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={selected}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </DashboardLayout>
  );
}
