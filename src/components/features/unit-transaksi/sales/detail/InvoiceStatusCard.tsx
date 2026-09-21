import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Progress } from "@/components/ui/progress"
import { CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/currency"
import type { InvoiceStatus } from "@/types/unit-transaction-invoice.types"

/**
 * Invoice Status Card - EXACT sesuai Figma
 * Border: 1px #E5E5E5, Radius: 12px, Padding: 24px
 * Progress bar untuk percentage paid
 */
export function InvoiceStatusCard({ data }: { data: InvoiceStatus }) {
    return (
        <Card
            className="rounded-md"
            style={{
                border: '1px solid #E5E5E5',
                padding: '24px'
            }}
        >
            <CardContent className="space-y-4 p-0">
                {/* Header dengan Icon */}
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50">
                        <CreditCard className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="font-medium">Status Pembayaran</span>
                </div>

                {/* Total Harga */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Harga</span>
                    <span className="text-xl font-bold">{formatCurrency(data.totalHarga)}</span>
                </div>

                {/* Total Bayar */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Bayar</span>
                    <span className="text-sm font-medium">{formatCurrency(data.totalBayar)}</span>
                </div>

                {/* Kurang Bayar - RED & Bold */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Kurang Bayar</span>
                    {formatCurrency(data.kurangBayar)}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <Progress value={data.percentagePaid} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                        {data.percentagePaid}% Terbayar
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
