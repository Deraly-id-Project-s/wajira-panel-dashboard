import { ReactNode } from "react"
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card"

interface SectionCardProps {
    title: string
    children: ReactNode
}

export function SectionCard({ title, children }: SectionCardProps) {
    return (
        <Card className="rounded-md py-5">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">
                    {title}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {children}
            </CardContent>
        </Card>
    )
}
