'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCreateSparepart } from '@/hooks/useSparepart';
import { sparepartSchema, type SparepartFormValues } from '@/scheme/sparepart.schema';
import { SparepartForm } from '@/components/features/sparepart/SparepartForm';
import { useCompany } from '@/contexts/CompanyContext';
import { handleApiFormError } from '@/lib/validation';

export const SparepartCreatePage = () => {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const basePath = slug ? `/dashboard/${slug}/master/sparepart` : '/master-data/sparepart';
  const { companyId } = useCompany();
  const safeCompanyId = companyId || '1';

  const createSparepart = useCreateSparepart(safeCompanyId);

  const form = useForm<SparepartFormValues>({
    resolver: zodResolver(sparepartSchema),
    defaultValues: {
      code: '',
      name: '',
      categoryId: null,
      unitType: '',
      purchasePrice: 0,
      sellingPrice: 0,
      capacity: 0,
    },
  });

  const onSubmit = async (values: SparepartFormValues) => {
    try {
      const payload = {
        code: values.code,
        name: values.name,
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        unitType: values.unitType,
        price: values.sellingPrice || values.purchasePrice,
        capacity: values.capacity ?? 0,
        purchasePrice: values.purchasePrice,
        sellingPrice: values.sellingPrice,
        companyId: safeCompanyId,
      };

      await createSparepart.mutateAsync(payload);
      toast.success('Data berhasil ditambahkan');
      void router.push(basePath);
    } catch (err: any) {
      const handled = handleApiFormError(err, form, {
        fieldMapping: {
          code: 'code',
          name: 'name',
          category_id: 'categoryId',
          unit_type: 'unitType',
          purchase_price: 'purchasePrice',
          selling_price: 'sellingPrice',
          capacity: 'capacity',
        },
      });
      if (!handled) {
        const message = err?.response?.data?.message || err?.message || 'Gagal menambahkan data sparepart';
        toast.error(message);
      }
    }
  };

  const handleCancel = () => {
    void router.push(basePath);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Tambah Data Sparepart"
          subtitle="Masukkan detail sparepart baru"
          breadcrumbs={[
            { label: 'Sparepart', onClick: handleCancel },
            { label: 'Tambah Sparepart' },
          ]}
          onBack={handleCancel}
        />

        <Card className="rounded-md p-6">
          <SparepartForm
            form={form}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isSubmitting={createSparepart.isPending}
            submitLabel="Simpan"
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};
