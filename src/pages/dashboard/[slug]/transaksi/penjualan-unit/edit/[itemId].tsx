import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Check, ChevronsUpDown } from 'lucide-react';
import { UnitTransactionForm } from '@/components/features/unit-transaction/UnitTransactionForm';
import { type UnitTransactionFormValues } from '@/components/features/unit-transaction/unit-transaction.schema';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useSalesDetail, useUpdateSales } from '@/hooks/useSales';
import { mapSalesDetailToEditForm } from '@/services/sales.mapper';
import { useCompany } from '@/contexts/CompanyContext';
import { getCustomerById, getCustomers } from '@/services/customer.service';
import { mapCustomerDetailToSalesForm, mapCustomerToSalesOption, SalesCustomerOption } from '@/services/sales-customer.mapper';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';

/**
 * Edit Unit Page - Penjualan Unit
 * Layout: Breadcrumb → Title/Invoice → Form card → Actions
 */
export default function EditUnitPage() {
  const router = useRouter();
  const { companyId } = useCompany();
  const { itemId, slug: slugQuery } = router.query;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';
  const salesId = Array.isArray(itemId) ? itemId[0] : itemId;
  const { data, isLoading, isError } = useSalesDetail(salesId);
  const updateMutation = useUpdateSales();

  const [customerList, setCustomerList] = useState<SalesCustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SalesCustomerOption | null>(null);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isLoadingCustomerList, setIsLoadingCustomerList] = useState(false);
  const [isLoadingCustomerDetail, setIsLoadingCustomerDetail] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    tanggal: '',
    alamat: '',
    npwp: '',
  });

  const formData: UnitTransactionFormValues | null = useMemo(() => {
    if (!data?.raw) return null;
    return mapSalesDetailToEditForm(data.raw);
  }, [data?.raw]);

  const invoiceCode = data?.raw?.code ?? '';
  const basePath = slug ? `/dashboard/${slug}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';

  useEffect(() => {
    if (!salesId || isLoading) return;

    if (isError || !data?.raw) {
      toast.error('Data penjualan tidak ditemukan');
      router.push(basePath);
    }
  }, [data?.raw, isError, isLoading, router, salesId, basePath]);

  // Load all customers for the combobox
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

  // Initialize form state when details are loaded
  useEffect(() => {
    if (data?.raw) {
      const initialCustomerId = String((data.raw as any).person_id ?? data.raw.person?.id ?? '');
      setForm((prev) => ({
        ...prev,
        customerId: initialCustomerId,
        tanggal: data.raw.created_at ? data.raw.created_at.slice(0, 10) : '',
      }));

      if (initialCustomerId) {
        const loadInitialCustomerDetail = async () => {
          try {
            setIsLoadingCustomerDetail(true);
            const detail = await getCustomerById(initialCustomerId);
            const mapped = mapCustomerDetailToSalesForm(detail);
            setForm((prev) => ({
              ...prev,
              alamat: mapped.alamat,
              npwp: mapped.npwp,
            }));
          } catch {
            // silent fail
          } finally {
            setIsLoadingCustomerDetail(false);
          }
        };
        loadInitialCustomerDetail();
      }
    }
  }, [data?.raw]);

  // Auto-set the selected dropdown label when customer list is loaded
  useEffect(() => {
    if (customerList.length > 0 && form.customerId) {
      const option = customerList.find((opt) => opt.value === form.customerId);
      if (option) {
        setSelectedCustomer(option);
      }
    }
  }, [customerList, form.customerId]);

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

  /**
   * Handle form submit - API READY
   */
  const handleSubmit = async (formValues: UnitTransactionFormValues) => {
    try {
      if (!salesId || !data?.raw) {
        toast.error('Data penjualan tidak ditemukan');
        return;
      }

      const customerId = Number(form.customerId);
      const companyIdNumber = Number(companyId || (data.raw as any).company_id || 0);

      if (!customerId) {
        toast.error('Customer wajib dipilih');
        return;
      }

      const payload = {
        company_id: companyIdNumber,
        person_id: customerId,
        warehouse_id: Number(data.raw.warehouse?.id ?? (data.raw as any).warehouse_id ?? 1),
        code: data.raw.code ?? invoiceCode,
        type: 'sales' as const,
        max_capacity: Number(data.raw.max_capacity ?? 1),
        stock_state: data.raw.stock_state ?? 'draft',
      };

      await updateMutation.mutateAsync({ id: salesId, payload });

      toast.success('Data berhasil disimpan!');
      router.push(basePath);
    } catch (error) {
      toast.error('Gagal menyimpan data. Silakan coba lagi.');
    }
  };

  const handleCancel = () => {
    if (confirm('Batalkan perubahan?')) {
      router.back();
    }
  };

  if (isLoading || !formData) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Penjualan Unit', onClick: () => router.push(basePath) },
            { label: 'Edit Penjualan' }
          ]}
          title="Edit Penjualan"
          subtitle={
            <>
              <span>Kode Jual:</span>
              <span className="text-blue-600 font-medium">{invoiceCode}</span>
            </>
          }
          onBack={() => router.push(basePath)}
        />

        {/* Form Card - Border 1px, Radius 12px, Padding 24px */}
        <Card className="rounded-md border border-gray-200 shadow-none">
          <CardContent className="p-6">
            <UnitTransactionForm
            type="sales"
            allowCreateTypeUnit
              defaultValues={formData}
              prependFields={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2 flex flex-col">
                    <Label className="text-sm font-medium">Tanggal</Label>
                    <Input
                      type="date"
                      value={form.tanggal}
                      onChange={(e) => setForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                      className="bg-transparent"
                    />
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <Label className="text-sm font-medium">Customer</Label>
                    <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" role="combobox" aria-expanded={isCustomerOpen} className="w-full justify-between bg-transparent font-normal">
                          <span className={cn('truncate', !selectedCustomer && 'text-muted-foreground')}>
                            {selectedCustomer ? selectedCustomer.label : isLoadingCustomerList ? 'Memuat customer...' : 'Pilih customer'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Cari customer (kode/nama)..." />
                          <CommandList>
                            <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {customerList.map((option) => (
                                <CommandItem key={option.value} value={option.keyword} onSelect={() => handleSelectCustomer(option)}>
                                  <Check className={cn('mr-2 h-4 w-4', form.customerId === option.value ? 'opacity-100' : 'opacity-0')} />
                                  {option.label}
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
                </div>
              }
              hideItemFields={true}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitDisabled={updateMutation.isPending || isLoadingCustomerList || isLoadingCustomerDetail}
              cancelDisabled={updateMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
