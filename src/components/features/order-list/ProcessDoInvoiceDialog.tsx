import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProcessDoInvoiceDialogProps {
  open: boolean;
  orderCode?: string;
  isProcessing?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function ProcessDoInvoiceDialog({
  open,
  orderCode,
  isProcessing = false,
  onOpenChange,
  onConfirm,
}: ProcessDoInvoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeOnInteractOutside={!isProcessing} showCloseButton={!isProcessing}>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
            <FileText className="h-5 w-5" />
          </div>
          <DialogTitle>Proses DO Invoice?</DialogTitle>
          <DialogDescription>
            Order {orderCode || '-'} akan dibuatkan invoice dan billing. Proses ini hanya tersedia sekali untuk order yang sudah selesai.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isProcessing} onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" disabled={isProcessing} loading={isProcessing} onClick={() => void onConfirm()}>
            Proses DO Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
