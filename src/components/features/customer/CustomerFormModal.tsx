import type { CustomerFormValues } from '@/scheme/customer.schema';
import { FormDialog } from '@/components/ui/form-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import RequiredMark from '@/components/ui/required-mark';
import { Textarea } from '@/components/ui/textarea';
import type { UseFormReturn } from 'react-hook-form';
import { ReferenceLink } from '@/components/ui/reference-link';
import { LeafletCoordinateInput } from '@/components/ui/leaflet-coordinate-input';

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
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Nama Customer<RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan nama customer"
                  className={`bg-white ${form.formState.errors.name ? 'border-red-500' : ''}`}
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
              <FormLabel className="text-sm font-medium text-gray-700">
                Alamat<RequiredMark />
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tambahkan Alamat"
                  className={`bg-white resize-none min-h-[100px] ${form.formState.errors.address ? 'border-red-500' : ''}`}
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
              <FormLabel className="text-sm font-medium text-gray-700">
                Phone<RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan nomer telepon"
                  className={`bg-white ${form.formState.errors.phone ? 'border-red-500' : ''}`}
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
              <FormLabel className="text-sm font-medium text-gray-700">
                NPWP<RequiredMark />
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan NPWP"
                  maxLength={16}
                  minLength={15}
                  className={`bg-white ${form.formState.errors.npwp ? 'border-red-500' : ''}`}
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
          name="pic"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">PIC</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Tambahkan PIC"
                  className={`bg-white ${form.formState.errors.pic ? 'border-red-500' : ''}`}
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
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
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
                  className={`bg-white ${form.formState.errors.map_link ? 'border-red-500' : ''}`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="map_coordinat"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Koordinat Lokasi</FormLabel>
              <LeafletCoordinateInput
                id="customer-map-coordinate"
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </FormDialog>
    </Form>
  );
}
