import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTypeUnit, useUpdateTypeUnit } from '@/hooks/useTypeUnit';
import { typeUnitSchema, type TypeUnitFormValues } from '@/schemas/type-unit.schema';
import { TypeUnitForm } from '@/components/features/type-unit/TypeUnitForm';
import { ChevronRight } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';

export default function EditTypeUnitPage() {
  const router = useRouter();
  const { id } = router.query;
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const { data: typeUnit, isLoading, isError } = useTypeUnit(id as string);
  const updateTypeUnit = useUpdateTypeUnit();

  const form = useForm<TypeUnitFormValues>({
    resolver: zodResolver(typeUnitSchema),
    defaultValues: {
      code: '',
      brandId: undefined,
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

  // Reset form when data is loaded
  useEffect(() => {
    if (typeUnit) {
      form.reset({
        code: typeUnit.code ?? '',
        // brandId can come from either brandId or nested brand
        brandId: typeUnit.brandId ?? typeUnit.brand?.id,
        name: typeUnit.name ?? '',
        unitType: typeUnit.unitType ?? '',
        unitModel: typeUnit.unitModel ?? '',
        brutoWeight: typeUnit.brutoWeight ?? undefined,
        nettoWeight: typeUnit.nettoWeight ?? undefined,
        capacity: typeUnit.capacity ?? undefined,
        sellPrice: typeUnit.sellPrice ?? undefined,
        buyPrice: typeUnit.buyPrice ?? undefined,
        image: null,
      });
    }
  }, [typeUnit, form]);

  const onSubmit = async (values: TypeUnitFormValues) => {
    if (!id) return;
    if (!values.brandId) {
      toast.error('Brand ID wajib diisi');
      return;
    }

    try {
      await updateTypeUnit.mutateAsync({
        id: id as string,
        payload: {
          ...values,
          brandId: Number(values.brandId),
          brutoWeight: values.brutoWeight ?? null,
          nettoWeight: values.nettoWeight ?? null,
          capacity: values.capacity ?? null,
        },
      });
      toast.success('Data berhasil diperbarui');
      router.push(`/dashboard/${slug}/master/type-unit`);
    } catch (error) {
      toast.error('Gagal memperbarui data tipe unit');
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/${slug}/master/type-unit`);
  };

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
        <div className="space-y-6">
          <div className="text-center text-destructive p-10">Data tidak ditemukan atau terjadi kesalahan</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <PageHeader
          title="Edit Tipe Unit"
          subtitle={`Kode: ${typeUnit.code}`}
          breadcrumbs={[
            { label: 'Tipe Unit', onClick: handleCancel },
            { label: 'Edit Tipe Unit' }
          ]}
          onBack={handleCancel}
        />

        {/* FORM CARD */}
        <Card className="rounded-md p-6">
          <TypeUnitForm form={form} onSubmit={onSubmit} onCancel={handleCancel} isSubmitting={updateTypeUnit.isPending} submitLabel="Perbarui" />
        </Card>
      </div>
    </DashboardLayout>
  );
}
