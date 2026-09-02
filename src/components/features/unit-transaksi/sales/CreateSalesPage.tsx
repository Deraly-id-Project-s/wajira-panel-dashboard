'use client';


import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UnitTransactionForm } from '@/components/features/unit-transaksi/UnitTransactionForm';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from 'sonner';
import { useCreateSales } from '@/hooks/useSales';
import { useCompany } from '@/contexts/CompanyContext';
import { type UnitTransactionFormValues } from '@/components/features/unit-transaksi/unit-transaction.schema';
import { useEffect, useMemo, useState } from 'react';
import { generateSalesCode } from '@/lib/utils/sales';
import { getCustomerById, getCustomers } from '@/services/customer.service';
import { mapCustomerDetailToSalesForm, mapCustomerToSalesOption, SalesCustomerOption } from '@/services/sales-customer.mapper';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateUnitItem } from '@/hooks/useUnitTransactionItem';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { FormField, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DocumentTemplateSelect } from '@/components/ui/document-template-select';

type SalesCreateFormState = {
  customerId: string;
  unitTypeId: string;
  code: string;
  tanggal: string;
  alamat: string;
  npwp: string;
  qty?: number;
  price: number;
};

const DEFAULT_WAREHOUSE_ID = 1;

export default function CreateSalesPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const createSalesMutation = useCreateSales();
  const createItemMutation = useCreateUnitItem();
  const { data: unitTypeData, isLoading: isLoadingUnitTypes } = useTypeUnits({
    sort_by: 'created_at',
    sort_order: 'asc',
    company_id: companyId || 1
  });
  const slugQuery = router.query.slug;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';
  const salesPath = slug ? `/dashboard/${slug}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';
  const generatedCode = useMemo(() => generateSalesCode(router.query.slug), [router.query.slug]);

  const [customerList, setCustomerList] = useState<SalesCustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SalesCustomerOption | null>(null);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isLoadingCustomerList, setIsLoadingCustomerList] = useState(false);
  const [isLoadingCustomerDetail, setIsLoadingCustomerDetail] = useState(false);

  const [form, setForm] = useState<SalesCreateFormState>({
    customerId: '',
    unitTypeId: '',
    code: generatedCode,
    tanggal: new Date().toISOString().split('T')[0],
    alamat: '',
    npwp: '',
    qty: undefined,
    price: 0,
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, code: generatedCode }));
  }, [generatedCode]);

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      if (!companyId) return;
      try {
        setIsLoadingCustomerList(true);
        const response = await getCustomers({ company_id: companyId, perPage: 100, page: 1 });
        if (!isMounted) return;
        setCustomerList((response.data ?? []).map(mapCustomerToSalesOption));
      } catch {
        toast.error('Gagal memuat data customer');
      } finally {
        if (isMounted) setIsLoadingCustomerList(false);
      }
    };

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const handleSelectCustomer = async (option: SalesCustomerOption) => {
    setSelectedCustomer(option);
    setForm((prev) => ({ ...prev, customerId: option.value, alamat: '', npwp: '' }));
    setIsCustomerOpen(false);

    try {
      setIsLoadingCustomerDetail(true);
      const detail = await getCustomerById(option.value);
      const mapped = mapCustomerDetailToSalesForm(detail);
      setForm((prev) => ({
        ...prev,
        customerId: mapped.customerId,
        alamat: mapped.alamat,
        npwp: mapped.npwp,
      }));
    } catch {
      toast.error('Gagal mengambil detail customer');
    } finally {
      setIsLoadingCustomerDetail(false);
    }
  };

  const handleSubmit = async (data: UnitTransactionFormValues) => {
    const toNumber = (value: unknown) => {
      const normalized = Number(value ?? 0);
      return Number.isFinite(normalized) ? normalized : 0;
    };

    const customerId = Number(form.customerId || 0);
    const companyIdNumber = Number(companyId || 0);
    const unitTypeId = Number(data.unitTypeId || form.unitTypeId || 0);
    const qty = toNumber(data.qty);
    const price = toNumber(data.price);
    const biayaBbn = toNumber(data.bbnPrice);
    const biayaEkspedisi = toNumber(data.expeditionFee);
    const biayaLain = toNumber(data.otherFee);
    const dppTaxVersionId = data.dppTaxVersionId ? Number(data.dppTaxVersionId) : undefined;
    const ppnTaxVersionId = data.ppnTaxVersionId ? Number(data.ppnTaxVersionId) : undefined;

    if (!customerId) {
      toast.error('Customer wajib dipilih');
      return;
    }

    if (!companyIdNumber) {
      toast.error('Company tidak valid');
      return;
    }

    if (!unitTypeId) {
      toast.error('Tipe Unit wajib dipilih');
      return;
    }

    const transactionPayload = {
      company_id: companyIdNumber,
      person_id: customerId,
      warehouse_id: DEFAULT_WAREHOUSE_ID,
      code: form.code,
      type: 'sales' as const,
      max_capacity: qty,
      stock_state: 'draft',
      unit_type_id: unitTypeId,
      qty_total: qty,
      price,
      bbn_price: biayaBbn,
      expedition_fee: biayaEkspedisi,
      other_fee: biayaLain,
      price_usd: data.priceUsd ? Number(data.priceUsd) : undefined,
      price_per_unit_usd: data.pricePerUnitUsd ? Number(data.pricePerUnitUsd) : undefined,
      dpp_tax_id: dppTaxVersionId,
      ppn_tax_id: ppnTaxVersionId,
      document_template_id: data.documentTemplateId ?? null,
    };

    if (!transactionPayload.code?.trim()) {
      toast.error('Kode transaksi wajib diisi');
      return;
    }

    if (!transactionPayload.max_capacity || transactionPayload.max_capacity <= 0) {
      toast.error('QTY wajib diisi dan minimal 1');
      return;
    }

    const readErrorMessage = (error: unknown): string => {
      const err = error as any;
      const detail = err?.details;

      if (typeof detail === 'string' && detail.trim()) return detail;

      if (detail && typeof detail === 'object') {
        const text = Object.values(detail)
          .flatMap((value: any) => (Array.isArray(value) ? value : [value]))
          .map((value: any) => String(value))
          .join(', ')
          .trim();
        if (text) return text;
      }

      return String(err?.message ?? 'Gagal menambahkan penjualan unit');
    };

    try {
      const createdSales = await createSalesMutation.mutateAsync(transactionPayload);
      const createdId = createdSales?.id;

      toast.success('Penjualan unit berhasil ditambahkan');
      if (createdId) {
        router.push(`/dashboard/${slug}/transaksi/penjualan-unit/${createdId}`);
      } else {
        router.push(salesPath);
      }
    } catch (error) {
      const message = readErrorMessage(error);
      if (message.toLowerCase().includes('no stock available')) {
        toast.error('Stok untuk tipe unit ini tidak tersedia di warehouse. Silakan pilih tipe unit lain yang tersedia.');
        return;
      }
      toast.error(message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Penjualan Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`) },
            { label: 'Tambah Data Penjualan' }
          ]}
          title="Data Penjualan"
          subtitle={
            <>
              <span>Kode Jual:</span>
              <span className="font-semibold text-blue-600">{generatedCode}</span>
            </>
          }
          onBack={() => router.push(`/dashboard/${slug}/transaksi/penjualan-unit`)}
        />

        <div className="rounded-md border bg-white p-5 md:p-6 shadow-sm">
          <UnitTransactionForm
            type="sales"
            allowCreateTypeUnit
            defaultValues={{
              unitTypeId: form.unitTypeId,
              qty: form.qty,
              price: form.price,
              hppPerUnit: 0,
              hppTotal: 0,
              dppPerUnit: 0,
              dppTotal: 0,
              ppnPerUnit: 0,
              ppnTotal: 0,
              bbnPrice: 0,
              expeditionFee: 0,
              otherFee: 0,
            }}
            prependFields={(rhfForm) => (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 flex flex-col">
                  <Label className="text-sm font-medium">Tanggal</Label>
                  <Input
                    type="date"
                    value={form.tanggal}
                    onChange={(e) => setForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                    className="bg-transparent"
                  />
                </div>

                <div className="space-y-2 flex flex-col md:col-span-2">
                  <Label className="text-sm font-medium">Customer</Label>
                  <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" role="combobox" aria-expanded={isCustomerOpen} className="w-full justify-between bg-transparent font-normal">
                        <span className={cn('truncate', !selectedCustomer && 'text-muted-foreground')}>
                          {selectedCustomer ? selectedCustomer.name : isLoadingCustomerList ? 'Memuat customer...' : 'Pilih customer'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Cari customer (nama)..." />
                        <CommandList>
                          <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {customerList.map((option) => (
                              <CommandItem key={option.value} value={option.name} onSelect={() => handleSelectCustomer(option)}>
                                <Check className={cn('mr-2 h-4 w-4', form.customerId === option.value ? 'opacity-100' : 'opacity-0')} />
                                {option.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label className="text-sm font-medium">Alamat</Label>
                  <Input value={form.alamat} readOnly disabled className="bg-transparent" placeholder="Alamat customer" />
                </div>

                <div className="space-y-2 flex flex-col">
                  <Label className="text-sm font-medium">NPWP</Label>
                  <Input value={form.npwp} readOnly disabled className="bg-transparent" placeholder="NPWP customer" />
                </div>

                <FormField
                  control={rhfForm.control}
                  name="documentTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Document Template <span className="font-normal text-muted-foreground">(Opsional)</span></FormLabel>
                      <FormControl>
                        <DocumentTemplateSelect
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            typeUnitOptions={unitTypeData?.data ?? []}
            onSubmit={handleSubmit}
            onCancel={() => router.push(salesPath)}
            submitDisabled={createSalesMutation.isPending || createItemMutation.isPending || isLoadingCustomerList || isLoadingCustomerDetail || isLoadingUnitTypes}
            cancelDisabled={createSalesMutation.isPending || createItemMutation.isPending}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
