import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { getToken } from "@/lib/auth"
import { useCompany } from "@/contexts/CompanyContext"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
    children: ReactNode
    minimal?: boolean
}

export function DashboardLayout({ children, minimal = false }: DashboardLayoutProps) {
    const router = useRouter()
    const { companyId, isLoading } = useCompany()
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)

    // ===== ROUTE GUARD =====
    useEffect(() => {
        if (isLoading) return
        const token = getToken()

        if (!token) {
            router.replace("/login")
            return
        }

        if (!companyId) {
            router.replace("/select-company")
            return
        }
    }, [router, companyId, isLoading])

    if (isLoading) return null

    const token = getToken()
    if (!token || !companyId) return null

    if (minimal) {
        return (
            <div className="fixed inset-0 flex w-full overflow-hidden bg-[#fafafa]">
                <main className="flex-1 overflow-y-auto bg-[#fafafa]">
                    <div className="mx-auto w-full max-w-[950px] px-4 sm:px-6 py-10 space-y-6 box-border">
                        {children}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 flex w-full overflow-hidden bg-background">
            {/* ── Desktop Sidebar (hidden on mobile) ── */}
            <div
                className={cn(
                    "print:hidden hidden md:flex shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out",
                    isDesktopSidebarCollapsed ? "w-[72px]" : "w-64",
                )}
            >
                <Sidebar
                    isDesktopCollapsed={isDesktopSidebarCollapsed}
                    onDesktopCollapsedChange={setIsDesktopSidebarCollapsed}
                />
            </div>

            {/* ── Mobile Sidebar (rendered inside Sidebar component itself) ── */}
            <div className="print:hidden md:hidden">
                <Sidebar />
            </div>

            {/* ── Main content area ── */}
            <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">
                <div className="print:hidden shrink-0">
                    <Topbar />
                </div>
                <main className="flex-1 overflow-y-auto bg-muted/40 print:bg-white print:p-0">
                    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8 space-y-6 print:max-w-none print:space-y-4 print:p-0 box-border">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
