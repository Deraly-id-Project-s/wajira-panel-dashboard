import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getTaxes, createTax, updateTax, deleteTax, type Tax } from '@/services/tax.service';
import { TaxTable } from '@/components/features/settings/tax/TaxTable';
import { TaxForm } from '@/components/features/settings/tax/TaxForm';
import { SearchPagination } from '@/components/ui/search-pagination';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import Head from 'next/head';
import { useQueryParamsTable } from '@/hooks/useQueryParamsTable';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

export default function TaxPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const queryClient = useQueryClient();

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

  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('master-data:create');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['taxes', page, perPage, search],
    queryFn: () => getTaxes(page, perPage, search),
  });

  const createMutation = useMutation({
    mutationFn: createTax,
    onSuccess: () => {
      toast.success('Berhasil menambahkan pajak baru');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal menambahkan pajak');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { code: string; name: string } }) => updateTax(id, data),
    onSuccess: () => {
      toast.success('Berhasil mengubah data pajak');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal mengubah pajak');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTax,
    onSuccess: () => {
      toast.success('Berhasil menghapus data pajak');
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Gagal menghapus pajak');
    },
  });

  const handleAdd = () => {
    setSelectedTax(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (tax: Tax) => {
    setSelectedTax(tax);
    setIsFormOpen(true);
  };

  const handleDelete = (tax: Tax) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pajak ${tax.name}?`)) {
      deleteMutation.mutate(tax.id);
    }
  };

  const handleViewDetail = (tax: Tax) => {
    router.push(`/dashboard/${slug}/master/tax/${tax.id}/detail`);
  };


  const handleSubmit = (values: { code: string; name: string }) => {
    if (selectedTax) {
      updateMutation.mutate({ id: selectedTax.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <>
      <Head>
        <title>Data Pajak | Wajira</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Data Pajak"
            subtitle="Kelola master data pajak dan versinya"
          />

          <SearchPagination
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Cari pajak"
            searchAriaLabel="Cari pajak"
            page={page}
            perPage={perPage}
            total={data?.data?.total}
            lastPage={data?.data?.last_page}
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
                    Tambah Data
                  </Button>
                )}
              </>
            }
          >
            <TaxTable
              data={data?.data?.data || []}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetail={handleViewDetail}
            />
          </SearchPagination>
        </div>

        <TaxForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={selectedTax}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </DashboardLayout>
    </>
  );
}
