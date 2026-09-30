import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/router";

interface PageHeaderProps {
    title: string
    description?: string | React.ReactNode
}

export function PageHeader({ title, description }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
                <div className="space-y-1">
                    <title>WAJIRA DASH: {title}</title>
                    <h1 className="text-2xl font-semibold">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
