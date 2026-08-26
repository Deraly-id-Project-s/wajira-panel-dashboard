import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Save } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FileInput } from '@/components/ui/file-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import RequiredMark from '@/components/ui/required-mark';
import type { Driver, DriverPayload } from '@/types/driver.types';

type DriverFormValues = {
  name: string;
  username: string;
  password: string;
  passwordConfirmation: string;
  isActive: boolean;
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
  image: File | null;
};

interface DriverFormProps {
  initialData?: Driver;
  companyId: string | number;
  isSubmitting?: boolean;
  onSubmit: (payload: DriverPayload) => void | Promise<void>;
  onCancel: () => void;
}

const emptyValues: DriverFormValues = {
  name: '', username: '', password: '', passwordConfirmation: '', isActive: true,
  address: '', phone: '', npwp: '', picName: '', identityNumber: '', driveLicenseNumber: '',
  mapLink: '', socialMedia1Link: '', socialMedia2Link: '', socialMedia3Link: '',
  socialMedia4Link: '', websiteLink: '', joinDate: '', image: null,
};

export function DriverForm({ initialData, companyId, isSubmitting = false, onSubmit, onCancel }: DriverFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const form = useForm<DriverFormValues>({ defaultValues: emptyValues });
  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (!initialData) {
      form.reset(emptyValues);
      return;
    }
    form.reset({
      ...emptyValues,
      name: initialData.name ?? '',
      username: initialData.username ?? '',
      isActive: initialData.isActive === true || initialData.isActive === 1,
      address: initialData.address ?? '',
      phone: initialData.phone ?? '',
      npwp: initialData.npwp ?? '',
      picName: initialData.picName ?? '',
      identityNumber: initialData.identityNumber ?? '',
      driveLicenseNumber: initialData.driveLicenseNumber ?? '',
      mapLink: initialData.mapLink ?? '',
      socialMedia1Link: initialData.socialMedia1Link ?? '',
      socialMedia2Link: initialData.socialMedia2Link ?? '',
      socialMedia3Link: initialData.socialMedia3Link ?? '',
      socialMedia4Link: initialData.socialMedia4Link ?? '',
      websiteLink: initialData.websiteLink ?? '',
      joinDate: initialData.joinedAt?.slice(0, 10) ?? '',
    });
  }, [form, initialData]);

  const submit = (values: DriverFormValues) => onSubmit({
    company_id: companyId,
    name: values.name.trim(),
    username: values.username.trim() || null,
    password: values.password || undefined,
    is_active: values.isActive,
    address: values.address || undefined,
    phone: values.phone || undefined,
    npwp: values.npwp || undefined,
    pic_name: values.picName || undefined,
    identity_number: values.identityNumber || undefined,
    drive_license_identity_number: values.driveLicenseNumber || undefined,
    map_link: values.mapLink || undefined,
    social_media_1_link: values.socialMedia1Link || undefined,
    social_media_2_link: values.socialMedia2Link || undefined,
    social_media_3_link: values.socialMedia3Link || undefined,
    social_media_4_link: values.socialMedia4Link || undefined,
    website_link: values.websiteLink || undefined,
    join_date: values.joinDate || undefined,
    image: values.image,
  });

  const textField = (name: keyof DriverFormValues, label: string, placeholder: string, type = 'text') => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} disabled={isSubmitting} {...field} value={typeof field.value === 'string' ? field.value : ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="rounded-md py-4">
            <CardHeader><CardTitle className="text-base">Informasi Driver</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField control={form.control} name="name" rules={{ required: 'Nama driver wajib diisi', maxLength: { value: 249, message: 'Maksimal 249 karakter' } }} render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Nama Driver<RequiredMark /></FormLabel><FormControl><Input placeholder="Masukkan nama driver" disabled={isSubmitting} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Alamat</FormLabel><FormControl><Input placeholder="Masukkan alamat driver" disabled={isSubmitting} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {textField('phone', 'Nomor Telepon', 'Contoh: 08123456789')}
              {textField('npwp', 'NPWP', 'Masukkan NPWP driver')}
              {textField('picName', 'Nama PIC', 'Masukkan nama PIC')}
              {textField('mapLink', 'Link Maps', 'Masukkan link Google Maps')}
              {textField('identityNumber', 'Nomor KTP', 'Masukkan nomor KTP')}
              {textField('driveLicenseNumber', 'Nomor SIM', 'Masukkan nomor SIM')}
              {textField('joinDate', 'Tanggal Bergabung', 'Pilih tanggal bergabung', 'date')}
              <FormField control={form.control} name="image" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel>Foto Driver</FormLabel><FormControl><FileInput id="driver-image" accept="image/jpeg,image/png,image/webp" value={field.value} onFileChange={field.onChange} disabled={isSubmitting} helperText="Format JPG, PNG, atau WebP maksimal 2 MB" /></FormControl>{isEdit && initialData?.image ? <p className="text-xs text-muted-foreground">Kosongkan untuk mempertahankan foto saat ini.</p> : null}<FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-md py-4">
              <CardHeader><CardTitle className="text-base">Akun Driver</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {textField('username', 'Username', 'Masukkan username driver')}
                <FormField control={form.control} name="password" rules={{ minLength: { value: 6, message: 'Password minimal 6 karakter' } }} render={({ field }) => (
                  <FormItem><FormLabel>Password {isEdit && <span className="font-normal text-muted-foreground">(opsional)</span>}</FormLabel><FormControl><div className="relative"><Input type={showPassword ? 'text' : 'password'} placeholder={isEdit ? 'Kosongkan jika tidak diubah' : 'Kosongkan untuk password otomatis'} disabled={isSubmitting} className="pr-10" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword((value) => !value)}><span className="sr-only">Tampilkan password</span>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="passwordConfirmation" rules={{ validate: (value) => value === form.getValues('password') || 'Konfirmasi password tidak sama' }} render={({ field }) => (
                  <FormItem><FormLabel>Konfirmasi Password</FormLabel><FormControl><div className="relative"><Input type={showConfirmation ? 'text' : 'password'} placeholder="Ulangi password" disabled={isSubmitting} className="pr-10" {...field} /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowConfirmation((value) => !value)}><span className="sr-only">Tampilkan konfirmasi password</span>{showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-4"><div><FormLabel>Status Akun</FormLabel><p className="text-sm text-muted-foreground">Driver aktif dapat menggunakan akun untuk login.</p></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            <Card className="rounded-md py-4">
              <CardHeader><CardTitle className="text-base">Tautan & Informasi Tambahan</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {textField('websiteLink', 'Website', 'https://...')}
                {textField('socialMedia1Link', 'Media Sosial 1', 'https://...')}
                {textField('socialMedia2Link', 'Media Sosial 2', 'https://...')}
                {textField('socialMedia3Link', 'Media Sosial 3', 'https://...')}
                {textField('socialMedia4Link', 'Media Sosial 4', 'https://...')}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#1e3a5f] hover:bg-[#152e4d]"><Save className="mr-2 h-4 w-4" />{isSubmitting ? 'Menyimpan...' : 'Simpan'}</Button>
        </div>
      </form>
    </Form>
  );
}
