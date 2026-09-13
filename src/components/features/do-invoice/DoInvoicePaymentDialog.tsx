import * as React from 'react';
import type { DoInvoiceBillingHistory, DoInvoiceBillingHistoryPayload } from '@/@types/do-invoice.types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileInput } from '@/components/ui/file-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface DoInvoicePaymentDialogProps {
  open: boolean;
  billingId: number;
  history?: DoInvoiceBillingHistory | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: DoInvoiceBillingHistoryPayload) => void | Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);

export function DoInvoicePaymentDialog({ open, billingId, history, isSubmitting, onOpenChange, onSubmit }: DoInvoicePaymentDialogProps) {
  const [cash, setCash] = React.useState(0);
  const [bca, setBca] = React.useState(0);
  const [usd, setUsd] = React.useState(0);
  const [paymentAt, setPaymentAt] = React.useState(today());
  const [note, setNote] = React.useState('');
  const [proof, setProof] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setCash(history?.cashPaymentAmount ?? 0);
    setBca(history?.bcaPaymentAmount ?? 0);
    setUsd(history?.bcaPaymentUsdAmount ?? 0);
    setPaymentAt(history?.paymentAt?.slice(0, 10) || today());
    setNote(history?.note ?? '');
    setProof(null);
  }, [history, open]);

  const handleProof = (file: File | null) => {
    if (file && !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Bukti bayar harus berupa JPG, PNG, atau PDF');
      return;
    }
    if (file && file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran bukti bayar maksimal 2MB');
      return;
    }
    setProof(file);
  };

  const handleSubmit = () => {
    if (cash <= 0 && bca <= 0 && usd <= 0) {
      toast.error('Isi minimal satu nominal pembayaran');
      return;
    }
    void onSubmit({
      do_invoice_billing_id: billingId,
      cash_payment_amount: cash,
      bca_payment_amount: bca,
      bca_payment_usd_amount: usd,
      payment_at: paymentAt,
      note: note.trim(),
      payment_proof: proof,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeOnInteractOutside={!isSubmitting} className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{history ? 'Edit Pembayaran' : 'Tambah Pembayaran'}</DialogTitle>
          <DialogDescription>Catat pembayaran kas, BCA IDR, atau BCA USD pada billing invoice.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="cash-payment">Kas Tunai (IDR)</Label><MoneyInput id="cash-payment" value={cash} onChangeValue={setCash} /></div>
          <div className="space-y-2"><Label htmlFor="bca-payment">BCA (IDR)</Label><MoneyInput id="bca-payment" value={bca} onChangeValue={setBca} /></div>
          <div className="space-y-2"><Label htmlFor="usd-payment">BCA (USD)</Label><MoneyInput id="usd-payment" currency="USD" value={usd} onChangeValue={setUsd} /></div>
          <div className="space-y-2"><Label htmlFor="payment-at">Tanggal Pembayaran</Label><Input id="payment-at" type="date" value={paymentAt} max="9999-12-31" onChange={(event) => setPaymentAt(event.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="payment-note">Catatan</Label><Textarea id="payment-note" value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="payment-proof">Bukti Bayar</Label><FileInput id="payment-proof" name="payment_proof" accept="image/jpeg,image/png,application/pdf" value={proof} onFileChange={handleProof} helperText="JPG, PNG, atau PDF maksimal 2MB" /></div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="button" loading={isSubmitting} disabled={isSubmitting} onClick={handleSubmit}>Simpan Pembayaran</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
