import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { InputDate } from "@/components/ui/input-date"
import { MoneyInput } from "@/components/ui/money-input"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { SalesItem } from "../sales.data"
import { useEffect, useState } from "react"


const paymentSchema = z.object({
    paymentBca: z.number().min(0),
    paymentBcaUsd: z.number().min(0),
    paymentCash: z.number().min(0),
    // Read-only fields for validation if needed, but mostly for display
    totalBayar: z.number(),
    kurangBayar: z.number(),
    totalBayarUsd: z.number(),
    kurangBayarUsd: z.number(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface Props {
    salesData: SalesItem
    onSubmit: (data: PaymentFormData) => void
    onCancel: () => void
}

function formatMoney(amount: number, currency: 'IDR' | 'USD' = 'IDR') {
    if (currency === 'USD') {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount)
    }
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace("Rp", "Rp ")
}

export function PaymentForm({ salesData, onSubmit, onCancel }: Props) {
    const [tanggalBayar, setTanggalBayar] = useState('')

    // Generate a mock USD target since salesData doesn't have one
    const mockTargetUsd = Math.round(salesData.totalJual / 15000)

    const form = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentBca: 0,
            paymentBcaUsd: 0,
            paymentCash: 0,
            totalBayar: 0,
            kurangBayar: salesData.totalJual,
            totalBayarUsd: 0,
            kurangBayarUsd: mockTargetUsd,
        }
    })

    const { watch, setValue } = form
    const paymentBca = watch("paymentBca")
    const paymentBcaUsd = watch("paymentBcaUsd")
    const paymentCash = watch("paymentCash")

    useEffect(() => {
        // IDR Logic (exclude BCA USD)
        const totalIdr = (paymentBca || 0) + (paymentCash || 0)
        const kurangIdr = salesData.totalJual - totalIdr
        setValue("totalBayar", totalIdr)
        setValue("kurangBayar", Math.max(0, kurangIdr))

        // USD Logic
        const totalUsd = paymentBcaUsd || 0
        const kurangUsd = mockTargetUsd - totalUsd
        setValue("totalBayarUsd", totalUsd)
        setValue("kurangBayarUsd", Math.max(0, kurangUsd))
    }, [paymentBca, paymentBcaUsd, paymentCash, salesData.totalJual, mockTargetUsd, setValue])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Column: Biaya & Invoice */}
                    <div className="space-y-8">
                        {/* Biaya Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Biaya</h3>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">Total Beli</Label>
                                <Input className="col-span-2 bg-muted/50" readOnly value={formatMoney(salesData.totalDpp)} />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">Total PPN</Label>
                                <Input className="col-span-2 bg-muted/50" readOnly value={formatMoney(salesData.totalPpn)} />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">Total Biaya</Label>
                                <Input className="col-span-2 bg-muted/50" readOnly value={formatMoney(salesData.totalBiaya)} />
                            </div>
                        </div>

                        {/* Invoice Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Invoice</h3>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">Tanggal</Label>
                                <InputDate
                                    className="col-span-2"
                                    value={tanggalBayar}
                                    onChange={(e) => setTanggalBayar(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">Total Bayar</Label>
                                <Input
                                    className="col-span-2 bg-muted/50"
                                    readOnly
                                    value={formatMoney(watch("totalBayar"))}
                                />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">Kurang Bayar</Label>
                                <Input
                                    className="col-span-2 bg-muted/50 font-semibold text-red-600"
                                    readOnly
                                    value={formatMoney(watch("kurangBayar"))}
                                />
                            </div>

                            {/* USD Fields */}
                            <div className="grid grid-cols-3 items-center gap-4 pt-2 border-t">
                                <Label className="col-span-1">Total Bayar (USD)</Label>
                                <Input
                                    className="col-span-2 bg-muted/50"
                                    readOnly
                                    value={formatMoney(watch("totalBayarUsd"), 'USD')}
                                />
                            </div>
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label className="col-span-1">Kurang Bayar (USD)</Label>
                                <Input
                                    className="col-span-2 bg-muted/50 font-semibold text-blue-600"
                                    readOnly
                                    value={formatMoney(watch("kurangBayarUsd"), 'USD')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pembayaran */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Pembayaran</h3>

                            <FormField
                                control={form.control}
                                name="paymentBca"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                                        <FormLabel className="col-span-1">BCA</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                className="col-span-2"
                                                {...field}
                                                value={field.value || 0}
                                                onChangeValue={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="paymentBcaUsd"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                                        <FormLabel className="col-span-1">BCA (USD)</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                className="col-span-2"
                                                {...field}
                                                value={field.value || 0}
                                                onChangeValue={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="paymentCash"
                                render={({ field }) => (
                                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                                        <FormLabel className="col-span-1">CASH IDR</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                className="col-span-2"
                                                {...field}
                                                value={field.value || 0}
                                                onChangeValue={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-8 border-t">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={form.formState.isSubmitting}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                        className="bg-[#1e293b] hover:bg-[#0f172a] text-white min-w-[100px]"
                    >
                        {form.formState.isSubmitting ? (
                            "Menyimpan..."
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Simpan
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
