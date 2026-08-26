"use client"

import { useForm } from "react-hook-form"
import { PurchaseFormValues } from "@/types/purchase.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/router"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Save } from "lucide-react"
import { useSuppliers } from "@/hooks/useSupplier"
import { useMemo, useEffect } from "react"
import { SupplierCombobox } from "@/components/features/supplier/SupplierCombobox"
import { DocumentTemplateSelect } from "@/components/features/document-template/DocumentTemplateSelect"

interface Props {
    defaultValues?: Partial<PurchaseFormValues>
    onSubmit: (data: PurchaseFormValues) => void
    loading?: boolean
    readOnly?: boolean
    onCancel?: () => void
    companyId?: string | null
}

export default function PurchaseForm({
    defaultValues,
    onSubmit,
    loading,
    readOnly,
    onCancel,
    companyId
}: Props) {
    const router = useRouter()
    const { data: supplierData } = useSuppliers(companyId || null)
    const personOptions = useMemo(() => supplierData?.data ?? [], [supplierData])

    const form = useForm<PurchaseFormValues>({
        defaultValues
    })

    // Auto-populate supplier address and NPWP on load/mount once supplier list is loaded
    useEffect(() => {
        if (personOptions.length > 0 && defaultValues?.supplierName) {
            const matchedSupplier = personOptions.find(
                (p) => p.name === defaultValues.supplierName
            );
            if (matchedSupplier) {
                if (!form.getValues('supplierAddress')) {
                    form.setValue('supplierAddress', matchedSupplier.address ?? '');
                }
                if (!form.getValues('supplierNpwp')) {
                    form.setValue('supplierNpwp', matchedSupplier.npwp ?? '');
                }
            }
        }
    }, [personOptions, defaultValues?.supplierName, form]);

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
            >
                {/* Section Header */}
                <div>
                    <h2 className="text-xl font-semibold text-foreground tracking-tight">Informasi Pembelian</h2>
                    <p className="text-sm text-gray-500">Kelola detail informasi pembelian unit dan biaya-biaya terkait</p>
                    <div className="h-px bg-muted/60" />
                </div>

                {/* ROW 1: Supplier, Date, Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Tanggal</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        disabled={readOnly}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="supplierName"
                        render={({ field }) => (
                            <FormItem className="flex flex-col min-w-0">
                                <FormLabel className="text-sm font-medium">Supplier</FormLabel>
                                <SupplierCombobox
                                    companyId={companyId}
                                    selectedName={field.value}
                                    disabled={readOnly}
                                    allowCreate
                                    onSelect={(supplier) => {
                                        field.onChange(supplier.name)
                                        form.setValue('supplierAddress', supplier.address ?? '')
                                        form.setValue('supplierNpwp', supplier.npwp ?? '')
                                    }}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="supplierAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Alamat</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Alamat Supplier"
                                        className="bg-transparent"
                                        disabled={readOnly}
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="supplierNpwp"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">NPWP</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="NPWP Supplier"
                                        className="bg-transparent"
                                        disabled={readOnly}
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="documentTemplateId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">Document Template <span className="font-normal text-muted-foreground">(Opsional)</span></FormLabel>
                                <DocumentTemplateSelect
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={readOnly}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {!readOnly && (
                    <div className="flex justify-center items-center gap-6 pt-10">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel || (() => router.back())}
                            disabled={loading}
                            className="text-muted-foreground font-medium hover:text-foreground"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-medium min-w-[120px] rounded-lg"
                        >
                            {loading ? (
                                "Menyimpan..."
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Simpan
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </Form>
    )
}
