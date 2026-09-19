import { Save } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { TypeUnitFormValues } from '@/scheme/type-unit.schema';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TypeUnitFormFields } from './TypeUnitFormFields';

interface TypeUnitFormProps {
  form: UseFormReturn<TypeUnitFormValues>;
  onSubmit: (values: TypeUnitFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}
export function TypeUnitForm({ form, onSubmit, onCancel, isSubmitting = false, submitLabel = 'Simpan' }: TypeUnitFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Informasi Tipe Unit</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola detail identitas, berat, dan harga unit</p>
          <div className="my-6 h-px bg-muted/60" />
        </div>

        <TypeUnitFormFields form={form} disabled={isSubmitting} />

        <div className="flex justify-center items-center gap-6 pt-10">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" variant="default" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : <>{submitLabel}</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
