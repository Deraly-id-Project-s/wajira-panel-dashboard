import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { KpiData } from "@/types/dashboard"
import { formatNumber } from "@/lib/utils/format"

interface KpiCardProps {
    data: KpiData
}

export function KpiCard({ data }: KpiCardProps) {
    const isUp = data.trend === "up"
    const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight

    return (
        <Card className="rounded-md border shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {data.title}
                </CardTitle>

                <div
                    className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        isUp
                            ? "bg-success-bg text-success"
                            : "bg-error-bg text-error"
                    )}
                >
                    <TrendIcon className="h-4 w-4" />
                </div>
            </CardHeader>

            <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">
                        {formatNumber(data.value)}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                        {data.currency}
                    </span>
                </div>

                <p
                    className={cn(
                        "text-xs font-medium",
                        isUp ? "text-success" : "text-error"
                    )}
                >
                    {data.trendPercentage}% {isUp ? "Naik" : "Turun"} dibanding bulan lalu
                </p>
            </CardContent>
        </Card>
    )
}
