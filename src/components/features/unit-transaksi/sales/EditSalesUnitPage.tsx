'use client';


import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UnitTransactionForm } from '@/components/features/unit-transaksi/UnitTransactionForm';
import type { UnitTransactionFormValues } from '@/types/unit-transaction.types';
import { toast } from 'sonner';
import { useSalesUnitItems, useUpdateUnitItem } from '@/hooks/useUnitTransactionItem';
import { useUnitTransactionItemById } from '@/hooks/useUnitItemDetail';
import { useSalesDetail } from '@/hooks/useSales';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingState } from '@/components/ui/loading-state';
import { useUpdateUnitTransactionDocumentTemplate } from '@/hooks/useUnitTransaction';
import { isUnitUsdTransaction } from '@/utils/payment-helpers';

export default function EditSalesUnitPage() {
    const router = useRouter();
    const { id, unitId, slug } = router.query;
    const salesId = Array.isArray(id) ? id[0] : id;
    const selectedUnitId = Array.isArray(unitId) ? unitId[0] : unitId;
    const slugValue = Array.isArray(slug) ? slug[0] : slug || '';

    const { companyId } = useCompany();
    const { data: salesDetail, isLoading: salesLoading } = useSalesDetail(salesId);
    const { data: itemResponse, isLoading: itemLoading } = useSalesUnitItems(salesId);
    const { data: singleUnitItem, isLoading: isSingleItemLoading } = useUnitTransactionItemById(selectedUnitId ? String(selectedUnitId) : '');
    const { data: unitTypes, isLoading: typeUnitLoading } = useTypeUnits({
        sort_by: 'created_at',
        sort_order: 'asc',
        in_stock: 'true',
        company_id: companyId || (salesDetail?.raw as any)?.company_id || 1
    });
    const updateMutation = useUpdateUnitItem();
    const updateTemplateMutation = useUpdateUnitTransactionDocumentTemplate();

    const item = singleUnitItem ?? (itemResponse?.data ?? []).find((row) => String(row.id) === String(selectedUnitId ?? ''));
    const invoiceCode = salesDetail?.raw?.code ?? '-';
    const isUsd = isUnitUsdTransaction(salesDetail?.raw ?? salesDetail?.ui ?? (item as any)?.unit_transaction ?? item);

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
            price_discount: Number(item.price_discount ?? (item as any).discount ?? 0) || 0,
            price_usd_discount: Number((item as any).price_discount_usd ?? item.price_usd_discount ?? (item as any).usd_discount ?? 0) || 0,
            unit_transaction_usd_costs: (item as any).unit_transaction_usd_costs || (item as any).usd_costs || [],
            usd_costs: (item as any).unit_transaction_usd_costs || (item as any).usd_costs || [],
            is_usd_transaction: isUsd,
            usd_cost_freight_total: (item as any).usd_cost_freight_total,
            usd_cost_box_packing_total: (item as any).usd_cost_box_packing_total,
            usd_cost_admin_cost_total: (item as any).usd_cost_admin_cost_total,
            usd_cost_ckd_processing_cost_total: (item as any).usd_cost_ckd_processing_cost_total,
            usd_cost_bill_of_lading_switch_cost_total: (item as any).usd_cost_bill_of_lading_switch_cost_total,
            usd_cost_customs_clearance_cost_total: (item as any).usd_cost_customs_clearance_cost_total,
            usd_cost_other_total: (item as any).usd_cost_other_total,
            dppTaxVersionId: item.dpp_tax_id ?? undefined,
            ppnTaxVersionId: item.ppn_tax_id ?? undefined,
            documentTemplateId: salesDetail?.ui?.documentTemplateId ?? null,
        };
    }, [item, salesDetail?.ui?.documentTemplateId, isUsd]);

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
                    price_discount: Number(values.price_discount ?? (values as any)?.discount ?? 0) || 0,
                    discount: Number(values.price_discount ?? (values as any)?.discount ?? 0) || 0,
                    price_usd_discount: Number((values as any)?.price_discount_usd ?? values.price_usd_discount ?? (values as any)?.usd_discount ?? 0) || 0,
                    usd_discount: Number((values as any)?.price_discount_usd ?? values.price_usd_discount ?? (values as any)?.usd_discount ?? 0) || 0,
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

    if (salesLoading || itemLoading || typeUnitLoading || isSingleItemLoading) {
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

    const basePath = slugValue ? `/dashboard/${slugValue}/transaksi/penjualan-unit` : '/transaksi/penjualan-unit';

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Penjualan Unit', onClick: () => router.push(basePath) },
                        { label: 'Detail Penjualan', onClick: () => router.push(`${basePath}/${salesId}`) },
                        { label: 'Edit Unit Tipe Penjualan' }
                    ]}
                    title="Data Penjualan Unit Tipe"
                    subtitle={
                        <div className="flex flex-wrap items-center gap-2">
                            <span>Kode Jual:</span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700">{invoiceCode}</span>
                            {isUsd && (
                                <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 font-semibold">
                                    Transaksi USD
                                </Badge>
                            )}
                        </div>
                    }
                    onBack={() => router.back()}
                />

                <Card className="rounded-md">
                    <CardContent className="p-6">
                        <UnitTransactionForm
                            type="sales"
                            allowCreateTypeUnit
                            hideUsdCheckbox={true}
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
