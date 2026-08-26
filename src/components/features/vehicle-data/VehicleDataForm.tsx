import * as React from 'react';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import RequiredMark from '@/components/ui/required-mark';
import { SearchableSelect } from './SearchableSelect';
import { useCompany } from '@/contexts/CompanyContext';
import { useDealers } from '@/hooks/useDealer';
import { useRegions } from '@/hooks/useRegion';
import type { VehicleData, VehicleDataPayload, VehicleType } from '@/types/vehicle-data.types';

interface VehicleDataFormProps {
  title: string;
  initialData?: VehicleData;
  isSubmitting?: boolean;
  onSubmit: (payload: VehicleDataPayload) => Promise<void> | void;
}

interface VehicleDataFormValues {
  dealerId: string;
  regionId: string;
  invoiceNumber: string;
  invoiceDate?: Date;
  invoiceReceiveDate?: Date;
  vehicleType: VehicleType | '';
  ktpNumber: string;
  phoneNumber: string;
  occupation: string;
  stnkName: string;
  stnkAddress: string;
  village: string;
  district: string;
  subVillage: string;
  subDistrict: string;
  regency: string;
  postalCode: string;
  motorcycleBrand: string;
  motorcycleType: string;
  motorcycleCategory: string;
  motorcycleModel: string;
  manufactureYear: string;
  engineCapacity: string;
  color: string;
  price: number;
  chassisNumber: string;
  machineNumber: string;
  formAb: string;
  pib: string;
  tptNumber: string;
  sutNumber: string;
  srutNumber: string;
  fuelType: string;
}

const defaultValues: VehicleDataFormValues = {
  dealerId: '',
  regionId: '',
  invoiceNumber: '',
  invoiceDate: undefined,
  invoiceReceiveDate: undefined,
  vehicleType: '',
  ktpNumber: '',
  phoneNumber: '',
  occupation: '',
  stnkName: '',
  stnkAddress: '',
  village: '',
  district: '',
  subVillage: '',
  subDistrict: '',
  regency: '',
  postalCode: '',
  motorcycleBrand: '',
  motorcycleType: '',
  motorcycleCategory: '',
  motorcycleModel: '',
  manufactureYear: '',
  engineCapacity: '',
  color: '',
  price: 0,
  chassisNumber: '',
  machineNumber: '',
  formAb: '',
  pib: '',
  tptNumber: '',
  sutNumber: '',
  srutNumber: '',
  fuelType: '',
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toPayloadDate = (value?: Date) => {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="text-xs font-semibold text-slate-700">
      {children}
      {required ? <RequiredMark className="ml-1" /> : null}
    </Label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4 text-sm font-semibold text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

export function VehicleDataForm({ title, initialData, isSubmitting = false, onSubmit }: VehicleDataFormProps) {
  const router = useRouter();
  const { companyId } = useCompany();
  const [dealerSearch, setDealerSearch] = React.useState('');
  const [regionSearch, setRegionSearch] = React.useState('');

  const dealersQuery = useDealers(companyId ? String(companyId) : null, { page: 1, perPage: 100, search: dealerSearch });
  const regionsQuery = useRegions({ page: 1, perPage: 100, search: regionSearch });

  const dealers = (dealersQuery.data?.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.namaDealer,
    subtitle: item.code || undefined,
  }));

  const regions = (regionsQuery.data?.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.name,
    subtitle: item.code || undefined,
  }));

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleDataFormValues>({
    defaultValues,
  });

  React.useEffect(() => {
    if (!initialData) {
      reset(defaultValues);
      return;
    }

    reset({
      dealerId: String(initialData.dealerId || ''),
      regionId: String(initialData.regionId || ''),
      invoiceNumber: initialData.invoiceNumber || '',
      invoiceDate: toDateInputValue(initialData.invoiceDate),
      invoiceReceiveDate: toDateInputValue(initialData.invoiceReceiveDate),
      vehicleType: initialData.vehicleType || '',
      ktpNumber: initialData.ktpNumber || '',
      phoneNumber: initialData.phoneNumber || '',
      occupation: initialData.occupation || '',
      stnkName: initialData.stnkName || '',
      stnkAddress: initialData.stnkAddress || '',
      village: initialData.village || '',
      district: initialData.district || '',
      subVillage: initialData.subVillage || '',
      subDistrict: initialData.subDistrict || '',
      regency: initialData.regency || '',
      postalCode: initialData.postalCode || '',
      motorcycleBrand: initialData.motorcycleBrand || '',
      motorcycleType: initialData.motorcycleType || '',
      motorcycleCategory: initialData.motorcycleCategory || '',
      motorcycleModel: initialData.motorcycleModel || '',
      manufactureYear: initialData.manufactureYear ? String(initialData.manufactureYear) : '',
      engineCapacity: initialData.engineCapacity ? String(initialData.engineCapacity) : '',
      color: initialData.color || '',
      price: initialData.price || 0,
      chassisNumber: initialData.chassisNumber || '',
      machineNumber: initialData.machineNumber || '',
      formAb: initialData.formAb || '',
      pib: initialData.pib || '',
      tptNumber: initialData.tptNumber || '',
      sutNumber: initialData.sutNumber || '',
      srutNumber: initialData.srutNumber || '',
      fuelType: initialData.fuelType || '',
    });
  }, [initialData, reset]);

  const submitHandler = async (values: VehicleDataFormValues) => {
    await onSubmit({
      dealerId: Number(values.dealerId),
      regionId: Number(values.regionId),
      invoiceNumber: values.invoiceNumber.trim(),
      invoiceDate: toPayloadDate(values.invoiceDate),
      invoiceReceiveDate: toPayloadDate(values.invoiceReceiveDate),
      vehicleType: values.vehicleType as VehicleType,
      ktpNumber: values.ktpNumber.trim(),
      phoneNumber: values.phoneNumber.trim(),
      occupation: values.occupation.trim(),
      stnkName: values.stnkName.trim(),
      stnkAddress: values.stnkAddress.trim(),
      village: values.village.trim(),
      district: values.district.trim(),
      subVillage: values.subVillage.trim(),
      subDistrict: values.subDistrict.trim(),
      regency: values.regency.trim(),
      postalCode: values.postalCode.trim(),
      motorcycleBrand: values.motorcycleBrand.trim(),
      motorcycleType: values.motorcycleType.trim(),
      motorcycleCategory: values.motorcycleCategory.trim(),
      motorcycleModel: values.motorcycleModel.trim(),
      manufactureYear: values.manufactureYear.trim(),
      engineCapacity: values.engineCapacity.trim(),
      color: values.color.trim(),
      price: String(values.price || 0),
      chassisNumber: values.chassisNumber.trim(),
      machineNumber: values.machineNumber.trim(),
      formAb: values.formAb.trim(),
      pib: values.pib.trim(),
      tptNumber: values.tptNumber.trim(),
      sutNumber: values.sutNumber.trim(),
      srutNumber: values.srutNumber.trim(),
      fuelType: values.fuelType.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle="Kelola data kendaraan dengan form halaman penuh."
        onBack={() => router.back()}
      />

      <Card className="rounded-[22px] border border-slate-200 bg-[#fcfcfd] p-4 shadow-sm sm:p-6">
        <div className="mb-5 border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-slate-900">Informasi Data Kendaraan</h2>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
          <Section title="Dealer & Faktur">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel required>Dealer</FieldLabel>
                <Controller
                  name="dealerId"
                  control={control}
                  rules={{ required: 'Dealer wajib dipilih' }}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={dealers}
                      loading={dealersQuery.isLoading}
                      onSearchChange={setDealerSearch}
                      placeholder="Masukkan nama dealer"
                      searchPlaceholder="Cari dealer..."
                      emptyText="Dealer tidak ditemukan."
                    />
                  )}
                />
                <FormError message={errors.dealerId?.message} />
              </div>

              <div className="space-y-2">
                <FieldLabel required>Wilayah</FieldLabel>
                <Controller
                  name="regionId"
                  control={control}
                  rules={{ required: 'Wilayah wajib dipilih' }}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={regions}
                      loading={regionsQuery.isLoading}
                      onSearchChange={setRegionSearch}
                      placeholder="Masukkan wilayah"
                      searchPlaceholder="Cari wilayah..."
                      emptyText="Wilayah tidak ditemukan."
                    />
                  )}
                />
                <FormError message={errors.regionId?.message} />
              </div>

              <div className="space-y-2">
                <FieldLabel required>Nomor Faktur</FieldLabel>
                <Input placeholder="Masukkan nomor" {...register('invoiceNumber', { required: 'Nomor faktur wajib diisi' })} />
                <FormError message={errors.invoiceNumber?.message} />
              </div>

              <div className="space-y-2">
                <FieldLabel required>Tanggal Faktur</FieldLabel>
                <Controller
                  name="invoiceDate"
                  control={control}
                  rules={{ required: 'Tanggal faktur wajib diisi' }}
                  render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pilih tanggal faktur" className="bg-white" />}
                />
                <FormError message={errors.invoiceDate?.message as string | undefined} />
              </div>

              <div className="space-y-2">
                <FieldLabel required>Tanggal Terima Faktur</FieldLabel>
                <Controller
                  name="invoiceReceiveDate"
                  control={control}
                  rules={{ required: 'Tanggal terima faktur wajib diisi' }}
                  render={({ field }) => <DatePicker value={field.value} onChange={field.onChange} placeholder="Pilih tanggal terima faktur" className="bg-white" />}
                />
                <FormError message={errors.invoiceReceiveDate?.message as string | undefined} />
              </div>

              <div className="space-y-2">
                <FieldLabel required>Jenis Kendaraan</FieldLabel>
                <Controller
                  name="vehicleType"
                  control={control}
                  rules={{ required: 'Jenis kendaraan wajib dipilih' }}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="r2">R2</SelectItem>
                        <SelectItem value="r3">R3</SelectItem>
                        <SelectItem value="r4">R4</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormError message={errors.vehicleType?.message} />
              </div>
            </div>
          </Section>

          <Section title="Data Kepemilikan">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel>Nomor KTP</FieldLabel>
                <Input placeholder="Masukkan nomor" {...register('ktpNumber')} />
                <FormError message={errors.ktpNumber?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Nomor Handphone</FieldLabel>
                <Input placeholder="Masukkan nomor" {...register('phoneNumber')} />
                <FormError message={errors.phoneNumber?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Pekerjaan</FieldLabel>
                <Input placeholder="Masukkan pekerjaan" {...register('occupation')} />
                <FormError message={errors.occupation?.message} />
              </div>
              <div className="space-y-2 xl:col-span-1">
                <FieldLabel required>Nama STNK</FieldLabel>
                <Input placeholder="Masukkan nama" {...register('stnkName', { required: 'Nama STNK wajib diisi' })} />
                <FormError message={errors.stnkName?.message} />
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-2">
                <FieldLabel>Alamat STNK</FieldLabel>
                <Textarea placeholder="Masukkan alamat sesuai STNK" rows={3} className="bg-white" {...register('stnkAddress')} />
                <FormError message={errors.stnkAddress?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>RT / RW</FieldLabel>
                <Input placeholder="Masukkan RT/RW (contoh: 001/002)" {...register('subVillage')} />
                <FormError message={errors.subVillage?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Desa / Kelurahan</FieldLabel>
                <Input placeholder="Masukkan desa/kelurahan" {...register('village')} />
                <FormError message={errors.village?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Kecamatan</FieldLabel>
                <Input placeholder="Masukkan kecamatan" {...register('district')} />
                <FormError message={errors.district?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Kabupaten / Kota</FieldLabel>
                <Input placeholder="Masukkan kabupaten/kota" {...register('regency')} />
                <FormError message={errors.regency?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Provinsi</FieldLabel>
                <Input placeholder="Masukkan provinsi" {...register('subDistrict')} />
                <FormError message={errors.subDistrict?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Kode Pos</FieldLabel>
                <Input placeholder="Masukkan kode pos" {...register('postalCode')} />
                <FormError message={errors.postalCode?.message} />
              </div>
            </div>
          </Section>

          <Section title="Data Kendaraan">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel>Merk Motor</FieldLabel>
                <Input placeholder="Masukkan nama" {...register('motorcycleBrand')} />
                <FormError message={errors.motorcycleBrand?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Tipe Motor</FieldLabel>
                <Input placeholder="Masukkan tipe" {...register('motorcycleType')} />
                <FormError message={errors.motorcycleType?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Jenis Motor</FieldLabel>
                <Input placeholder="Masukkan jenis" {...register('motorcycleCategory')} />
                <FormError message={errors.motorcycleCategory?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Model Motor</FieldLabel>
                <Input placeholder="Masukkan model" {...register('motorcycleModel')} />
                <FormError message={errors.motorcycleModel?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Tahun Rakit</FieldLabel>
                <Input placeholder="Masukkan tahun" {...register('manufactureYear')} />
                <FormError message={errors.manufactureYear?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Isi Silinder</FieldLabel>
                <Input placeholder="Masukkan jumlah" {...register('engineCapacity')} />
                <FormError message={errors.engineCapacity?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Warna</FieldLabel>
                <Input placeholder="Masukkan warna" {...register('color')} />
                <FormError message={errors.color?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Harga</FieldLabel>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <MoneyInput
                      placeholder="Masukkan nominal"
                      value={Number(field.value) || 0}
                      onChangeValue={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  )}
                />
                <FormError message={errors.price?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel required>No Rangka</FieldLabel>
                <Input placeholder="Masukkan nomor" {...register('chassisNumber', { required: 'No rangka wajib diisi' })} />
                <FormError message={errors.chassisNumber?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel required>Nomor Mesin</FieldLabel>
                <Input placeholder="Masukkan nomor" {...register('machineNumber', { required: 'Nomor mesin wajib diisi' })} />
                <FormError message={errors.machineNumber?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Formulir A/B</FieldLabel>
                <Input placeholder="Masukkan formulir" {...register('formAb')} />
                <FormError message={errors.formAb?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>PIB</FieldLabel>
                <Input placeholder="Masukkan PIB" {...register('pib')} />
                <FormError message={errors.pib?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Nomor TPT</FieldLabel>
                <Input placeholder="Masukkan nomor" {...register('tptNumber')} />
                <FormError message={errors.tptNumber?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Nomor SUT</FieldLabel>
                <Input placeholder="Masukkan nomor" {...register('sutNumber')} />
                <FormError message={errors.sutNumber?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Nomor SRUT</FieldLabel>
                <Input placeholder="Masukkan nomor" {...register('srutNumber')} />
                <FormError message={errors.srutNumber?.message} />
              </div>
              <div className="space-y-2">
                <FieldLabel>Bahan Bakar</FieldLabel>
                <Input placeholder="Masukkan bahan bakar" {...register('fuelType')} />
                <FormError message={errors.fuelType?.message} />
              </div>
            </div>
          </Section>

          <div className="flex justify-center gap-3 pb-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[108px] bg-[#17365d] hover:bg-[#122b49]">
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
