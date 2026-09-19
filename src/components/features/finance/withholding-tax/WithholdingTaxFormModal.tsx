import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { WithholdingTaxItem, WithholdingTaxPayload } from '@/@types/withholding-tax.types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect, type SearchableSelectOption } from '@/components/features/vehicle-data/SearchableSelect';
import { useCreateWithholdingTax, useUpdateWithholdingTax, useWithholdingTaxDetail } from '@/hooks/useWithholdingTax';
import { useKas } from '@/hooks/useKas';
import { useDoInvoices } from '@/hooks/useDoInvoice';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: WithholdingTaxItem | null;
  companyId: string | number;
}

const parseCurrencyIDR = (value: string): number => {
  const numericString = value.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

export default function WithholdingTaxFormModal({ isOpen, onClose, item, companyId }: Props) {
  const [source, setSource] = useState<'internal' | 'external'>('internal');
  const [cashId, setCashId] = useState<string>('');
  const [doInvoiceId, setDoInvoiceId] = useState<string>('');
  const [withholdingNumber, setWithholdingNumber] = useState('');
  const [withholdingAge, setWithholdingAge] = useState('');
  const [pphAmountStr, setPphAmountStr] = useState('');
  const [pphDescription, setPphDescription] = useState('');
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  // Fetch detail if editing to prefill properly
  const { data: detailData, isLoading: isLoadingDetail } = useWithholdingTaxDetail(isOpen && item?.id ? item.id : null);

  const { data: kasData, isLoading: isLoadingKas } = useKas(companyId);
  const { data: invoiceData, isLoading: isLoadingInvoice } = useDoInvoices({
    perPage: 100, // Fetch more for select, ideally search based
  });

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

  const invoiceOptions: SearchableSelectOption[] = useMemo(() => {
    if (!invoiceData?.data) return [];
    return invoiceData.data.map((inv) => ({
      value: String(inv.id),
      label: `${inv.code || '-'} - ${inv.customer?.name || '-'}`,
      subtitle: inv.date ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(inv.date)) : '',
    }));
  }, [invoiceData]);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        // We set initial values from item, but wait for detailData to populate completely if needed
        const dataToUse = detailData || item;
        setSource((dataToUse.source as 'internal' | 'external') || 'internal');
        setCashId(dataToUse.cash_id ? String(dataToUse.cash_id) : '');
        setDoInvoiceId(dataToUse.do_invoice_id ? String(dataToUse.do_invoice_id) : '');
        setWithholdingNumber(dataToUse.withholding_number || '');
        setWithholdingAge(dataToUse.withholding_age ? String(dataToUse.withholding_age) : '');
        setPphAmountStr(dataToUse.pph_amount ? formatCurrency(dataToUse.pph_amount) : '');
        setPphDescription(dataToUse.pph_description || '');
        setPaymentAmountStr(dataToUse.payment_amount ? formatCurrency(dataToUse.payment_amount) : '');
        // format date for input type="date"
        if (dataToUse.payment_date) {
          try {
            const dateObj = new Date(dataToUse.payment_date);
            setPaymentDate(dateObj.toISOString().split('T')[0]);
          } catch (e) {
            setPaymentDate(dataToUse.payment_date);
          }
        } else {
          setPaymentDate('');
        }
      } else {
        setSource('internal');
        setCashId('');
        setDoInvoiceId('');
        setWithholdingNumber('');
        setWithholdingAge('');
        setPphAmountStr('');
        setPphDescription('');
        setPaymentAmountStr('');
        setPaymentDate('');
      }
    }
  }, [isOpen, item, detailData]);

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

    if (!doInvoiceId) {
      toast.error('Invoice wajib dipilih.');
      return;
    }

    if (source === 'internal' && !cashId) {
      toast.error('Kas wajib dipilih untuk source internal.');
      return;
    }

    if (!withholdingNumber.trim()) {
      toast.error('Nomor Bukti Potong wajib diisi.');
      return;
    }

    const rawPph = parseCurrencyIDR(pphAmountStr);
    const rawPayment = parseCurrencyIDR(paymentAmountStr);

    if (rawPph <= 0) {
      toast.error('Nominal PPH wajib diisi.');
      return;
    }

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
      withholding_number: withholdingNumber,
      withholding_age: Number(withholdingAge),
      pph_amount: rawPph,
      pph_description: pphDescription,
      payment_amount: rawPayment,
      payment_date: paymentDate,
      no_invoice: '',
    };

    if (source === 'internal' && cashId) {
      payload.cash_id = Number(cashId);
    }

    const onSuccess = () => {
      toast.success(`Data Bukti Potong berhasil ${item ? 'diperbarui' : 'disimpan'}.`);
      onClose();
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Bukti Potong' : 'Tambah Bukti Potong'}</DialogTitle>
          <DialogDescription>
            {item ? 'Ubah detail data bukti potong.' : 'Tambahkan data bukti potong baru ke dalam sistem.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingDetail && item ? (
          <div className="py-10 text-center space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">

            <div className="space-y-3">
              <Label>Source</Label>
              <Select
                value={source}
                onValueChange={(val: string) => setSource(val as 'internal' | 'external')}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">Client / Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pilih Kas {source === 'internal' && <span className="text-red-500">*</span>}</Label>
                <SearchableSelect
                  value={cashId}
                  onChange={setCashId}
                  options={kasOptions}
                  placeholder="Select an item"
                  searchPlaceholder="Cari Kas..."
                  emptyText="Data tidak ditemukan"
                  loading={isLoadingKas}
                  disabled={source === 'external' || isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>Pilih DO Invoice <span className="text-red-500">*</span></Label>
                <SearchableSelect
                  value={doInvoiceId}
                  onChange={setDoInvoiceId}
                  options={invoiceOptions}
                  placeholder="Select an item"
                  searchPlaceholder="Cari Invoice..."
                  emptyText="Data tidak ditemukan"
                  loading={isLoadingInvoice}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor Bukti Potong <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Contoh: BPTR921031913"
                  value={withholdingNumber}
                  onChange={(e) => setWithholdingNumber(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Masa Bukti Potong <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  placeholder="Contoh: 1"
                  value={withholdingAge}
                  onChange={(e) => setWithholdingAge(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nominal PPH <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Rp 0"
                  value={pphAmountStr}
                  onChange={handleCurrencyChange(setPphAmountStr)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Keterangan PPH</Label>
                <Input
                  placeholder="Contoh: Dari Bukti Potong"
                  value={pphDescription}
                  onChange={(e) => setPphDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah Pembayaran <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Rp 0"
                  value={paymentAmountStr}
                  onChange={handleCurrencyChange(setPaymentAmountStr)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Pembayaran <span className="text-red-500">*</span></Label>
                <InputDate
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 justify-end border-t border-slate-100">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose} disabled={isPending}>
                Batal
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white" disabled={isPending}>
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
