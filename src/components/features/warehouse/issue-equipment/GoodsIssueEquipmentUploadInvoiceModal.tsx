import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import type { GoodsIssueEquipment } from '@/@types/goods-issue-equipment.types';
import { toast } from 'sonner';

interface GoodsIssueEquipmentUploadInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => Promise<void> | void;
  isSubmitting?: boolean;
  initialData?: GoodsIssueEquipment | null;
}

export function GoodsIssueEquipmentUploadInvoiceModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialData,
}: GoodsIssueEquipmentUploadInvoiceModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Format file tidak didukung. Harap upload file PDF atau Gambar (PNG/JPG).');
        return;
      }

      // Max size: 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar. Maksimal ukuran file adalah 5MB.');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Format file tidak didukung. Harap upload file PDF atau Gambar (PNG/JPG).');
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar. Maksimal ukuran file adalah 5MB.');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Harap pilih file terlebih dahulu.');
      return;
    }
    await onSubmit(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-[20px] border-none p-0 shadow-2xl sm:max-w-[400px]">
        <div className="px-5 py-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">Upload Invoice</DialogTitle>
            <p className="text-sm text-slate-500">
              Upload file invoice untuk transaksi <span className="font-semibold text-slate-800">{initialData?.code}</span>
            </p>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="mt-6 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <input autoComplete="off"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Upload className="h-8 w-8 text-slate-400 mb-3" />
              <p className="text-[14px] font-medium text-slate-800">
                Pilih file atau seret file ke sini
              </p>
              <p className="text-[12px] text-slate-500 mt-1">
                PDF, PNG, JPG (Maks. 5MB)
              </p>
            </div>

            {file ? (
              <div className="flex items-center justify-between rounded-[10px] border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-[12px] text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {initialData?.invoiceFile ? (
              <p className="text-[13px] text-slate-500 text-center">
                * Transaksi ini sudah memiliki invoice. Upload kembali untuk mengganti invoice lama.
              </p>
            ) : null}

            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                disabled={!file || isSubmitting}
                className="h-10 rounded-[8px] text-[16px] button-theme-1!"
              >
                {isSubmitting ? 'Mengupload...' : 'Upload'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 w-full rounded-[8px] border-slate-300 text-[16px] font-medium"
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
