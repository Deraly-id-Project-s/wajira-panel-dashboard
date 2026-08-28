import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GoodsReceiptUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File | null) => Promise<void> | void;
  isSubmitting?: boolean;
}

export function GoodsReceiptUploadModal({ open, onOpenChange, onSubmit, isSubmitting = false }: GoodsReceiptUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) setFile(null);
  }, [open]);

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null);
      return;
    }

    const extension = nextFile.name.split('.').pop()?.toLowerCase() ?? '';
    const allowed = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];
    if (!allowed.includes(extension)) {
      toast.error('File nota harus berformat PDF, DOC, DOCX, JPG, JPEG, atau PNG');
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-md border-none p-0 shadow-2xl sm:max-w-[378px]">
        <div className="px-6 py-7">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-[18px] font-semibold text-slate-950">Upload Nota</DialogTitle>
            <p className="text-sm text-slate-500">Masukkan file yang akan diunggah</p>
          </DialogHeader>

          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await onSubmit(file);
            }}
            className="mt-6 space-y-5"
          >
            <input autoComplete="off"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              className="block h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-white file:text-sm"
            />

            <div className="space-y-3">
              <Button type="submit" disabled={isSubmitting} className="h-10 rounded-[8px] text-[16px] btn-primary!">
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 w-full rounded-[8px] border-slate-300 text-[16px] font-medium">
                Batal
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
