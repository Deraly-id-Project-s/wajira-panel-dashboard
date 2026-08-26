import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { UJDriverItem, CreateUJDriverPaymentPayload } from '@/types/uj-driver.types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { useCreateUJDriverPayment } from '@/hooks/finance/useUJDriver';
import { useKas } from '@/hooks/useKas';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: UJDriverItem | null;
  companyId: string | number;
}

const parseCurrencyIDR = (value: string): number => {
  const numericString = value.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

export default function UJDriverPaymentModal({ isOpen, onClose, item, companyId }: Props) {
  const [cashId, setCashId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  
  const { data: kasData, isLoading: isLoadingKas } = useKas(companyId);
  const { mutate: createPayment, isPending } = useCreateUJDriverPayment();

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
      toast.error('Data DO Expedition tidak ditemukan.');
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

    const payload: CreateUJDriverPaymentPayload = {
      do_expedition_id: item.id,
      cash_id: Number(cashId),
      amount: rawAmount,
    };

    createPayment(payload, {
      onSuccess: () => {
        toast.success('Pembayaran UJ Driver berhasil disimpan.');
        onClose();
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan pembayaran.';
        toast.error(message);
      },
    });
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pembayaran UJ Driver</DialogTitle>
          <DialogDescription>
            Pembayaran UJ Driver dan lainnya
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Kode DO</Label>
            <Input value={item.code || '-'} readOnly className="bg-slate-50 border-slate-200 text-slate-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={item.order_list?.customer?.name || '-'} readOnly className="bg-slate-50 border-slate-200 text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label>Driver</Label>
              <Input value={item.driver?.name || '-'} readOnly className="bg-slate-50 border-slate-200 text-slate-500" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nominal UJ Driver</Label>
            <Input 
              value={item.order_list?.uj_driver ? formatCurrency(item.order_list.uj_driver) : '-'} 
              readOnly 
              className="bg-slate-50 border-slate-200 text-slate-500" 
            />
          </div>

          <div className="space-y-2">
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
