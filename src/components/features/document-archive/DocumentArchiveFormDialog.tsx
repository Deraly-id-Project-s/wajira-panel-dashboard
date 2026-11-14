import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles, Upload, FileText, X } from 'lucide-react';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getLatestDocumentNumber } from '@/services/document-archive.service';
import type {
  CreateDocumentArchivePayload,
  DocumentArchive,
  DocumentArchiveType,
  UpdateDocumentArchivePayload,
} from '@/@types/document-archive.types';
import { DOCUMENT_ARCHIVE_TYPE_OPTIONS } from '@/@types/document-archive.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentArchive: DocumentArchive | null;
  onSubmit: (payload: CreateDocumentArchivePayload | UpdateDocumentArchivePayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function DocumentArchiveFormDialog({
  open,
  onOpenChange,
  documentArchive,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const isEdit = Boolean(documentArchive);

  const [name, setName] = useState('');
  const [type, setType] = useState<DocumentArchiveType>('report');
  const [documentCode, setDocumentCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [expiredAt, setExpiredAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isFetchingCode, setIsFetchingCode] = useState(false);

  useEffect(() => {
    if (documentArchive) {
      setName(documentArchive.name);
      setType(documentArchive.type);
      setDocumentCode(documentArchive.documentCode || '');
      setIsActive(documentArchive.isActive);
      setExpiredAt(documentArchive.expiredAt ? documentArchive.expiredAt.substring(0, 10) : '');
      setNotes(documentArchive.notes || '');
      setFile(null);
    } else {
      setName('');
      setType('report');
      setDocumentCode('');
      setIsActive(true);
      setExpiredAt('');
      setNotes('');
      setFile(null);
    }
  }, [documentArchive, open]);

  const handleFetchSuggestedCode = async () => {
    setIsFetchingCode(true);
    try {
      const res = await getLatestDocumentNumber(type);
      if (res?.suggested_code) {
        setDocumentCode(res.suggested_code);
        toast.success(`Kode saran diperoleh: ${res.suggested_code}`);
      }
    } catch {
      toast.error('Gagal mengambil saran kode dokumen otomatis');
    } finally {
      setIsFetchingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama dokumen wajib diisi');
      return;
    }

    if (!isEdit && !file) {
      toast.error('Berkas dokumen (PDF atau DOCX) wajib diunggah');
      return;
    }

    if (isEdit) {
      const updatePayload: UpdateDocumentArchivePayload = {
        name: name.trim(),
        type,
        document_code: documentCode.trim(),
        is_active: isActive,
        expired_at: expiredAt || null,
        notes: notes.trim() || null,
      };
      await onSubmit(updatePayload);
    } else {
      const createPayload: CreateDocumentArchivePayload = {
        name: name.trim(),
        type,
        file: file!,
        document_code: documentCode.trim() || undefined,
        is_active: isActive,
        expired_at: expiredAt || null,
        notes: notes.trim() || null,
      };
      await onSubmit(createPayload);
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Arsip Dokumen' : 'Tambah Arsip Dokumen'}
      description={
        isEdit
          ? 'Perbarui informasi metadata arsip dokumen.'
          : 'Unggah dan simpan berkas dokumen ke sistem arsip digital.'
      }
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Simpan Dokumen'}
      maxWidthClassName="max-w-xl"
    >
      <div className="space-y-4 py-1">
        {/* Nama Dokumen */}
        <div className="space-y-1.5">
          <Label htmlFor="archive-name" className="text-sm font-medium">
            Nama Dokumen <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="archive-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Laporan Arus Kas Periode November 2026"
            required
            autoFocus
          />
        </div>

        {/* Tipe Dokumen & Kode Dokumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="archive-type" className="text-sm font-medium">
              Tipe Dokumen <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(val) => setType(val as DocumentArchiveType)}
            >
              <SelectTrigger id="archive-type" className="w-full">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_ARCHIVE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="archive-code" className="text-sm font-medium">
                Kode Dokumen
              </Label>
              <button
                type="button"
                onClick={handleFetchSuggestedCode}
                disabled={isFetchingCode}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                {isFetchingCode ? 'Mengambil...' : 'Ambil Kode'}
              </button>
            </div>
            <Input
              id="archive-code"
              value={documentCode}
              onChange={(e) => setDocumentCode(e.target.value.toUpperCase())}
              placeholder="Auto-generate jika kosong"
              className="font-mono text-sm uppercase"
            />
          </div>
        </div>

        {/* File Upload (Hanya saat create, atau preview info saat edit) */}
        {!isEdit ? (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Berkas Dokumen (PDF / DOCX) <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <input
                type="file"
                id="archive-file-input"
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
                  htmlFor="archive-file-input"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 text-center hover:border-slate-400 hover:bg-slate-50 cursor-pointer transition"
                >
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">Pilih berkas PDF atau DOCX</p>
                  <p className="text-xs text-slate-400 mt-1">Maksimal ukuran berkas 20MB</p>
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
        ) : (
          documentArchive?.file && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Berkas Tersimpan:</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-800 truncate max-w-sm">
                  {documentArchive.file}
                </span>
                {documentArchive.fileUrl && (
                  <a
                    href={documentArchive.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0 ml-2"
                  >
                    Buka Berkas
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Gunakan aksi &apos;Ganti Berkas&apos; di tabel jika ingin mengunggah file baru pengganti berkas ini.
              </p>
            </div>
          )
        )}

        {/* Tanggal Kedaluwarsa & Status Aktif */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="space-y-1.5">
            <Label htmlFor="archive-expired" className="text-sm font-medium">
              Tanggal Kedaluwarsa (Opsional)
            </Label>
            <Input
              id="archive-expired"
              type="date"
              value={expiredAt}
              onChange={(e) => setExpiredAt(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 sm:mt-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Status Aktif</p>
              <p className="text-xs text-slate-500">Tampilkan sebagai dokumen aktif</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        {/* Catatan / Keterangan */}
        <div className="space-y-1.5">
          <Label htmlFor="archive-notes" className="text-sm font-medium">
            Catatan Tambahan
          </Label>
          <Textarea
            id="archive-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan atau keterangan mengenai dokumen..."
            rows={3}
          />
        </div>
      </div>
    </FormDialog>
  );
}
