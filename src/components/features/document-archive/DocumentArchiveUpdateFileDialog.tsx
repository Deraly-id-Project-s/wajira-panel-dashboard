import React, { useState } from 'react';
import { toast } from 'sonner';
import { FormDialog } from '@/components/ui/form-dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import type { DocumentArchive } from '@/@types/document-archive.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentArchive: DocumentArchive | null;
  onSubmit: (file: File) => Promise<void>;
  isSubmitting?: boolean;
}

export function DocumentArchiveUpdateFileDialog({
  open,
  onOpenChange,
  documentArchive,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Pilih berkas baru terlebih dahulu');
      return;
    }
    await onSubmit(file);
    setFile(null);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) setFile(null);
    onOpenChange(val);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Ganti Berkas Dokumen"
      description={`Unggah berkas baru untuk dokumen: ${documentArchive?.name ?? ''}`}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Unggah Berkas Baru"
      disabled={!file}
    >
      <div className="space-y-4 py-2">
        {documentArchive && (
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
            <p className="text-slate-500">Berkas Saat Ini:</p>
            <p className="font-mono text-slate-800 font-medium truncate mt-0.5">{documentArchive.file}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Berkas Baru (PDF / DOCX) <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <input
              type="file"
              id="update-file-input"
              className="sr-only"
              accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  if (selected.size > 20 * 1024 * 1024) {
                    toast.error('Ukuran berkas maksimal 20MB');
                    return;
                  }
                  setFile(selected);
                }
              }}
            />
            {!file ? (
              <label
                htmlFor="update-file-input"
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 text-center hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition"
              >
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">Pilih berkas pengganti</p>
                <p className="text-xs text-slate-400 mt-1">Format PDF atau DOCX (Maks. 20MB)</p>
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
          Berkas lama di server penyimpanan akan otomatis dihapus dan digantikan oleh berkas baru ini.
        </p>
      </div>
    </FormDialog>
  );
}
