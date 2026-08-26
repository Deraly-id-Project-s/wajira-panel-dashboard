import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Driver, DriverPayload } from '@/types/driver.types';

export interface DriverFormData {
  name: string;
  address: string;
  phone: string;
  npwp: string;
  picName: string;
  identityNumber: string;
  driveLicenseNumber: string;
  mapLink: string;
  socialMedia1Link: string;
  socialMedia2Link: string;
  socialMedia3Link: string;
  socialMedia4Link: string;
  websiteLink: string;
  joinDate: string;
  image: FileList | null;
}

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DriverPayload) => void;
  initialData?: Driver | null;
  isSubmitting?: boolean;
  companyId?: string | number;
  userId?: string | number;
}

const emptyValues: Omit<DriverFormData, 'image'> & { image: null } = {
  name: '',
  address: '',
  phone: '',
  npwp: '',
  picName: '',
  identityNumber: '',
  driveLicenseNumber: '',
  mapLink: '',
  socialMedia1Link: '',
  socialMedia2Link: '',
  socialMedia3Link: '',
  socialMedia4Link: '',
  websiteLink: '',
  joinDate: '',
  image: null,
};

export function DriverFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSubmitting = false,
  companyId,
  userId,
}: DriverFormModalProps) {
  const form = useForm<DriverFormData>({
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (isOpen && initialData) {
      form.reset({
        name: initialData.name || '',
        address: initialData.address || '',
        phone: initialData.phone || '',
        npwp: initialData.npwp || '',
        picName: initialData.picName || '',
        identityNumber: initialData.identityNumber || '',
        driveLicenseNumber: initialData.driveLicenseNumber || '',
        mapLink: initialData.mapLink || '',
        socialMedia1Link: initialData.socialMedia1Link || '',
        socialMedia2Link: initialData.socialMedia2Link || '',
        socialMedia3Link: initialData.socialMedia3Link || '',
        socialMedia4Link: initialData.socialMedia4Link || '',
        websiteLink: initialData.websiteLink || '',
        joinDate: initialData.joinedAt ? initialData.joinedAt.substring(0, 10) : '',
        image: null,
      });
    } else if (!isOpen) {
      form.reset(emptyValues);
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (data: DriverFormData) => {
    onSave({
      company_id: companyId,
      user_id: userId,
      name: data.name,
      address: data.address || undefined,
      phone: data.phone || undefined,
      npwp: data.npwp || undefined,
      pic_name: data.picName || undefined,
      identity_number: data.identityNumber || undefined,
      drive_license_identity_number: data.driveLicenseNumber || undefined,
      map_link: data.mapLink || undefined,
      social_media_1_link: data.socialMedia1Link || undefined,
      social_media_2_link: data.socialMedia2Link || undefined,
      social_media_3_link: data.socialMedia3Link || undefined,
      social_media_4_link: data.socialMedia4Link || undefined,
      website_link: data.websiteLink || undefined,
      join_date: data.joinDate || undefined,
      image: data.image?.[0] ?? null,
    });
  };

  return (
    <Form {...form}>
      <FormDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={initialData ? 'Edit Data Driver' : 'Tambah Data Driver'}
        description={initialData ? 'Perbarui detail driver' : 'Masukkan detail driver baru'}
        onSubmit={form.handleSubmit(onSubmit)}
        submitLabel="Simpan"
        isSubmitting={isSubmitting}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 py-1">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: 'Nama Driver wajib diisi', maxLength: { value: 249, message: 'Maks 249 karakter' } }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Driver <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Tambahkan nama driver" {...field} />
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
                <FormLabel>Alamat</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tambahkan alamat" className="resize-none" rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="identityNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>KTP</FormLabel>
                <FormControl>
                  <Input placeholder="Tambahkan nomor KTP" {...field} />
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Tambahkan nomor telepon" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driveLicenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor SIM</FormLabel>
                <FormControl>
                  <Input placeholder="Tambahkan nomor SIM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="joinDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tgl. Gabung</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
