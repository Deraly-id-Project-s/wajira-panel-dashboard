import Image from 'next/image';
import { ExternalLink, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { isDocumentFile, isImageFile, isPdfFile, resolveInvoiceUrl } from './goods-receipt.utils';

interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceFile?: string | null;
}

export function InvoicePreviewModal({ open, onOpenChange, invoiceFile }: InvoicePreviewModalProps) {
  const url = resolveInvoiceUrl(invoiceFile);
  const isPdf = isPdfFile(invoiceFile);
  const isImage = isImageFile(invoiceFile);
  const isDocument = isDocumentFile(invoiceFile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[92vh] overflow-hidden rounded-none border-none bg-transparent p-0 shadow-none sm:max-w-[950px]">
        <div className="relative flex max-h-[92vh] flex-col rounded-md">
          <div className="absolute right-3 top-3 z-10">
            <Button type="button" variant="outline" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-[8px] border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!url ? (
            <div className="flex h-[60vh] items-center justify-center rounded-md bg-[#4c4c4c] p-8 text-center text-white">Nota belum tersedia.</div>
          ) : isPdf ? (
            <div className="flex h-[82vh] flex-col rounded-md bg-[#4c4c4c] p-6">
              <div className="mb-4 flex justify-end">
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/50 px-3 py-2 text-sm text-white">
                  <ExternalLink className="h-4 w-4" />
                  Buka file
                </a>
              </div>
              <iframe title="Invoice preview" src={url} className="h-full w-full rounded-md bg-white" />
            </div>
          ) : isImage ? (
            <div className="flex h-[82vh] items-center justify-center rounded-md bg-[#4c4c4c] p-6">
              <div className="relative h-full w-full">
                <Image src={url} alt="Nota" fill unoptimized className="object-contain" />
              </div>
            </div>
          ) : isDocument ? (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 rounded-md bg-[#4c4c4c] p-8 text-center text-white">
              <p>Preview untuk file DOC/DOCX tidak tersedia di modal.</p>
              <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/50 px-3 py-2 text-sm text-white">
                <ExternalLink className="h-4 w-4" />
                Buka file
              </a>
            </div>
          ) : (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4 rounded-md bg-[#4c4c4c] p-8 text-center text-white">
              <p>Format file nota belum didukung untuk preview.</p>
              <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/50 px-3 py-2 text-sm text-white">
                <ExternalLink className="h-4 w-4" />
                Buka file
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
