import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { TypeUnit } from '@/@types/type-unit.types';
import { useCreateTypeUnit } from '@/hooks/useTypeUnit';
import { typeUnitSchema, type TypeUnitFormValues } from '@/scheme/type-unit.schema';
import { Form } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { TypeUnitFormFields } from './TypeUnitFormFields';

interface TypeUnitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (typeUnit: TypeUnit) => void;
}

const defaultValues: TypeUnitFormValues = {
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
};

export function TypeUnitFormModal({ open, onOpenChange, onCreated }: TypeUnitFormModalProps) {
  const createTypeUnit = useCreateTypeUnit();
  const form = useForm<TypeUnitFormValues>({ resolver: zodResolver(typeUnitSchema), defaultValues });

  useEffect(() => {
    if (!open) form.reset(defaultValues);
  }, [form, open]);

  const handleSubmit = async (values: TypeUnitFormValues) => {
    try {
      const created = await createTypeUnit.mutateAsync({
        ...values,
        brandId: Number(values.brandId),
        brutoWeight: values.brutoWeight ?? null,
        nettoWeight: values.nettoWeight ?? null,
        capacity: values.capacity ?? null,
      });
      onCreated(created);
      onOpenChange(false);
      toast.success('Tipe unit berhasil ditambahkan');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan tipe unit');
    }
  };

  return (
    <Form {...form}>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Tambah Data Tipe Unit"
        description="Masukkan detail tipe unit baru"
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={createTypeUnit.isPending}
        maxWidthClassName="max-w-2xl"
      >
        <TypeUnitFormFields form={form} disabled={createTypeUnit.isPending} />
      </FormDialog>
    </Form>
  );
}

