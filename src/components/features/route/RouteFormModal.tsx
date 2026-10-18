import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RequiredMark from '@/components/ui/required-mark';
import { ReferenceLink } from '@/components/ui/reference-link';
import { LeafletCoordinateInput } from '@/components/ui/leaflet-coordinate-input';
import type { RouteModel, CreateRoutePayload } from '@/@types/route.types';

export interface RouteFormData {
  name: string;
  address: string;
  link: string;
  coordinat: string | null;
  other_information: string;
  description: string;
}

const defaultValues: RouteFormData = {
  name: '',
  address: '',  
  link: '',
  coordinat: null,
  other_information: '',
  description: '',
};

interface RouteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: RouteModel | null;
  onSubmit: (data: CreateRoutePayload) => void;
  isSubmitting?: boolean;
}

export function RouteFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting = false,
}: RouteFormModalProps) {
  const form = useForm<RouteFormData>({
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          name: initialData.name || '',
          address: initialData.address || '',
          link: initialData.link || '',
          coordinat: initialData.coordinat || null,
          other_information: initialData.other_information || initialData.otherInformation || '',
          description: initialData.description || '',
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = (values: RouteFormData) => {
    onSubmit({
      name: values.name.trim(),
      address: values.address.trim() || null,
      link: values.link.trim() || null,
      coordinat: values.coordinat || null,
      other_information: values.other_information.trim() || null,
      description: values.description.trim() || null,
    });
  };

  return (
    <Form {...form}>
      <FormDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) form.reset(defaultValues);
          onOpenChange(isOpen);
        }}
        title={initialData ? 'Edit Data Rute' : 'Tambah Data Rute'}
        description={
          initialData
            ? 'Perbarui detail titik/lokasi rute'
            : 'Tambahkan data titik rute baru untuk master logistik'
        }
        onSubmit={form.handleSubmit(handleSubmit)}
        submitLabel="Simpan"
        isSubmitting={isSubmitting}
        maxWidthClassName="max-w-lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 py-1">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Nama rute wajib diisi' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Nama Rute / Pool / Lokasi<RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Contoh: Pool Cakung, Gudang Rungkut"
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
                <FormLabel className="text-sm font-medium text-gray-700">Alamat</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Alamat lengkap lokasi atau pool"
                    className="bg-white resize-none min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  <div className="flex flex-row justify-between w-full">
                    <span>Tautan Google Maps</span>
                    <ReferenceLink href="https://www.google.com/maps" target="_blank">
                      gmaps
                    </ReferenceLink>
                  </div>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://maps.google.com/?q=..."
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coordinat"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Koordinat Lokasi</FormLabel>
                <LeafletCoordinateInput
                  id="route-map-coordinate"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="other_information"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Informasi Lainnya</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Contoh: Pintu gerbang timur, Dok 3"
                    className="bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Deskripsi / Catatan</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Catatan tambahan mengenai rute ini"
                    className="bg-white resize-none min-h-[70px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </FormDialog>
    </Form>
  );
}
