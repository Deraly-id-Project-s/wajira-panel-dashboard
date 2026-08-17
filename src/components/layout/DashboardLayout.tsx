import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { getToken } from "@/lib/auth"
import { useCompany } from "@/contexts/CompanyContext"
import { cn } from "@/lib/utils"
import { LoadingState } from "@/components/ui/loading-state"
import { Button } from "@/components/ui/button"
import { clearCompanyScopedQueries } from "@/lib/session/query-cache"
import { useQueryClient } from "@tanstack/react-query"

interface DashboardLayoutProps {
    children: ReactNode
    minimal?: boolean
}

export function DashboardLayout({ children, minimal = false }: DashboardLayoutProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const {
        companyId,
        isLoading,
        companies,
        companyAccessStatus,
        companyAccessError,
        setCompanyId,
        clearCompanyId,
        loadCompanies,
        isCompanyAccessVerified,
    } = useCompany()
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false)

    const slugQuery = router.query.slug
    const routeSlug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery
    const isCompanyRoute = router.pathname.startsWith("/dashboard/[slug]")
    const matchedCompany = isCompanyRoute && routeSlug
        ? companies.find((company) => company.slug === routeSlug || String(company.id) === String(routeSlug))
        : undefined
    const isAccessVerified = isCompanyAccessVerified()

    // ===== ROUTE GUARD =====
    useEffect(() => {
        if (isLoading || !router.isReady) return
        const token = getToken()

        if (!token) {
            router.replace("/login")
            return
        }

        if (!isCompanyAccessVerified()) {
            if (companyAccessStatus !== "loading" && companyAccessStatus !== "error") {
                void loadCompanies().catch(() => undefined)
            }
            return
        }

        if (companyAccessStatus !== "ready") return

        if (companies.length === 0) {
            clearCompanyId()
            return
        }

        if (isCompanyRoute) {
            const company = companies.find(
                (item) => item.slug === routeSlug || String(item.id) === String(routeSlug),
            )

            if (!company) {
                const fallbackCompany = companies[0]
                clearCompanyScopedQueries(queryClient)
                setCompanyId(String(fallbackCompany.id))
                router.replace(`/dashboard/${fallbackCompany.slug || fallbackCompany.id}`)
                return
            }

            if (String(company.id) !== String(companyId)) {
                clearCompanyScopedQueries(queryClient)
                setCompanyId(String(company.id))
            }
            return
        }

        const selectedCompanyIsAllowed = companies.some(
            (company) => String(company.id) === String(companyId),
        )
        if (!companyId || !selectedCompanyIsAllowed) {
            router.replace("/select-company")
        }
    }, [
        router,
        router.isReady,
        routeSlug,
        isCompanyRoute,
        companyId,
        isLoading,
        companies,
        companyAccessStatus,
        setCompanyId,
        clearCompanyId,
        loadCompanies,
        isCompanyAccessVerified,
        queryClient,
    ])

    if (isLoading || !router.isReady) {
        return <LoadingState variant="fullscreen" text="Memverifikasi akses perusahaan..." />
    }

    const token = getToken()
    if (!token) return null

    if (companyAccessStatus === "error") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
                <div className="w-full max-w-md space-y-4 rounded-md border bg-white p-6 text-center shadow-sm">
                    <h1 className="text-lg font-semibold">Akses perusahaan belum dapat diverifikasi</h1>
                    <p className="text-sm text-muted-foreground">
                        {companyAccessError || "Terjadi kesalahan saat memuat daftar perusahaan."}
                    </p>
                    <Button onClick={() => void loadCompanies({ forceRefresh: true }).catch(() => undefined)}>
                        Coba lagi
                    </Button>
                </div>
            </div>
        )
    }

    if (!isAccessVerified || companyAccessStatus === "idle" || companyAccessStatus === "loading") {
        return <LoadingState variant="fullscreen" text="Memverifikasi akses perusahaan..." />
    }

    if (companies.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
                <div className="w-full max-w-md space-y-2 rounded-md border bg-white p-6 text-center shadow-sm">
                    <h1 className="text-lg font-semibold">Tidak ada akses perusahaan</h1>
                    <p className="text-sm text-muted-foreground">
                        Akun Anda belum memiliki akses ke perusahaan mana pun.
                    </p>
                </div>
            </div>
        )
    }

    if (isCompanyRoute && (!matchedCompany || String(matchedCompany.id) !== String(companyId))) {
        return <LoadingState variant="fullscreen" text="Mengalihkan ke perusahaan yang dapat diakses..." />
    }

    if (!isCompanyRoute && !companyId) return null

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
