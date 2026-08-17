import type { CustomerFormValues } from '@/scheme/customer.schema';
import { FormDialog } from '@/components/ui/form-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import RequiredMark from '@/components/ui/required-mark';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import { sanitizePhone } from '@/lib/utils/format';
import { ReferenceLink } from '@/components/ui/reference-link';

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  title: string;
  description: string;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function CustomerFormModal({
  open,
  onOpenChange,
  form,
  onSubmit,
  title,
  description,
  submitLabel = 'Simpan',
  isSubmitting = false,
}: CustomerFormModalProps) {
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
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-[14px] font-medium text-[#171717]">
                Nama Customer<RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan nama customer"
                  className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]"
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
            <FormItem className="space-y-2">
              <FormLabel className="text-[14px] font-medium text-[#171717]">PIC</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan PIC"
                  className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]"
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
            <FormItem className="space-y-2">
              <FormLabel className="text-[14px] font-medium text-[#171717]">
                Phone<RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan nomer telepon"
                  className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]"
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
            <FormItem className="space-y-2">
              <FormLabel className="text-[14px] font-medium text-[#171717]">
                NPWP<RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan NPWP"
                  maxLength={16}
                  minLength={15}
                  className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]"
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
          name="map_link"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-[14px] font-medium text-[#171717]">
                <div className="flex flex-row justify-between w-full">
                  <span>
                    Maps
                  </span>
                  <ReferenceLink href="https://www.google.com/maps" target="_blank">gmaps</ReferenceLink>
                </div>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan link maps"
                  className="h-12 rounded-md border-[#E4E4E7] px-4 text-[15px] placeholder:text-[#A1A1AA]"
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
            <FormItem className="space-y-2">
              <FormLabel className="text-[14px] font-medium text-[#171717]">
                Alamat<RequiredMark />
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tambahkan Alamat"
                  className="min-h-[100px] rounded-md border-[#E4E4E7] px-4 py-3 text-[15px] placeholder:text-[#A1A1AA] resize-none"
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
