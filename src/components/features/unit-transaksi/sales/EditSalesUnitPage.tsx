'use client';


import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { UnitTransactionForm } from '@/components/features/unit-transaksi/UnitTransactionForm';
import type { UnitTransactionFormValues } from '@/types/unit-transaction.types';
import { toast } from 'sonner';
import { useSalesUnitItems, useUpdateUnitItem } from '@/hooks/useUnitTransactionItem';
import { useSalesDetail } from '@/hooks/useSales';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingState } from '@/components/ui/loading-state';
import { useUpdateUnitTransactionDocumentTemplate } from '@/hooks/useUnitTransaction';

export default function EditSalesUnitPage() {
    const router = useRouter();
    const { id, unitId, slug } = router.query;
    const salesId = Array.isArray(id) ? id[0] : id;
    const selectedUnitId = Array.isArray(unitId) ? unitId[0] : unitId;
    const slugValue = Array.isArray(slug) ? slug[0] : slug || '';

    const { companyId } = useCompany();
    const { data: salesDetail, isLoading: salesLoading } = useSalesDetail(salesId);
    const { data: itemResponse, isLoading: itemLoading } = useSalesUnitItems(salesId);
    const { data: unitTypes, isLoading: typeUnitLoading } = useTypeUnits({
        sort_by: 'created_at',
        sort_order: 'asc',
        in_stock: 'true',
        company_id: companyId || (salesDetail?.raw as any)?.company_id || 1
    });
    const updateMutation = useUpdateUnitItem();
    const updateTemplateMutation = useUpdateUnitTransactionDocumentTemplate();

    const item = (itemResponse?.data ?? []).find((row) => String(row.id) === String(selectedUnitId ?? ''));
    const invoiceCode = salesDetail?.raw?.code ?? '-';

    const formData: UnitTransactionFormValues | null = useMemo(() => {
        if (!item) return null;
        const qty = Number(item.qty_total ?? 0) || 1;

        return {
            unitTypeId: String(item.unit_type_id ?? ''),
            qty,
            price: Number(item.price ?? 0),
            bbnPrice: Number(item.bbn_price ?? 0),
            expeditionFee: Number(item.expedition_fee ?? 0),
            otherFee: Number(item.other_fee ?? 0),
            hppPerUnit: qty > 0 ? Number(item.hpp_total_price ?? 0) / qty : 0,
            hppTotal: Number(item.hpp_total_price ?? 0),
            dppPerUnit: qty > 0 ? Number(item.dpp_total_price ?? 0) / qty : 0,
            dppTotal: Number(item.dpp_total_price ?? 0),
            ppnPerUnit: qty > 0 ? Number(item.ppn_total_price ?? 0) / qty : 0,
            ppnTotal: Number(item.ppn_total_price ?? 0),
            priceUsd: item.price_usd ? Number(item.price_usd) : undefined,
            pricePerUnitUsd: item.price_per_unit_usd ? Number(item.price_per_unit_usd) : undefined,
            price_discount: Number(item.price_discount ?? 0) || 0,
            price_usd_discount: Number(item.price_usd_discount ?? 0) || 0,
            usd_costs: (item as any).unit_transaction_usd_costs || (item as any).usd_costs || [],
            dppTaxVersionId: item.dpp_tax_id ?? undefined,
            ppnTaxVersionId: item.ppn_tax_id ?? undefined,
            documentTemplateId: salesDetail?.ui?.documentTemplateId ?? null,
        };
    }, [item, salesDetail?.ui?.documentTemplateId]);

    const handleSubmit = async (values: UnitTransactionFormValues) => {
        try {
            if (!selectedUnitId) {
                toast.error('Unit tidak valid');
                return;
            }

            const isUnitTypeChanged = values.unitTypeId && String(values.unitTypeId) !== String(item?.unit_type_id);

            await updateMutation.mutateAsync({
                id: String(selectedUnitId),
                payload: {
                    unit_transaction_id: undefined,
                    unit_type_id: isUnitTypeChanged && String(values.unitTypeId) !== 'null' ? String(values.unitTypeId) : undefined,
                    sparepart_id: item?.sparepart_id && String(item.sparepart_id) !== 'null' ? String(item.sparepart_id) : undefined,
                    qty_total: Number(values.qty ?? 0),
                    price: Number(values.price ?? 0),
                    bbn_price: Number(values.bbnPrice ?? 0),
                    expedition_fee: Number(values.expeditionFee ?? 0),
                    other_fee: Number(values.otherFee ?? 0),
                    price_discount: Number(values.price_discount ?? 0) || 0,
                    price_usd_discount: Number(values.price_usd_discount ?? 0) || 0,
                    price_usd: values.priceUsd ? Number(values.priceUsd) : undefined,
                    price_per_unit_usd: values.pricePerUnitUsd ? Number(values.pricePerUnitUsd) : undefined,
                    usd_costs: values.usd_costs,
                    dpp_tax_id: values.dppTaxVersionId ? Number(values.dppTaxVersionId) : undefined,
                    ppn_tax_id: values.ppnTaxVersionId ? Number(values.ppnTaxVersionId) : undefined,
                },
            });
            if ((values.documentTemplateId ?? null) !== (salesDetail?.ui?.documentTemplateId ?? null) && salesId) {
                await updateTemplateMutation.mutateAsync({ id: salesId, documentTemplateId: values.documentTemplateId ?? null });
            }

            toast.success('Unit berhasil diperbarui!');
            const basePath = slugValue ? `/dashboard/${slugValue}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';
            router.push(`${basePath}/${salesId}`);
        } catch (error: any) {
            const responseData = error?.response?.data;
            const errorMsg = responseData?.message || error?.message || 'Gagal memperbarui unit.';
            const validationErrors = responseData?.errors;

            if (validationErrors && typeof validationErrors === 'object') {
                const firstErrorKey = Object.keys(validationErrors)[0];
                const firstErrorArray = validationErrors[firstErrorKey];
                const firstErrorMessage = Array.isArray(firstErrorArray) ? firstErrorArray[0] : firstErrorArray;
                toast.error(`${errorMsg} - ${firstErrorMessage}`);
            } else {
                toast.error(errorMsg);
            }
        }
    };

    if (salesLoading || itemLoading || typeUnitLoading) {
        return (
            <DashboardLayout>
                <LoadingState variant="page" />
            </DashboardLayout>
        );
    }

    if (!formData) {
        return (
            <DashboardLayout>
                <div className="p-6 text-muted-foreground">Unit tidak ditemukan</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <button onClick={() => router.back()} className="mb-2 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </button>

                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight">Edit Unit</h1>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Kode Jual</span>
                            <span className="text-blue-600 font-medium">{invoiceCode}</span>
                        </div>
                    </div>
                </div>

                <Card className="rounded-md">
                    <CardContent className="p-6">
                        <UnitTransactionForm
                            type="sales"
                            allowCreateTypeUnit
                            defaultValues={formData}
                            typeUnitOptions={unitTypes?.data ?? []}
                            onSubmit={handleSubmit}
                            onCancel={() => router.back()}
                            submitDisabled={updateMutation.isPending}
                            cancelDisabled={updateMutation.isPending}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
