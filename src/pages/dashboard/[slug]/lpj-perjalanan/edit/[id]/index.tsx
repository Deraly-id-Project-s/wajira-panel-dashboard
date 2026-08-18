import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LPJForm } from '@/components/features/lpj-perjalanan/LPJForm';
import { DUMMY_LPJ_RECORDS, buildLPJFormDefaults, setDummyLPJRecords, toLPJRecord, type LPJFormValues } from '@/components/features/lpj-perjalanan/lpj-perjalanan.data';

export default function EditLPJPerjalananPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const record = useMemo(() => {
    if (!id) return null;
    return DUMMY_LPJ_RECORDS.find((item) => item.id === Number(id)) ?? null;
  }, [id]);

  const handleSave = (values: LPJFormValues) => {
    if (!record) return;

    const payload = toLPJRecord(record.id, record.kodeLPJ, values);
    const updated = DUMMY_LPJ_RECORDS.map((item) => (item.id === record.id ? payload : item));
    setDummyLPJRecords(updated);
    toast.success('Data LPJ berhasil diperbarui');
    router.push(`/dashboard/${slug}/lpj-perjalanan`);
  };

  if (!record) {
    return (
      <DashboardLayout>
        <div className="flex h-75 items-center justify-center text-gray-500">Data LPJ tidak ditemukan</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => router.back()} className="rounded-md p-1 transition-colors hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-[34px] font-semibold text-gray-900 leading-none">Detail DO</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kode LPJ <span className="text-blue-600">{record.kodeLPJ}</span>
            </p>
          </div>
        </div>

        <LPJForm defaultValues={buildLPJFormDefaults(record)} onSubmit={handleSave} onCancel={() => router.back()} submitLabel="Simpan" />
      </div>
    </DashboardLayout>
  );
}
