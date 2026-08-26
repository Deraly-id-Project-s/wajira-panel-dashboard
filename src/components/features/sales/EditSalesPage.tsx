'use client';

import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useSalesDetail, useUpdateSales } from '@/hooks/useSales';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingState } from '@/components/ui/loading-state';
import { UnitTransactionHeaderForm, type UnitTransactionHeaderFormValues } from '@/components/features/unit-transaction/UnitTransactionHeaderForm';

export default function EditSalesPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const { itemId, id, slug: slugQuery } = router.query;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';
  const salesId = (itemId || id) as string;
  const { data, isLoading, isError } = useSalesDetail(salesId);
  const updateMutation = useUpdateSales();

  const invoiceCode = data?.raw?.code ?? '';
  const basePath = slug ? `/dashboard/${slug}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';

  useEffect(() => {
    if (!salesId || isLoading) return;

    if (isError || !data?.raw) {
      toast.error('Data penjualan tidak ditemukan');
      router.push(basePath);
    }
  }, [data?.raw, isError, isLoading, router, salesId, basePath]);

  const defaultValues = useMemo<Partial<UnitTransactionHeaderFormValues> | undefined>(() => {
    if (!data?.raw) return undefined;
    return {
      personId: data.raw.person_id ? String(data.raw.person_id) : data.raw.person?.id ? String(data.raw.person.id) : '',
      personName: data.raw.person?.name ?? '',
      date: data.raw.created_at ? data.raw.created_at.slice(0, 10) : '',
      personAddress: (data.raw as any).person?.address ?? '',
      personNpwp: (data.raw as any).person?.npwp ?? '',
      documentTemplateId: data.raw.document_template_id ?? null,
    };
  }, [data?.raw]);

  const handleSubmit = async (formValues: UnitTransactionHeaderFormValues) => {
    try {
      if (!salesId || !data?.raw) {
        toast.error('Data penjualan tidak ditemukan');
        return;
      }

      const customerId = Number(formValues.personId);
      const companyIdNumber = Number(companyId || (data.raw as any).company_id || 0);

      if (!customerId) {
        toast.error('Customer wajib dipilih');
        return;
      }

      const payload = {
        company_id: companyIdNumber,
        person_id: customerId,
        warehouse_id: Number(data.raw.warehouse?.id ?? (data.raw as any).warehouse_id ?? 1),
        code: data.raw.code ?? invoiceCode,
        type: 'sales' as const,
        max_capacity: Number(data.raw.max_capacity ?? 1),
        stock_state: data.raw.stock_state ?? 'draft',
        transaction_date: formValues.date,
        document_template_id: formValues.documentTemplateId ?? null,
      };

      await updateMutation.mutateAsync({ id: salesId, payload });

      toast.success('Data berhasil disimpan!');
      router.push(basePath);
    } catch (error) {
      toast.error('Gagal menyimpan data. Silakan coba lagi.');
    }
  };

  if (isLoading || !data?.raw) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Penjualan Unit', onClick: () => router.push(basePath) },
            { label: 'Edit Penjualan' }
          ]}
          title="Edit Penjualan"
          subtitle={
            <>
              <span>Kode Jual:</span>
              <span className="text-blue-600 font-medium">{invoiceCode}</span>
            </>
          }
          onBack={() => router.push(basePath)}
        />

        <Card className="rounded-md border border-gray-200 shadow-none">
          <CardContent className="p-6">
            <UnitTransactionHeaderForm
              type="sales"
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              loading={updateMutation.isPending}
              companyId={companyId}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
