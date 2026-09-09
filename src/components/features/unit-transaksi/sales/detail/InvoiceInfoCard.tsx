import { Card, CardContent } from "@/components/ui/card"

import { FileText } from "lucide-react"
import { InvoiceInfo } from "./invoice.types"

/**
 * Invoice Info Card - EXACT sesuai Figma
 * Border: 1px #E5E5E5, Radius: 12px, Padding: 24px
 * Label: 12px muted, Value: 14px medium foreground
 * Spacing: 16px antar field
 */
export function InvoiceInfoCard({ data }: { data: InvoiceInfo }) {
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50">
                        <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Informasi Invoice</span>
                </div>

                {/* Nomor Invoice - spacing 16px */}
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Nomor Invoice</p>
                    <p className="text-sm font-medium">{data.invoiceNumber}</p>
                </div>

                {/* Tanggal - spacing 16px */}
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tanggal</p>
                    <p className="text-sm font-medium">{data.date}</p>
                </div>

                {/* Customer - spacing 16px */}
                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium">{data.customer}</p>
                </div>
            </CardContent>
        </Card>
    )
}
