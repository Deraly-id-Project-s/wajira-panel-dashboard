import type { CreateSupplierFormValues } from '@/schemas/supplier.schema';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import RequiredMark from '@/components/ui/required-mark';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import { sanitizePhone } from '@/lib/utils/format';
import { FormDialog } from '@/components/ui/form-dialog';

interface SupplierFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CreateSupplierFormValues>;
  onSubmit: (values: CreateSupplierFormValues) => void;
  title: string;
  description: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function SupplierFormModal({
  open,
  onOpenChange,
  form,
  onSubmit,
  title,
  description,
  submitLabel = 'Simpan',
  isSubmitting = false,
}: SupplierFormModalProps) {
  return (
    <Form {...form}>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        onSubmit={form.handleSubmit(onSubmit)}
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
        maxWidthClassName="max-w-md"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">
                Nama Supplier<RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan nama supplier"
                  className="bg-transparent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pic"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">PIC</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan PIC"
                  className="bg-transparent"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Phone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan nomer telepon"
                  className="bg-transparent"
                  onChange={(e) => {
                    field.onChange(sanitizePhone(e.target.value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="npwp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">NPWP</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan NPWP"
                  maxLength={16}
                  minLength={15}
                  className="bg-transparent"
                  onChange={(e) => {
                    field.onChange(e.target.value.replace(/[^\d]/g, ''));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Alamat</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tambahkan Alamat"
                  className="min-h-[100px] bg-transparent resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormDialog>
    </Form>
  );
}
