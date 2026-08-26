import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { DoInvoice, CreateFinanceInvoicePaymentPayload } from '@/types/create-invoice.types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { useCreateFinanceInvoicePayment } from '@/hooks/useDoInvoice';
import { useKas } from '@/hooks/useKas';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: DoInvoice | null;
  companyId: string | number;
}

const parseCurrencyIDR = (value: string): number => {
  const numericString = value.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
};

export default function FinanceInvoicePaymentModal({ isOpen, onClose, item, companyId }: Props) {
  const [cashId, setCashId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  
  const { data: kasData, isLoading: isLoadingKas } = useKas(companyId);
  const { mutate: createPayment, isPending } = useCreateFinanceInvoicePayment();

  const kasOptions: SearchableSelectOption[] = useMemo(() => {
    if (!kasData?.data) return [];
    return kasData.data.map((kas) => ({
      value: String(kas.id),
      label: `${kas.code} - ${kas.description}`,
      subtitle: kas.type,
    }));
  }, [kasData]);

  useEffect(() => {
    if (isOpen) {
      setCashId('');
      setAmountStr('');
    }
  }, [isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCurrencyIDR(e.target.value);
    if (rawValue === 0 && e.target.value !== '') {
      setAmountStr(e.target.value.replace(/[^0-9Rp. ]/g, ''));
    } else {
      setAmountStr(formatCurrency(rawValue));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!item?.id) {
      toast.error('Data Invoice tidak ditemukan.');
      return;
    }
    
    if (!cashId) {
      toast.error('Kas wajib dipilih.');
      return;
    }

    const rawAmount = parseCurrencyIDR(amountStr);
    if (rawAmount <= 0) {
      toast.error('Nominal pembayaran harus lebih dari 0.');
      return;
    }

    const payload: CreateFinanceInvoicePaymentPayload = {
      do_invoice_id: item.id,
      cash_id: Number(cashId),
      amount: rawAmount,
    };

    createPayment(payload, {
      onSuccess: () => {
        toast.success('Pembayaran Invoice berhasil disimpan.');
        onClose();
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan pembayaran.';
        toast.error(message);
      },
    });
  };

  if (!item) return null;

  const firstExp = item.expeditions?.[0];
  const invoiceEkspedisi = firstExp?.invoiceExpedition ?? 0;
  const additionalFee = (item.additional_fee ?? 0) + (item.other_fee ?? 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pembayaran Invoice</DialogTitle>
          <DialogDescription>
            Input pembayaran dari customer untuk invoice ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>No Surat Invoice</Label>
              <Input value={item.code || '-'} readOnly className="bg-slate-50 border-slate-200 text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input value={formatDate(item.date)} readOnly className="bg-slate-50 border-slate-200 text-slate-500" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Customer</Label>
            <Input value={item.customer?.name || '-'} readOnly className="bg-slate-50 border-slate-200 text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nominal Invoice</Label>
              <Input 
                value={formatCurrency(invoiceEkspedisi)} 
                readOnly 
                className="bg-slate-50 border-slate-200 text-slate-500" 
              />
            </div>
            <div className="space-y-2">
              <Label>Biaya Tambahan</Label>
              <Input 
                value={formatCurrency(additionalFee)} 
                readOnly 
                className="bg-slate-50 border-slate-200 text-slate-500" 
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label>Total Bayar</Label>
            <Input 
              placeholder="Rp 0" 
              value={amountStr} 
              onChange={handleAmountChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Kas Terkait</Label>
            <SearchableSelect
              value={cashId}
              onChange={setCashId}
              options={kasOptions}
              placeholder="Select an item"
              searchPlaceholder="Cari Kas..."
              emptyText="Data tidak ditemukan"
              loading={isLoadingKas}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
