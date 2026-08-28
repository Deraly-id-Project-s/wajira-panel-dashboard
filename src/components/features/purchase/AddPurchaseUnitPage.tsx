'use client';

import { useRouter } from "next/router"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { UnitTransactionForm } from "@/components/features/unit-transaction/UnitTransactionForm"
import { useAddPurchaseUnit } from "@/hooks/usePurchase"
import { usePurchaseById, useUpdateUnitTransactionDocumentTemplate } from "@/hooks/useUnitTransaction"
import type { UnitTransactionFormValues } from "@/scheme/unit-transaction.schema"

export default function AddPurchaseUnitPage() {
    const router = useRouter()
    const { slug, id } = router.query
    const mutation = useAddPurchaseUnit()
    const { data: purchase } = usePurchaseById(id as string)
    const updateTemplateMutation = useUpdateUnitTransactionDocumentTemplate()

    const handleSubmit = async (formData: UnitTransactionFormValues) => {
        try {
            await mutation.mutateAsync({
                purchaseId: id as string,
                typeUnitId: formData.unitTypeId,
                typeUnitName: '',
                qty: formData.qty,
                price: formData.price,
                biayaBBN: Number(formData.bbnPrice ?? 0),
                biayaEkspedisi: Number(formData.expeditionFee ?? 0),
                biayaLain: Number(formData.otherFee ?? 0),
                dppTaxVersionId: String(formData.dppTaxVersionId ?? ''),
                ppnTaxVersionId: String(formData.ppnTaxVersionId ?? ''),
                priceUsd: formData.priceUsd ? Number(formData.priceUsd) : undefined,
                pricePerUnitUsd: formData.pricePerUnitUsd ? Number(formData.pricePerUnitUsd) : undefined,
            })

            if ((formData.documentTemplateId ?? null) !== (purchase?.documentTemplateId ?? null)) {
                await updateTemplateMutation.mutateAsync({ id: String(id), documentTemplateId: formData.documentTemplateId ?? null })
            }

            toast.success("Unit berhasil ditambahkan")
            router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${id}`)
        } catch {
            toast.error("Gagal menambahkan unit")
        }
    }

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-xl font-semibold">
                        Tambah Unit Pembelian
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Masukkan detail unit
                    </p>
                </div>

                <UnitTransactionForm type="purchase" allowCreateTypeUnit defaultValues={{ documentTemplateId: purchase?.documentTemplateId ?? null }} onSubmit={handleSubmit} onCancel={() => router.back()} />
            </div>
        </DashboardLayout>
    )
}
