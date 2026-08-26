"use client"

import { useRouter } from "next/router"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
    usePurchaseById,
    useUpdatePurchase
} from "@/hooks/usePurchase"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-state"
import { useCompany } from "@/contexts/CompanyContext"
import { UnitTransactionHeaderForm, type UnitTransactionHeaderFormValues } from "@/components/features/unit-transaction/UnitTransactionHeaderForm"

export default function EditPurchasePage() {
    const router = useRouter()
    const { slug, id } = router.query
    const { companyId } = useCompany()

    const slugStr = Array.isArray(slug) ? slug[0] : slug || ''
    const basePath = slugStr ? `/dashboard/${slugStr}/transaksi/pembelian-unit` : '/transaksi/pembelian-unit'

    const { data, isLoading } = usePurchaseById(id as string)
    const mutation = useUpdatePurchase()

    const handleSubmit = async (formData: UnitTransactionHeaderFormValues) => {
        if (!data) return
        try {
            await mutation.mutateAsync({
                id: id as string,
                payload: {
                    company_id: Number(companyId),
                    person_id: Number(formData.personId),
                    code: data.code,
                    type: 'purchase',
                    max_capacity: String(data.maxCapacity ?? 0),
                    stock_state: data.stockState ?? 'draft',
                    transaction_date: formData.date,
                    document_template_id: formData.documentTemplateId ?? null,
                }
            })

            toast.success("Data berhasil diperbarui")
            router.push(`${basePath}/${id}`)
        } catch {
            toast.error("Gagal update data")
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <LoadingState variant="page" />
                </div>
            </DashboardLayout>
        )
    }

    const invoiceCode = data?.code ?? ''

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Pembelian Unit', onClick: () => router.push(basePath) },
                        { label: 'Edit Pembelian' }
                    ]}
                    title="Edit Pembelian Unit"
                    subtitle={invoiceCode ? (
                        <>
                            <span>Kode Beli:</span>
                            <span className="text-blue-600 font-medium">{invoiceCode}</span>
                        </>
                    ) : undefined}
                    onBack={() => router.push(basePath)}
                />

                <Card className="rounded-md border border-gray-200 shadow-none">
                    <CardContent className="p-6">
                        <UnitTransactionHeaderForm
                            type="purchase"
                            defaultValues={{
                                personId: data?.companyId ? String(data.companyId) : '',
                                personName: data?.supplierName ?? '',
                                date: data?.date?.slice(0, 10) ?? '',
                                personAddress: data?.supplierAddress,
                                personNpwp: data?.supplierNpwp,
                                documentTemplateId: data?.documentTemplateId ?? null,
                            }}
                            onSubmit={handleSubmit}
                            onCancel={() => router.push(`${basePath}/${id}`)}
                            loading={mutation.isPending}
                            companyId={companyId}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
