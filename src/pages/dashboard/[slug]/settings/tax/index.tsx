import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getTaxes, createTax, updateTax, deleteTax, type Tax } from '@/services/tax.service';
import { TaxTable } from '@/components/features/settings/tax/TaxTable';
import { TaxForm } from '@/components/features/settings/tax/TaxForm';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Head from 'next/head';

export default function TaxPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);


  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | undefined>();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['taxes', page, perPage, debouncedSearch],
    queryFn: () => getTaxes(page, perPage, debouncedSearch),
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
    router.push(`/dashboard/${slug}/settings/tax/${tax.id}/detail`);
  };

  const handleViewVersion = (tax: Tax) => {
    router.push(`/dashboard/${slug}/settings/tax/${tax.id}`);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Data Pajak</h1>
              <p className="text-sm text-muted-foreground">Kelola master data pajak dan versinya</p>
            </div>
          </div>

          <TaxTable
            data={data?.data?.data || []}
            meta={data?.data ? {
              currentPage: data.data.current_page,
              lastPage: data.data.last_page,
              perPage: data.data.per_page,
              total: data.data.total,
            } : undefined}
            isLoading={isLoading}
            search={searchInput}
            page={page}
            perPage={perPage}
            onSearchChange={setSearchInput}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetail={handleViewDetail}
            onViewVersion={handleViewVersion}
          />
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
