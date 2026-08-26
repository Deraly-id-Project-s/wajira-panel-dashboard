import { useRouter } from 'next/router';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { VehicleData } from '@/types/vehicle-data.types';
import { formatDateUI } from '@/lib/utils/date';

interface VehicleDataDetailProps {
  data: VehicleData;
  slug: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return formatDateUI(date);
};

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1 rounded-md border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm text-slate-800">{value || '-'}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-md border border-slate-200 bg-[#fcfcfd] p-5 shadow-sm">
      <div className="mb-4 border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">{title}</div>
      {children}
    </Card>
  );
}

export function VehicleDataDetail({ data, slug }: VehicleDataDetailProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Data Kendaraan"
        subtitle="Informasi lengkap data kendaraan dan kepemilikannya."
        onBack={() => router.back()}
        actions={
          <Button onClick={() => router.push(`/dashboard/${slug}/data-kendaraan/${data.id}/edit`)} className="bg-[#17365d] hover:bg-[#122b49]">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Data
          </Button>
        }
      />

      <Section title="Dealer & Faktur">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Dealer" value={data.dealer?.namaDealer} />
          <DetailRow label="Wilayah" value={data.region?.name} />
          <DetailRow label="Nomor Faktur" value={data.invoiceNumber} />
          <DetailRow label="Tanggal Faktur" value={formatDate(data.invoiceDate)} />
          <DetailRow label="Tanggal Terima Faktur" value={formatDate(data.invoiceReceiveDate)} />
          <DetailRow label="Jenis Kendaraan" value={String(data.vehicleType).toUpperCase()} />
        </div>
      </Section>

      <Section title="Data Kepemilikan">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Nomor KTP" value={data.ktpNumber} />
          <DetailRow label="Nomor Handphone" value={data.phoneNumber} />
          <DetailRow label="Pekerjaan" value={data.occupation} />
          <DetailRow label="Nama STNK" value={data.stnkName} />
          <DetailRow label="Alamat STNK" value={data.stnkAddress} />
          <DetailRow label="RT / RW" value={data.subVillage} />
          <DetailRow label="Desa / Kelurahan" value={data.village} />
          <DetailRow label="Kecamatan" value={data.district} />
          <DetailRow label="Kabupaten / Kota" value={data.regency} />
          <DetailRow label="Provinsi" value={data.subDistrict} />
          <DetailRow label="Kode Pos" value={data.postalCode} />
        </div>
      </Section>

      <Section title="Data Kendaraan">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <DetailRow label="Merk Motor" value={data.motorcycleBrand} />
          <DetailRow label="Tipe Motor" value={data.motorcycleType} />
          <DetailRow label="Jenis Motor" value={data.motorcycleCategory} />
          <DetailRow label="Model Motor" value={data.motorcycleModel} />
          <DetailRow label="Tahun Rakit" value={data.manufactureYear} />
          <DetailRow label="Isi Silinder" value={data.engineCapacity} />
          <DetailRow label="Warna" value={data.color} />
          <DetailRow label="Harga" value={data.price ? new Intl.NumberFormat('id-ID').format(data.price) : '-'} />
          <DetailRow label="No Rangka" value={data.chassisNumber} />
          <DetailRow label="Nomor Mesin" value={data.machineNumber} />
          <DetailRow label="Form A/B" value={data.formAb} />
          <DetailRow label="PIB" value={data.pib} />
          <DetailRow label="Nomor TPT" value={data.tptNumber} />
          <DetailRow label="Nomor SUT" value={data.sutNumber} />
          <DetailRow label="Nomor SRUT" value={data.srutNumber} />
          <DetailRow label="Bahan Bakar" value={data.fuelType} />
        </div>
      </Section>
    </div>
  );
}
