import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { useTarifDetail } from '@/hooks/useTarif';
import { useCreateTarifPriceVersion, useDeleteTarifPriceVersion, useTarifPriceVersions, useUpdateTarifPriceVersion } from '@/hooks/useTarifPriceVersion';
import { TarifPriceVersionTable } from '@/components/features/tarif/TarifPriceVersionTable';
import { TarifPriceVersionForm } from '@/components/features/tarif/TarifPriceVersionForm';
import type { TarifPriceVersion, TarifPriceVersionFormValues } from '@/types/tarif-price-version.types';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { toast } from 'sonner';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

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

  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 400); return () => window.clearTimeout(timer); }, [search]);
  const versions = useTarifPriceVersions(tarifId, { page, per_page: perPage, search: debouncedSearch || undefined });
  const createMutation = useCreateTarifPriceVersion();
  const updateMutation = useUpdateTarifPriceVersion();
  const deleteMutation = useDeleteTarifPriceVersion(tarifId);
  const handleSubmit = (values: TarifPriceVersionFormValues) => {
    const payload = { ...values, tarif_id: Number(tarifId) };
    const options = { onSuccess: () => { toast.success(selected ? 'Versi tarif berhasil diubah' : 'Versi tarif berhasil ditambahkan'); setFormOpen(false); }, onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Gagal menyimpan versi tarif') };
    if (selected) updateMutation.mutate({ id: selected.id, data: payload }, options);
    else createMutation.mutate(payload, options);
  };
  const handleDelete = (version: TarifPriceVersion) => { if (!window.confirm(`Hapus versi tarif "${version.name}"?`)) return; deleteMutation.mutate(version.id, { onSuccess: () => toast.success('Versi tarif berhasil dihapus'), onError: (error: any) => toast.error(error?.response?.data?.message || 'Gagal menghapus versi tarif') }); };
  if (isLoading) return <DashboardLayout><LoadingState variant="page" /></DashboardLayout>;
  if (isError || !tarif) return <DashboardLayout><div className="p-10 text-center text-red-500">Data tarif tidak ditemukan.</div></DashboardLayout>;
  return <DashboardLayout><div className="space-y-6"><PageHeader title="Versi Tarif" subtitle={`${tarif.loadingIn} - ${tarif.loadingOut} | Jarak ${tarif.distance} KM`} breadcrumbs={[{ label: 'Tarif', onClick: () => router.push(`/dashboard/${slug}/master/tarif`) }, { label: 'Versi Tarif' }]} onBack={() => router.push(`/dashboard/${slug}/master/tarif`)} /><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="rounded-md border bg-white p-4"><p className="text-xs text-slate-500">UJ Towing Saat Ini</p><p className="mt-2 text-lg font-semibold">{currenciesFormat('idr', tarif.ujTowing)}</p></div><div className="rounded-md border bg-white p-4"><p className="text-xs text-slate-500">UJ CDD Saat Ini</p><p className="mt-2 text-lg font-semibold">{currenciesFormat('idr', tarif.ujCdd)}</p></div><div className="rounded-md border bg-white p-4"><p className="text-xs text-slate-500">UJ Fuso Saat Ini</p><p className="mt-2 text-lg font-semibold">{currenciesFormat('idr', tarif.ujFuso)}</p></div></div><div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 border-b pb-4"><h2 className="text-lg font-bold text-slate-900">Riwayat Versi Tarif</h2><p className="text-sm text-slate-500">Kelola riwayat UJ Towing, UJ CDD, dan UJ Fuso.</p></div>
    <TarifPriceVersionTable data={versions.data?.data || []} meta={versions.data ? { currentPage: versions.data.current_page, perPage: versions.data.per_page, lastPage: versions.data.last_page, total: versions.data.total } : undefined} search={search} page={page} perPage={perPage} isLoading={versions.isLoading} onSearchChange={setSearch} onAdd={() => { setSelected(undefined); setFormOpen(true); }} onEdit={(version) => { setSelected(version); setFormOpen(true); }} onDelete={handleDelete} onPageChange={setPage} onPerPageChange={(value) => { setPerPage(value); setPage(1); }} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} /></div></div>
    <TarifPriceVersionForm open={formOpen} onOpenChange={setFormOpen} initialData={selected} onSubmit={handleSubmit} isSubmitting={createMutation.isPending || updateMutation.isPending} /></DashboardLayout>;
}
