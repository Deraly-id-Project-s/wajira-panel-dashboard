import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getTaxDetail, type TaxVersion } from '@/services/tax.service';
import { getTaxVersions, createTaxVersion, updateTaxVersion, deleteTaxVersion } from '@/services/taxVersion.service';
import { TaxVersionTable } from '@/components/features/settings/tax-version/TaxVersionTable';
import { TaxVersionForm, TaxVersionFormValues } from '@/components/features/settings/tax-version/TaxVersionForm';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TaxVersionPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const taxId = Number(router.query.id);
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
  const [selectedVersion, setSelectedVersion] = useState<TaxVersion | undefined>();

  const { data: taxData } = useQuery({
    queryKey: ['tax', taxId],
    queryFn: () => getTaxDetail(taxId),
    enabled: !!taxId,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['tax-versions', taxId, page, perPage, debouncedSearch],
    queryFn: () => getTaxVersions(page, perPage, debouncedSearch, taxId),
    enabled: !!taxId,
  });

  const createMutation = useMutation({
    mutationFn: createTaxVersion,
    onSuccess: () => {
      toast.success('Berhasil menambahkan versi pajak baru');
      setIsFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tax-versions', taxId] });
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

  const taxName = taxData?.data?.name || 'Loading...';

  return (
    <>
      <Head>
        <title>Versi Pajak - {taxName} | Wajira</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/dashboard/${slug}/settings/tax`)}
                className="h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">Versi Pajak: {taxName}</h1>
                <p className="text-sm text-muted-foreground">Kelola riwayat nilai/rate pajak untuk {taxName}</p>
              </div>
            </div>
          </div>

          <TaxVersionTable
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
          />
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
