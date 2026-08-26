import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, ChevronRight, Hash, Tag, Scale, Coins, ShieldCheck, Search, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTypeUnitDetail } from '@/hooks/useTypeUnit';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingState } from '@/components/ui/loading-state';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { CopyBox } from '@/components/ui/copy-box';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { cn } from '@/lib/utils';
import { ReferenceLink } from '@/components/ui/reference-link';
import {
  useUnitTypePriceVersions,
  useCreateUnitTypePriceVersion,
  useUpdateUnitTypePriceVersion,
  useDeleteUnitTypePriceVersion,
} from '@/hooks/useUnitTypePriceVersion';
import { UnitTypePriceVersionTable } from '@/components/features/type-unit/UnitTypePriceVersionTable';
import { UnitTypePriceVersionForm } from '@/components/features/type-unit/UnitTypePriceVersionForm';
import type { UnitTypePriceVersion, UnitTypePriceVersionFormValues } from '@/types/unit-type-price-version.types';
import { toast } from 'sonner';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const statusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  minor_damage: { label: 'Minor Damage', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
  major_damage: { label: 'Major Damage', className: 'border-red-200 bg-red-50 text-red-700 font-semibold' },
  returned: { label: 'Returned', className: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold' },
  refunded: { label: 'Refunded', className: 'border-orange-200 bg-orange-50 text-orange-700 font-semibold' },
  lost: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
  in_repair: { label: 'In Repair', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },
};

const renderStatus = (status: string) => {
  const config = statusConfig[status] ?? {
    label: status ? status.replace(/_/g, ' ') : '-',
    className: 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
  };

  return (
    <Badge variant="outline" className={cn('capitalize', config.className)}>
      {config.label}
    </Badge>
  );
};

export default function TypeUnitDetailPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  const { companyId } = useCompany();

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  // Search & Filter States
  const [filterColor, setFilterColor] = useState('');
  const [filterMachineNumber, setFilterMachineNumber] = useState('');
  const [filterChassisNumber, setFilterChassisNumber] = useState('');
  const [inStock, setInStock] = useState<string>('true');

  // Pagination & Sorting States
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('asc');

  // Fetch detail unit type info
  const queryParams = useMemo(() => ({
    company_id: companyId ?? 1,
    in_stock: inStock === 'all' ? undefined : inStock === 'true',
    color: filterColor || undefined,
    machine_number: filterMachineNumber || undefined,
    chassis_number: filterChassisNumber || undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
    per_page: perPage,
    page: page,
  }), [companyId, inStock, filterColor, filterMachineNumber, filterChassisNumber, sortBy, sortDir, perPage, page]);

  const { data: detailData, isLoading, isError } = useTypeUnitDetail(id as string, queryParams);
  const typeUnit = detailData;

  const stockItems = useMemo(() => {
    return typeUnit?.unit_item_details?.data ?? [];
  }, [typeUnit]);

  const totalItems = typeUnit?.unit_item_details?.total ?? 0;
  const lastPage = typeUnit?.unit_item_details?.last_page ?? 1;

  // Price Versioning States
  const [pricePage, setPricePage] = useState(1);
  const [pricePerPage, setPricePerPage] = useState(25);
  const [priceSearch, setPriceSearch] = useState('');
  const [debouncedPriceSearch, setDebouncedPriceSearch] = useState('');
  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [selectedPriceVersion, setSelectedPriceVersion] = useState<UnitTypePriceVersion | undefined>();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedPriceSearch(priceSearch.trim());
      setPricePage(1);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [priceSearch]);

  const { data: priceVersionsData, isLoading: isPriceLoading } = useUnitTypePriceVersions(id as string, {
    page: pricePage,
    per_page: pricePerPage,
    search: debouncedPriceSearch || undefined,
  });

  const createPriceMutation = useCreateUnitTypePriceVersion();
  const updatePriceMutation = useUpdateUnitTypePriceVersion();
  const deletePriceMutation = useDeleteUnitTypePriceVersion(id as string);

  const handleAddPrice = () => {
    setSelectedPriceVersion(undefined);
    setIsPriceFormOpen(true);
  };

  const handleEditPrice = (version: UnitTypePriceVersion) => {
    setSelectedPriceVersion(version);
    setIsPriceFormOpen(true);
  };

  const handleDeletePrice = (version: UnitTypePriceVersion) => {
    if (confirm(`Apakah Anda yakin ingin menghapus versi harga "${version.name}"?`)) {
      deletePriceMutation.mutate(version.id, {
        onSuccess: () => {
          toast.success('Berhasil menghapus versi harga');
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Gagal menghapus versi harga');
        }
      });
    }
  };

  const handlePriceSubmit = (values: UnitTypePriceVersionFormValues) => {
    const payload = {
      ...values,
      unit_type_id: Number(id),
    };

    if (selectedPriceVersion) {
      updatePriceMutation.mutate({
        id: selectedPriceVersion.id,
        data: payload
      }, {
        onSuccess: () => {
          toast.success('Berhasil mengubah versi harga');
          setIsPriceFormOpen(false);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Gagal mengubah versi harga');
        }
      });
    } else {
      createPriceMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Berhasil menambahkan versi harga baru');
          setIsPriceFormOpen(false);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Gagal menambahkan versi harga');
        }
      });
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/${slug}/master/type-unit`);
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      header: 'Nama Unit',
      alignment: 'left',
      cell: () => <ReferenceLink href={`${router.basePath}/dashboard/${slug}/master/type-unit?search=${typeUnit?.name}`}>
        {typeUnit?.name}
      </ReferenceLink>
    },
    {
      header: 'Warna',
      accessorKey: 'color',
      sortable: true,
      alignment: 'left',
    },
    {
      header: 'Nomor Mesin',
      accessorKey: 'machine_number',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.machine_number} />,
    },
    {
      header: 'Nomor Rangka',
      accessorKey: 'chassis_number',
      sortable: true,
      alignment: 'left',
      cell: (item) => <CopyBox text={item.chassis_number} />,
    },
    {
      header: 'Status Stok',
      alignment: 'center',
      cell: (item) => item?.in_stock ? (
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">Tersedia</Badge>
      ) : (
        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 font-semibold">Tidak Tersedia</Badge>
      ),
    },
    {
      header: 'Kondisi Stok',
      alignment: 'center',
      cell: (item) => renderStatus(item.status),
    },
  ], [typeUnit, router.basePath, slug]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <LoadingState variant="page" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !typeUnit) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600">Gagal memuat data tipe unit</h2>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Tipe Unit', onClick: handleBack },
            { label: 'Detail Tipe Unit' }
          ]}
          title={`Detail Tipe Unit: ${typeUnit.name}`}
          subtitle="Informasi spesifikasi lengkap beserta stok barang unit tipe"
          onBack={handleBack}
        />

        {/* SINGLE WIDE DETAILED CARD */}
        <Card className="rounded-md border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> Spesifikasi Unit Tipe
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kode Tipe</span>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <CopyBox text={typeUnit.code} />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Merek</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{typeUnit.brand?.name ?? '-'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Unit</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{typeUnit.unit_model ?? '-'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis Unit</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{typeUnit.unit_type ?? '-'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kapasitas</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{typeUnit.capacity ? `${typeUnit.capacity} CC` : '-'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Berat Netto / Bruto</span>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Scale className="h-4 w-4 text-slate-400" />
                  <span>{typeUnit.netto_weight ?? '-'} kg / {typeUnit.bruto_weight ?? '-'} kg</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Harga Beli</span>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Coins className="h-4 w-4 text-slate-400" />
                  <span>{typeUnit.buy_price ? currenciesFormat('idr', typeUnit.buy_price) : '-'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Harga Jual</span>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Coins className="h-4 w-4 text-slate-400" />
                  <span>{typeUnit.sell_price ? currenciesFormat('idr', typeUnit.sell_price) : '-'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok Tersedia (In Stock)</span>
                <div className="mt-1">
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 font-bold px-3 py-1">
                    {typeUnit.available_stock ?? 0} Unit
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stok Perkiraan (Forecast)</span>
                <div className="mt-1">
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-bold px-3 py-1">
                    {typeUnit.forecasted_stock ?? 0} Unit
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STOCK TABLE COMPONENT */}
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Daftar Unit Barang</h3>
              <p className="text-sm text-slate-500 text-muted-foreground">Status ketersediaan detail unit tipe</p>
            </div>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Warna</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={filterColor}
                  onChange={(e) => { setFilterColor(e.target.value); setPage(1); }}
                  placeholder="Cari warna..."
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Nomor Mesin</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={filterMachineNumber}
                  onChange={(e) => { setFilterMachineNumber(e.target.value); setPage(1); }}
                  placeholder="Cari nomor mesin..."
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Nomor Rangka</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={filterChassisNumber}
                  onChange={(e) => { setFilterChassisNumber(e.target.value); setPage(1); }}
                  placeholder="Cari nomor rangka..."
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Status Stok</span>
              <Select
                value={inStock}
                onValueChange={(val) => { setInStock(val); setPage(1); }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-300">
                  <SelectValue placeholder="Pilih ketersediaan" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">Semua Ketersediaan</SelectItem>
                  <SelectItem value="true">Tersedia (In Stock)</SelectItem>
                  <SelectItem value="false">Tidak Tersedia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <BaseTable
            data={stockItems}
            columns={columns}
            loading={isLoading}
            showLimitChange
            perPage={perPage}
            onPerPageChange={(val) => { setPerPage(val); setPage(1); }}
            meta={{
              currentPage: page,
              perPage: perPage,
              lastPage: lastPage,
              total: totalItems,
            }}
            onPageChange={setPage}
          />
        </div>

        {/* PRICE VERSIONING TABLE COMPONENT */}
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-slate-900">Riwayat Versi Harga</h3>
            <p className="text-sm text-slate-500 text-muted-foreground">Kelola riwayat harga beli & harga jual untuk tipe unit ini</p>
          </div>

          <UnitTypePriceVersionTable
            data={priceVersionsData?.data || []}
            meta={priceVersionsData ? {
              currentPage: priceVersionsData.current_page,
              lastPage: priceVersionsData.last_page,
              perPage: priceVersionsData.per_page,
              total: priceVersionsData.total,
            } : undefined}
            isLoading={isPriceLoading}
            search={priceSearch}
            page={pricePage}
            perPage={pricePerPage}
            onSearchChange={setPriceSearch}
            onPageChange={setPricePage}
            onPerPageChange={setPricePerPage}
            onAdd={handleAddPrice}
            onEdit={handleEditPrice}
            onDelete={handleDeletePrice}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      </div>

      <UnitTypePriceVersionForm
        open={isPriceFormOpen}
        onOpenChange={setIsPriceFormOpen}
        initialData={selectedPriceVersion}
        onSubmit={handlePriceSubmit}
        isSubmitting={createPriceMutation.isPending || updatePriceMutation.isPending}
      />
    </DashboardLayout>
  );
}
