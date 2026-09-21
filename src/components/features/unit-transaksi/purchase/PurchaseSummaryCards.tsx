import { Card, CardContent } from "@/components/ui/card"

import { formatCurrency } from "@/lib/utils/currency"

interface Props {
    label: string
    value: number
    highlight?: boolean
}

export default function PurchaseSummaryCard({
    label,
    value,
    highlight
}: Props) {
    return (
        <Card className="rounded-md">
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p
                    className={`text - lg font - semibold mt - 1 ${highlight ? "text-red-500" : ""
                        } `}
                >
                    {formatCurrency(value)}
                </p>
            </CardContent>
        </Card>
    )
}
