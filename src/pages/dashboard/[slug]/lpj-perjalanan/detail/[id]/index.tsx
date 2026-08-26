import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { LPJDetailTable } from '@/components/features/lpj-perjalanan/LPJDetailTable';
import { DUMMY_LPJ_DETAIL_ITEMS, DUMMY_LPJ_RECORDS } from '@/components/features/lpj-perjalanan/lpj-perjalanan.data';

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export default function DetailLPJPerjalananPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const record = useMemo(() => {
    if (!id) return null;
    return DUMMY_LPJ_RECORDS.find((item) => item.id === Number(id)) ?? null;
  }, [id]);

  const detailRows = useMemo(() => {
    if (!id) return [];
    const selected = DUMMY_LPJ_DETAIL_ITEMS.filter((item) => item.lpjId === Number(id));
    if (selected.length > 0) return selected;

    if (!record) return [];

    return [
      {
        id: Number(`${record.id}01`),
        lpjId: record.id,
        tanggal: record.tglBerangkat,
        noPolisi: record.noPolisi,
        type: 'FUSO',
        driver: record.driver,
        invoiceEkspedisi: 50000000,
        biayaTambahan: Number(record.biayaLainnya || 0),
        ujDriver: 3200000,
        lainnya: Number(record.biayaTol || 0),
        pph2: 2750000,
      },
    ];
  }, [id, record]);

  if (!record) {
    return (
      <DashboardLayout>
        <div className="flex h-75 items-center justify-center text-gray-500">Data LPJ tidak ditemukan</div>
      </DashboardLayout>
    );
  }

  const totalBiaya = Number(record.biayaBBM || 0) + Number(record.biayaTol || 0) + Number(record.biayaLainnya || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => router.push(`/dashboard/${slug}/lpj-perjalanan`)} className="rounded-md p-1 transition-colors hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-[34px] font-semibold text-gray-900 leading-none">Detail LPJ</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kode LPJ <span className="text-blue-600">{record.kodeLPJ}</span>
            </p>
          </div>
        </div>

        <Card className="rounded-md border border-gray-200 p-5">
          <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Driver</p>
              <p className="font-medium">{record.driver}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">No Polisi</p>
              <p className="font-medium">{record.noPolisi}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rute</p>
              <p className="font-medium">
                {record.ruteAsal} - {record.ruteTujuan}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tanggal Berangkat</p>
              <p className="font-medium">{record.tglBerangkat}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tanggal Kembali</p>
              <p className="font-medium">{record.tglKembali || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Muatan</p>
              <p className="font-medium">{record.muatan}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-800 uppercase">Laporan Target Income Ekspedisi PT Wajira Jagatrara Transindo</p>
          <LPJDetailTable items={detailRows} />
        </div>

        <Card className="rounded-md border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900">Ringkasan Biaya</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Biaya BBM</p>
              <p className="font-medium">{rupiah.format(Number(record.biayaBBM || 0))}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Biaya Tol</p>
              <p className="font-medium">{rupiah.format(Number(record.biayaTol || 0))}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Biaya Lainnya</p>
              <p className="font-medium">{rupiah.format(Number(record.biayaLainnya || 0))}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Biaya Operasional</p>
              <p className="font-semibold text-[#1e3a5f]">{rupiah.format(totalBiaya)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total KM</p>
              <p className="font-semibold">{record.totalKM} km</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Jumlah Motor</p>
              <p className="font-semibold">{record.jumlahMotor} unit</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
