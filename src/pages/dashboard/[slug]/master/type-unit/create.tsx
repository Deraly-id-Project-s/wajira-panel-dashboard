import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useCreateTypeUnit } from '@/hooks/useTypeUnit';
import { typeUnitSchema, type TypeUnitFormValues } from '@/schemas/type-unit.schema';
import { TypeUnitForm } from '@/components/features/type-unit/TypeUnitForm';
import { ChevronRight } from 'lucide-react';

export default function CreateTypeUnitPage() {
  const router = useRouter();
  const createTypeUnit = useCreateTypeUnit();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const form = useForm<TypeUnitFormValues>({
    resolver: zodResolver(typeUnitSchema),
    defaultValues: {
      code: '',
      brandId: 0,
      name: '',
      unitType: '',
      unitModel: '',
      brutoWeight: undefined,
      nettoWeight: undefined,
      capacity: undefined,
      image: null,
      sellPrice: undefined,
      buyPrice: undefined,
    },
  });

  const onSubmit = async (values: TypeUnitFormValues) => {
    if (!values.brandId) {
      toast.error('Brand ID wajib diisi');
      return;
    }

    try {
      await createTypeUnit.mutateAsync({
        ...values,
        brandId: Number(values.brandId),
        brutoWeight: values.brutoWeight ?? null,
        nettoWeight: values.nettoWeight ?? null,
        capacity: values.capacity ?? null,
      });
      toast.success('Data berhasil ditambahkan');
      router.push(`/dashboard/${slug}/master/type-unit`);
    } catch (error) {
      toast.error('Gagal menambahkan data tipe unit');
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/${slug}/master/type-unit`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <PageHeader
          title="Tambahkan Tipe Unit"
          subtitle="Masukkan detail tipe baru"
          breadcrumbs={[
            { label: 'Tipe Unit', onClick: handleCancel },
            { label: 'Tambah Tipe Unit' }
          ]}
          onBack={handleCancel}
        />

        {/* FORM CARD */}
        <Card className="rounded-md p-6">
          <TypeUnitForm form={form} onSubmit={onSubmit} onCancel={handleCancel} isSubmitting={createTypeUnit.isPending} submitLabel="Simpan" />
        </Card>
      </div>
    </DashboardLayout>
  );
}
