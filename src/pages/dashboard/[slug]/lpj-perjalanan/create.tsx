import { useRouter } from 'next/router';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LPJForm } from '@/components/features/lpj-perjalanan/LPJForm';
import { DUMMY_LPJ_RECORDS, buildLPJFormDefaults, setDummyLPJRecords, toLPJRecord, type LPJFormValues } from '@/components/features/lpj-perjalanan/lpj-perjalanan.data';

export default function CreateLPJPerjalananPage() {
  const router = useRouter();
  const { slug } = router.query;

  const handleSave = (values: LPJFormValues) => {
    const newId = DUMMY_LPJ_RECORDS.length > 0 ? Math.max(...DUMMY_LPJ_RECORDS.map((item) => item.id)) + 1 : 1;
    const kodeLPJ = `LPJ-WJR${String(newId).padStart(2, '0')}`;
    const payload = toLPJRecord(newId, kodeLPJ, values);

    setDummyLPJRecords([payload, ...DUMMY_LPJ_RECORDS]);
    toast.success('Data LPJ berhasil ditambahkan');
    router.push(`/dashboard/${slug}/lpj-perjalanan`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button type="button" onClick={() => router.back()} className="rounded-md p-1 transition-colors hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-[34px] font-semibold text-gray-900 leading-none">Detail LPJ</h1>
            <p className="text-sm text-gray-500 mt-1">Kode LPJ -</p>
          </div>
        </div>

        <LPJForm defaultValues={buildLPJFormDefaults()} onSubmit={handleSave} onCancel={() => router.back()} submitLabel="Simpan" />
      </div>
    </DashboardLayout>
  );
}
