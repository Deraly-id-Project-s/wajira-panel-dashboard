import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LPJCargoSection } from './LPJCargoSection';
import { LPJNotesSection } from './LPJNotesSection';
import { LPJOperationalCostSection } from './LPJOperationalCostSection';
import { LPJTruckSection } from './LPJTruckSection';
import { LPJUploadSection } from './LPJUploadSection';
import type { LPJFormValues } from './lpj-perjalanan.data';
import { Save } from 'lucide-react';

interface LPJFormProps {
  defaultValues: LPJFormValues;
  onSubmit: (values: LPJFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function LPJForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Simpan' }: LPJFormProps) {
  const [values, setValues] = useState<LPJFormValues>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const totalKM = useMemo(() => {
    const kmAwal = Number(values.kmAwal || 0);
    const kmAkhir = Number(values.kmAkhir || 0);
    if (!Number.isFinite(kmAwal) || !Number.isFinite(kmAkhir)) return 0;
    return Math.max(kmAkhir - kmAwal, 0);
  }, [values.kmAwal, values.kmAkhir]);

  const handleValueChange = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleFileChange = (field: 'fotoKondisiMuat' | 'fotoKondisiBongkar' | 'lampiranNota', file: File | null) => {
    if (!file) {
      setValues((prev) => ({ ...prev, [field]: null }));
      setErrors((prev) => ({ ...prev, [field]: '' }));
      return;
    }

    const isValidType = file.type === 'image/png' || file.type === 'image/jpeg';
    if (!isValidType) {
      setErrors((prev) => ({ ...prev, [field]: 'File harus PNG atau JPG' }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, [field]: 'Ukuran maksimal file 5MB' }));
      return;
    }

    setValues((prev) => ({
      ...prev,
      [field]: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<string, string>> = {};

    if (!values.driver.trim()) nextErrors.driver = 'Nama driver wajib diisi';
    if (!values.noPolisi.trim()) nextErrors.noPolisi = 'No polisi wajib diisi';
    if (!values.tglBerangkat.trim()) nextErrors.tglBerangkat = 'Tanggal berangkat wajib diisi';
    if (!values.ruteAsal.trim()) nextErrors.ruteAsal = 'Rute asal wajib diisi';
    if (!values.ruteTujuan.trim()) nextErrors.ruteTujuan = 'Rute tujuan wajib diisi';
    if (!values.jumlahMotor.trim()) nextErrors.jumlahMotor = 'Jumlah motor wajib diisi';
    if (!values.nomorRangkaText.trim()) nextErrors.nomorRangkaText = 'Nomor rangka wajib diisi';
    if (!values.kmAwal.trim()) nextErrors.kmAwal = 'KM awal wajib diisi';
    if (!values.kmAkhir.trim()) nextErrors.kmAkhir = 'KM akhir wajib diisi';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LPJTruckSection
        values={{
          driver: values.driver,
          noPolisi: values.noPolisi,
          tglBerangkat: values.tglBerangkat,
          tglKembali: values.tglKembali,
          ruteAsal: values.ruteAsal,
          ruteTujuan: values.ruteTujuan,
        }}
        errors={errors}
        onValueChange={handleValueChange}
      />

      <LPJCargoSection values={{ jumlahMotor: values.jumlahMotor, nomorRangkaText: values.nomorRangkaText }} errors={errors} onValueChange={handleValueChange} />

      <LPJOperationalCostSection
        values={{
          kmAwal: values.kmAwal,
          kmAkhir: values.kmAkhir,
          biayaBBM: values.biayaBBM,
          biayaTol: values.biayaTol,
          biayaLainnya: values.biayaLainnya,
        }}
        errors={errors}
        totalKM={totalKM}
        onValueChange={handleValueChange}
      />

      <LPJUploadSection
        values={{
          fotoKondisiMuat: values.fotoKondisiMuat,
          fotoKondisiBongkar: values.fotoKondisiBongkar,
          lampiranNota: values.lampiranNota,
        }}
        errors={errors}
        onFileChange={handleFileChange}
      />

      <LPJNotesSection
        values={{
          catatanKerusakan: values.catatanKerusakan,
          catatanKeterlambatan: values.catatanKeterlambatan,
          catatanTambahan: values.catatanTambahan,
        }}
        onValueChange={handleValueChange}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" className="button-theme-1!">
          <Save className="h-4 w-4" />
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
