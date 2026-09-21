'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { getSuppliers } from '@/services/supplier.service';
import { useCreateWarehouseData } from '@/hooks/useWarehouseActivity';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PenerimaanUnitFormDialog({ open, onClose }: Props) {
  const router = useRouter();
  const { companyId } = useCompany();
  const { data: supplierData, isLoading: supplierLoading } = useQuery({
    queryKey: ['supplier-options', companyId],
    queryFn: () =>
      getSuppliers({
        company_id: companyId || undefined,
        sort_order: 'asc',
        perPage: 1000,
      }),
    enabled: Boolean(companyId),
  });
  const create = useCreateWarehouseData();
  const [supplierOpen, setSupplierOpen] = useState(false);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    supplierId: '',
    keterangan: '',
  });

  const supplierOptions = useMemo(() => supplierData?.data ?? [], [supplierData]);

  const selectedSupplier = useMemo(() => {
    return supplierOptions.find((item) => String(item.id) === form.supplierId) || null;
  }, [supplierOptions, form.supplierId]);

  const generatedAccountCode = useMemo(() => {
    const today = new Date();
    const ymd = today.toISOString().slice(0, 10).replace(/-/g, '');
    const slugRaw = String(Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug || companyId || 'PT').toUpperCase();
    const safeSlug = slugRaw.replace(/[^A-Z0-9]/g, '');
    const anonCompany = safeSlug
      .split('')
      .reduce((acc, char) => (acc * 33 + char.charCodeAt(0)) % 99999, 7)
      .toString()
      .padStart(5, '0');
    const randomUnique = Math.floor(1000 + Math.random() * 9000);
    return `PRM-${anonCompany}-${ymd}-${randomUnique}`;
  }, [router.query.slug, companyId]);

  const handleSubmit = async () => {
    if (!form.tanggal || !form.supplierId) {
      toast.error('Tanggal penerimaan dan supplier wajib diisi');
      return;
    }

    try {
      await create.mutateAsync({
        person_id: Number(form.supplierId),
        warehouse_id: 1,
        activity_type: 'receipt',
        activity_date: form.tanggal,
        description: form.keterangan || `Penerimaan ${generatedAccountCode} - ${selectedSupplier?.name ?? '-'}`,
        type: 'unit-type',
      });

      toast.success('Data berhasil disimpan');
      onClose();
      setForm({
        tanggal: new Date().toISOString().split('T')[0],
        supplierId: '',
        keterangan: '',
      });
    } catch (error: unknown) {
      const fallback = 'Gagal menyimpan penerimaan unit';
      const apiError = error as {
        message?: string;
        details?: unknown;
        fieldErrors?: Record<string, string[]>;
        response?: { data?: { errors?: Record<string, string[]> } };
      };

      const errorObject = apiError?.fieldErrors ?? apiError?.response?.data?.errors ?? (apiError?.details as Record<string, unknown> | undefined);

      let detail = '';
      if (errorObject && typeof errorObject === 'object') {
        detail = Object.entries(errorObject)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? String(value[0]) : String(value)}`)
          .join(', ');
      }

      toast.error(detail || apiError?.message || fallback);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Input Penerimaan Unit</DialogTitle>
          <p className="text-sm text-gray-500">Masukkan detail penerimaan unit baru</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 text-sm">
            <label className="text-gray-700">Kode Akun</label>
            <Input value={generatedAccountCode} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-2 text-sm">
            <label className="text-gray-700">Tanggal Penerimaan</label>
            <InputDate value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
          </div>

          <div className="space-y-2 text-sm">
            <label className="text-gray-700">Nama Supplier</label>
            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" role="combobox" aria-expanded={supplierOpen} className="w-full justify-between font-normal bg-transparent">
                  <span className={cn('truncate', !selectedSupplier && 'text-gray-400')}>
                    {selectedSupplier ? selectedSupplier.name : supplierLoading ? 'Memuat supplier...' : 'Pilih supplier'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari supplier..." />
                  <CommandList>
                    <CommandEmpty>Supplier tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {supplierOptions.map((person) => (
                        <CommandItem
                          key={String(person.id)}
                          value={`${person.name} ${person.code ?? ''} ${person.id}`}
                          onSelect={() => {
                            setForm((prev) => ({ ...prev, supplierId: String(person.id) }));
                            setSupplierOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', form.supplierId === String(person.id) ? 'opacity-100' : 'opacity-0')} />
                          {person.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 text-sm">
            <label className="text-gray-700">Keterangan</label>
            <Textarea placeholder="Tulis keterangan di sini" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={3} />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Batal
          </Button>
          <Button className="w-full sm:w-auto bg-[#19355d]" onClick={handleSubmit} disabled={create.isPending || !form.supplierId || !form.tanggal}>
            {create.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
