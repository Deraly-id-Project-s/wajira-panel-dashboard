import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getTaxDetail, type TaxVersion } from '@/services/tax.service';
import { getTaxVersions, createTaxVersion, updateTaxVersion, deleteTaxVersion } from '@/services/taxVersion.service';
import { TaxVersionTable } from '@/components/features/settings/tax-version/TaxVersionTable';
import { TaxVersionForm, TaxVersionFormValues } from '@/components/features/settings/tax-version/TaxVersionForm';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Lock, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { SearchPagination } from '@/components/ui/search-pagination';

export default function TaxDetailPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const taxId = Number(router.query.id);
  const queryClient = useQueryClient();

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');
  const canEdit = hasPermission('master-data:edit');
  const canDelete = hasPermission('master-data:delete');

  const { page, perPage, search, updateQuery, setPage, setPerPage, setSearch } = useQueryParamsTable({ defaultPerPage: 25 });
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchInput.trim()) {
        setSearch(searchInput.trim());
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search, setSearch]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<TaxVersion | undefined>();

  const { data: taxData, isLoading: isTaxLoading } = useQuery({
    queryKey: ['tax', taxId],
    queryFn: () => getTaxDetail(taxId),
    enabled: !!taxId,
  });

  const { data: taxVersionsData, isLoading: isVersionsLoading } = useQuery({
    queryKey: ['tax-versions', taxId, page, perPage, search],
    queryFn: () => getTaxVersions(page, perPage, search, taxId),
    enabled: !!taxId,
  });

  const tax = taxData?.data;

  const createMutation = useMutation({
    mutationFn: createTaxVersion,
    onSuccess: () => {
      toast.success('Berhasil menambahkan versi pajak baru');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tax-versions', taxId] });
      queryClient.invalidateQueries({ queryKey: ['tax', taxId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal menambahkan versi pajak');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateTaxVersion(id, data),
    onSuccess: () => {
      toast.success('Berhasil mengubah data versi pajak');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tax-versions', taxId] });
      queryClient.invalidateQueries({ queryKey: ['tax', taxId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal mengubah versi pajak');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaxVersion,
    onSuccess: () => {
      toast.success('Berhasil menghapus data versi pajak');
      queryClient.invalidateQueries({ queryKey: ['tax-versions', taxId] });
      queryClient.invalidateQueries({ queryKey: ['tax', taxId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal menghapus versi pajak');
    },
  });

  const handleAdd = () => {
    setSelectedVersion(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (version: TaxVersion) => {
    setSelectedVersion(version);
    setIsFormOpen(true);
  };

  const handleDelete = (version: TaxVersion) => {
    if (confirm(`Apakah Anda yakin ingin menghapus versi pajak ${version.name}?`)) {
      deleteMutation.mutate(version.id);
    }
  };

  const handleSubmit = (values: TaxVersionFormValues) => {
    const payload = { ...values, tax_id: taxId };
    if (selectedVersion) {
      updateMutation.mutate({ id: selectedVersion.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <Head>
        <title>Detail Pajak | Wajira</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: 'Data Pajak', onClick: () => router.push(`/dashboard/${slug}/master/tax`) },
              { label: 'Detail' }
            ]}
            title="Detail Pajak"
            subtitle="Lihat detail informasi pajak dan riwayat versinya"
            onBack={() => router.push(`/dashboard/${slug}/master/tax`)}
          />

          <Card className="border-0 shadow-sm rounded-md">
            <CardHeader className="border-b px-6 py-4">
              <CardTitle className="text-base font-semibold">Informasi Pajak</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isTaxLoading || !tax ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Kode Pajak</p>
                    <p className="text-base font-semibold text-slate-900">{tax.code}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Nama Pajak</p>
                    <p className="text-base text-slate-900">{tax.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Status Kunci</p>
                    {tax.is_lock === 1 || tax.is_lock === true ? (
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none gap-1">
                        <Lock className="h-3.5 w-3.5" />
                        Terkunci
                      </Badge>
                    ) : (
                      <span className="text-base text-slate-900">-</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Jumlah Versi Pajak</p>
                    <p className="text-base text-slate-900">{tax?.tax_version_count ?? 0} Versi</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Daftar Versi Pajak</h2>
              <p className="text-sm text-muted-foreground">Kelola riwayat nilai/rate pajak untuk {tax?.name || 'pajak ini'}</p>
            </div>

            <SearchPagination
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              searchPlaceholder="Cari versi pajak..."
              searchAriaLabel="Cari versi pajak"
              page={page}
              perPage={perPage}
              total={taxVersionsData?.data?.total}
              lastPage={taxVersionsData?.data?.last_page}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              actions={
                <>
                  {search && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchInput('');
                        updateQuery({ search: undefined, page: 1 });
                      }}
                      className="rounded-md border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 text-xs px-3"
                    >
                      Reset
                    </Button>
                  )}
                  {canCreate && (
                    <Button onClick={handleAdd} className="btn-primary!">
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Versi
                    </Button>
                  )}
                </>
              }
            >
              <TaxVersionTable
                data={taxVersionsData?.data?.data || []}
                isLoading={isVersionsLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            </SearchPagination>
          </div>
        </div>

        <TaxVersionForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={selectedVersion}
          baseTaxId={taxId}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </DashboardLayout>
    </>
  );
}
