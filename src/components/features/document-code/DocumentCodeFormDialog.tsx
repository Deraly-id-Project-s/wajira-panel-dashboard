import React, { useEffect, useState } from 'react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { DocumentCode } from '@/@types/document-archive.types';
import { DOCUMENT_ARCHIVE_TYPE_LABELS } from '@/@types/document-archive.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentCode: DocumentCode | null;
  onSubmit: (payload: { code: string; description?: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function DocumentCodeFormDialog({
  open,
  onOpenChange,
  documentCode,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (documentCode) {
      setCode(documentCode.code || '');
      setDescription(documentCode.description || '');
    } else {
      setCode('');
      setDescription('');
    }
  }, [documentCode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    await onSubmit({
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Referensi Kode Dokumen"
      description="Perbarui prefix kode dan deskripsi penomoran otomatis dokumen."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Simpan Perubahan"
      disabled={!code.trim()}
    >
      <div className="space-y-4 py-2">
        {documentCode && (
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Tipe Dokumen</p>
              <p className="text-sm font-semibold text-slate-800">{documentCode.name}</p>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 capitalize">
              {DOCUMENT_ARCHIVE_TYPE_LABELS[documentCode.type] ?? documentCode.type}
            </Badge>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium">
            Prefix Kode Dokumen <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Contoh: RPT, INV, LTR"
            className="font-mono uppercase font-semibold"
            maxLength={10}
            required
            autoFocus
          />
          <p className="text-xs text-slate-500">
            Digunakan sebagai awalan penomoran otomatis (contoh: {code || 'RPT'}-202611-0001).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Deskripsi
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Catatan atau deskripsi fungsi kode ini..."
            rows={3}
          />
        </div>
      </div>
    </FormDialog>
  );
}
