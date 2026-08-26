import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import type { WithholdingTaxItem, WithholdingTaxPayload } from '@/types/withholding-tax.types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { useCreateWithholdingTax, useUpdateWithholdingTax, useWithholdingTaxDetail } from '@/hooks/useWithholdingTax';
import { useKas } from '@/hooks/useKas';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';
import { MoneyInput } from '@/components/ui/money-input';
import RequiredMark from '@/components/ui/required-mark';
import { useRouter } from 'next/router';

interface Props {
  item: WithholdingTaxItem | null;
  companyId: string | number;
  onSuccess: () => void;
  onCancel: () => void;
}

const parseCurrencyIDR = (value: string): number => {
  const numericString = value.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

export default function BuktiPotongForm({ item, companyId, onSuccess: onFinish, onCancel }: Props) {
  const [source, setSource] = useState<'internal' | 'external'>('internal');
  const [cashId, setCashId] = useState<string>('');
  const [unitTransactionId, setUnitTransactionId] = useState<string>('');
  const [noInvoice, setNoInvoice] = useState<string>('');
  const [withholdingNumber, setWithholdingNumber] = useState('');
  const [withholdingAge, setWithholdingAge] = useState('');
  const [pphAmountStr, setPphAmountStr] = useState('');
  const [pphDescription, setPphDescription] = useState('');
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  const { data: kasData, isLoading: isLoadingKas } = useKas(companyId);

  const { mutate: createItem, isPending: isCreating } = useCreateWithholdingTax();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateWithholdingTax();

  const isPending = isCreating || isUpdating;

  const kasOptions: SearchableSelectOption[] = useMemo(() => {
    if (!kasData?.data) return [];
    return kasData.data.map((kas: any) => ({
      value: String(kas.id),
      label: `${kas.code} - ${kas.cash_name || kas.description || ''}`,
      subtitle: kas.type,
    }));
  }, [kasData]);

  const router = useRouter();

  useEffect(() => {
    if (item) {
      setSource((item.source as 'internal' | 'external') || 'internal');
      setCashId(item.cash_id ? String(item.cash_id) : '');
      setUnitTransactionId(item.unit_transaction_id ? String(item.unit_transaction_id) : '');
      setNoInvoice(item.no_invoice || '');
      setWithholdingNumber(item.withholding_number || '');
      setWithholdingAge(item.withholding_age ? String(item.withholding_age) : '');
      setPphAmountStr(item.pph_amount ? formatCurrency(item.pph_amount) : '');
      setPphDescription(item.pph_description || '');
      setPaymentAmountStr(item.payment_amount ? formatCurrency(item.payment_amount) : '');
      // format date for input type="date"
      if (item.payment_date) {
        try {
          const dateObj = new Date(item.payment_date);
          setPaymentDate(dateObj.toISOString().split('T')[0]);
        } catch (e) {
          setPaymentDate(item.payment_date);
        }
      } else {
        setPaymentDate('');
      }
    } else {
      setSource('internal');
      setCashId('');
      setUnitTransactionId('');
      setNoInvoice('');
      setWithholdingNumber('');
      setWithholdingAge('');
      setPphAmountStr('');
      setPphDescription('');
      setPaymentAmountStr('');
      setPaymentDate('');
    }
  }, [item]);

  const handleCurrencyChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseCurrencyIDR(e.target.value);
    if (rawValue === 0 && e.target.value !== '') {
      setter(e.target.value.replace(/[^0-9Rp. ]/g, ''));
    } else {
      setter(formatCurrency(rawValue));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cashId) {
      toast.error('Kas wajib dipilih.');
      return;
    }

    if (!noInvoice.trim()) {
      toast.error('Nomor Invoice wajib diisi.');
      return;
    }

    if (!withholdingNumber.trim()) {
      toast.error('Nomor Bukti Potong wajib diisi.');
      return;
    }

    const rawPph = parseCurrencyIDR(pphAmountStr);
    const rawPayment = parseCurrencyIDR(paymentAmountStr);

    if (rawPayment <= 0) {
      toast.error('Jumlah pembayaran wajib diisi.');
      return;
    }

    if (!paymentDate) {
      toast.error('Tanggal pembayaran wajib diisi.');
      return;
    }

    const payload: WithholdingTaxPayload = {
      company_id: companyId,
      source,
      no_invoice: noInvoice,
      withholding_number: withholdingNumber,
      pph_description: pphDescription,
      payment_amount: rawPayment,
      payment_date: paymentDate,
    };

    if (withholdingAge) {
      payload.withholding_age = Number(withholdingAge);
    }

    if (rawPph > 0) {
      payload.pph_amount = rawPph;
    }

    if (cashId) {
      payload.cash_id = Number(cashId);
    }

    if (unitTransactionId && unitTransactionId.trim() !== '') {
      payload.unit_transaction_id = Number(unitTransactionId);
    }

    const onSuccess = () => {
      toast.success(`Data Bukti Potong berhasil ${item ? 'diperbarui' : 'disimpan'}.`);
      onFinish();
    };

    const onError = (error: unknown) => {
      let message = 'Terjadi kesalahan saat menyimpan data.';

      // Handle ApiValidationError specifically
      if (error && typeof error === 'object' && 'fieldErrors' in error) {
        const fieldErrors = (error as any).fieldErrors;
        if (fieldErrors && typeof fieldErrors === 'object') {
          const messages = Object.values(fieldErrors).flat();
          if (messages.length > 0) {
            message = messages.join(', ');
          }
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast.error(message);
    };

    if (item?.id) {
      updateItem({ id: item.id, payload }, { onSuccess, onError });
    } else {
      createItem(payload, { onSuccess, onError });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Sumber Bukti Potong <RequiredMark /></Label>
            <Select
              value={source}
              onValueChange={(val: string) => setSource(val as 'internal' | 'external')}
              disabled={isPending}
            >
              <SelectTrigger className="w-full bg-slate-50">
                <SelectValue placeholder="Pilih Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">Client, Supplier / Eksternal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pilih Kas <RequiredMark /></Label>
            <SearchableSelect
              value={cashId}
              onChange={setCashId}
              options={kasOptions}
              placeholder="Select an item"
              searchPlaceholder="Cari Kas..."
              emptyText="Data tidak ditemukan"
              loading={isLoadingKas}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <span className="text-md font-bold text-slate-900 mb-5">Detail Bukti Potong</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">

          <div className="space-y-2">
            <Label>Nomor Invoice <RequiredMark /></Label>
            <Input
              placeholder="Contoh: INV-PAKB-12/2932KN"
              value={noInvoice}
              onChange={(e) => setNoInvoice(e.target.value)}
              disabled={isPending}
              className="bg-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Nomor Bukti Potong <RequiredMark /></Label>
            <Input
              placeholder="Contoh: BPTR921031913"
              value={withholdingNumber}
              onChange={(e) => setWithholdingNumber(e.target.value)}
              disabled={isPending}
              className="bg-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Masa Bukti Potong</Label>
            <div className="relative flex items-center">
              <Input
                type="number"
                placeholder="Contoh: 1 (Opsional)"
                value={withholdingAge}
                onChange={(e) => setWithholdingAge(e.target.value)}
                disabled={isPending}
                className="bg-white pr-16"
              />
              <span className="absolute right-3 text-sm text-slate-500 pointer-events-none select-none bg-slate-200 px-2 py-1 rounded-md">
                Bulan
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nominal PPH</Label>
            <MoneyInput name="pph_amount" value={Number(pphAmountStr) || 0} onChangeValue={(val) => setPphAmountStr(val.toString())} onBlur={() => { }} disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label>Uang Muka PPH / Keterangan</Label>
            <Input
              placeholder="Contoh: Dari Bukti Potong"
              value={pphDescription}
              onChange={(e) => setPphDescription(e.target.value)}
              disabled={isPending}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Jumlah Pembayaran <RequiredMark /></Label>
            <MoneyInput name="payment_amount" value={Number(paymentAmountStr) || 0} onChangeValue={(val) => setPaymentAmountStr(val.toString())} onBlur={() => { }} disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Dibayar <RequiredMark /></Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={isPending}
              className="bg-white"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 pt-6 mt-8">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending} className="w-[140px] text-base font-semibold">
          Batal
        </Button>
        <Button type="submit" className="w-[140px] text-base font-semibold bg-[#1f4163] hover:bg-[#183552] text-white" disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}
