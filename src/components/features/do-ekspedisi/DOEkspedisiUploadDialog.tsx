import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileInput } from '@/components/ui/file-input';

interface DOEkspedisiUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function DOEkspedisiUploadDialog({ open, onOpenChange, onSubmit, isSubmitting = false }: DOEkspedisiUploadDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (!open) setFile(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[364px] rounded-md p-6" showCloseButton={false}>
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-base font-semibold text-slate-950">Upload Invoice</DialogTitle>
          <DialogDescription>Masukkan file yang akan diunggah</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (file) void onSubmit(file);
          }}
        >
          <FileInput value={file} onFileChange={setFile} className="h-9 rounded-md border-slate-200" />
          <Button type="submit" disabled={!file || isSubmitting} className="h-9 rounded-md btn-primary!">
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)} className="h-9 w-full rounded-md">
            Batal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
