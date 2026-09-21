import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { LPJUploadValue } from './lpj-perjalanan.data';

interface UploadFieldProps {
  title: string;
  value: LPJUploadValue | null;
  onSelect: (file: File | null) => void;
  error?: string;
}

function UploadField({ title, value, onSelect, error }: UploadFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <label className={`flex min-h-24 cursor-pointer items-center justify-center rounded-md border px-4 py-6 text-center transition-colors ${error ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'}`}>
        <input autoComplete="off" type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onSelect(e.target.files?.[0] ?? null)} />
        <div className="space-y-1">
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-gray-300">
            <Upload className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-sm text-gray-600">Klik untuk upload foto kondisi saat muat</p>
          <p className="text-xs text-gray-400">PNG, JPG maksimal 5MB</p>
          {value && <p className="pt-1 text-xs font-medium text-blue-600">{value.fileName}</p>}
        </div>
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface LPJUploadSectionProps {
  values: {
    fotoKondisiMuat: LPJUploadValue | null;
    fotoKondisiBongkar: LPJUploadValue | null;
    lampiranNota: LPJUploadValue | null;
  };
  errors: Partial<Record<string, string>>;
  onFileChange: (field: 'fotoKondisiMuat' | 'fotoKondisiBongkar' | 'lampiranNota', file: File | null) => void;
}

export function LPJUploadSection({ values, errors, onFileChange }: LPJUploadSectionProps) {
  return (
    <section className="space-y-4 rounded-md border border-gray-200 bg-white p-6">
      <h4 className="text-lg font-semibold text-gray-900">Foto Kondisi & Nota</h4>

      <div className="space-y-4">
        <UploadField title="Foto Kondisi Muat" value={values.fotoKondisiMuat} onSelect={(file) => onFileChange('fotoKondisiMuat', file)} error={errors.fotoKondisiMuat} />
        <UploadField title="Foto Kondisi Bongkar" value={values.fotoKondisiBongkar} onSelect={(file) => onFileChange('fotoKondisiBongkar', file)} error={errors.fotoKondisiBongkar} />
        <UploadField title="Lampiran Nota/Bukti Pembayaran" value={values.lampiranNota} onSelect={(file) => onFileChange('lampiranNota', file)} error={errors.lampiranNota} />
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" className="h-0 w-0 overflow-hidden p-0" aria-hidden="true" tabIndex={-1} />
      </div>
    </section>
  );
}
