import React, { useState, useMemo } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UnitTransactionForm } from '@/components/features/unit-transaksi/UnitTransactionForm';
import { type UnitTransactionFormValues } from '@/scheme/unit-transaction.schema';
import { toast } from 'sonner';
import { useCreateSales } from '@/hooks/useSales';
import { useCustomers } from '@/hooks/useCustomer';
import { useCompany } from '@/contexts/CompanyContext';
import { useRouter } from 'next/router';
import { generateSalesCode } from '@/lib/utils/sales';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface CreateSalesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateSalesModal({ isOpen, onClose, onSuccess }: CreateSalesModalProps) {
    const router = useRouter();
    const { companyId } = useCompany();
    const createSalesMutation = useCreateSales();
    const { data: customerData } = useCustomers({
        page: 1,
        perPage: 100,
        company_id: companyId ?? undefined,
        enabled: Boolean(companyId),
    });
    const generatedCode = generateSalesCode(router.query.slug);

    const [selectedCustomer, setSelectedCustomer] = useState<{ id: string | number; name: string; code?: string } | null>(null);
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);

    const customerOptions = useMemo(() => {
        return (customerData?.data ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            code: item.code,
            keyword: `${item.code ?? ''} ${item.name}`.toLowerCase(),
        }));
    }, [customerData?.data]);

    const handleSubmit = async (data: UnitTransactionFormValues) => {
        const customerId = Number(selectedCustomer?.id ?? 0);
        if (!customerId) {
            toast.error('Customer wajib dipilih');
            return;
        }

        const payload = {
            company_id: Number(companyId || 0),
            person_id: customerId,
            warehouse_id: 1,
            code: generatedCode,
            type: 'sales' as const,
            max_capacity: Number(data.qty ?? 0),
            stock_state: 'draft',
            unit_type_id: Number(data.unitTypeId || 0),
            qty_total: Number(data.qty ?? 0),
            price: Number(data.price ?? 0),
            bbn_price: Number(data.bbnPrice ?? 0),
            expedition_fee: Number(data.expeditionFee ?? 0),
            other_fee: Number(data.otherFee ?? 0),
            dpp_tax_id: data.dppTaxVersionId ? Number(data.dppTaxVersionId) : undefined,
            ppn_tax_id: data.ppnTaxVersionId ? Number(data.ppnTaxVersionId) : undefined,
            document_template_id: data.documentTemplateId ?? null,
        };

        if (!payload.max_capacity || payload.max_capacity <= 0) {
            toast.error('QTY wajib diisi dan minimal 1');
            return;
        }

        try {
            await createSalesMutation.mutateAsync(payload);
            toast.success('Penjualan unit berhasil ditambahkan');
            onClose();
            // Reset customer selection state
            setSelectedCustomer(null);
            if (onSuccess) onSuccess();
        } catch {
            toast.error('Gagal menambahkan penjualan unit');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-xl">Tambah Penjualan</DialogTitle>
                            <DialogDescription className="mt-2">
                                Masukkan detail penjualan unit baru.
                            </DialogDescription>
                        </div>
                        <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-100 mr-4">
                            Kode Jual: <span className="font-semibold">{generatedCode}</span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-2">
                    <UnitTransactionForm
                        type="sales"
                        allowCreateTypeUnit
                        defaultValues={{
                            unitTypeId: '',
                            qty: 1,
                            price: 0,
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
                        prependFields={
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Customer</Label>
                                    <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isCustomerOpen}
                                                className="w-full justify-between bg-transparent font-normal border border-input h-10 px-3"
                                            >
                                                <span className={cn('truncate', !selectedCustomer && 'text-muted-foreground')}>
                                                    {selectedCustomer ? `${selectedCustomer.code ?? ''} - ${selectedCustomer.name}` : 'Pilih customer'}
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
                                                        {customerOptions.map((option) => (
                                                            <CommandItem
                                                                key={option.id}
                                                                value={option.keyword}
                                                                onSelect={() => {
                                                                    setSelectedCustomer(option);
                                                                    setIsCustomerOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn('mr-2 h-4 w-4', selectedCustomer?.id === option.id ? 'opacity-100' : 'opacity-0')} />
                                                                {option.code ? `${option.code} -` : ''}{option.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        }
                        onSubmit={handleSubmit}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
