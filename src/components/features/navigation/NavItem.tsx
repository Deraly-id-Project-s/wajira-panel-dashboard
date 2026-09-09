import Link from "next/link"
import { useRouter } from "next/router"
import { cn } from "@/lib/utils"
import { NavItemConfig } from "./nav.config"
import { ChevronRight, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"

interface NavItemProps {
    item: NavItemConfig
}

/**
 * Helper to check if a path is active
 * Handles dynamic slugs by comparing the start of the path
 */
const isPathActive = (currentPath: string, targetPath: string | undefined, exact = false) => {
    if (!targetPath) return false

    // Clean paths from query params if any
    const cleanCurrent = currentPath.split("?")[0]
    const cleanTarget = targetPath.split("?")[0]

    // Exact match
    if (cleanCurrent === cleanTarget) return true

    // If exact match is required, stop here
    if (exact) return false

    // Parent path match (e.g. /dashboard/slug/transaksi/pembelian-unit matches /dashboard/slug/transaksi/pembelian-unit/create)
    // But be careful not to match partial segments e.g. /dashboard/slug/transaksi shouldn't match /dashboard/slug/transaksi-kas-harian if not intended
    // So we append a slash checking
    if (cleanCurrent.startsWith(`${cleanTarget}/`)) return true

    return false
}

/**
 * Navigation Item Component
 * Supports both parent items (expandable) dan child items
 */
export function NavItem({ item }: NavItemProps) {
    const router = useRouter()
    const currentPath = router.asPath

    // Check if this item or any of its children is active
    const isActive = isPathActive(currentPath, item.href, item.exact) ||
        (item.children?.some((child) => isPathActive(currentPath, child.href, child.exact)) || false)

    const [isExpanded, setIsExpanded] = useState(isActive)

    // Sync expansion with active route
    useEffect(() => {
        if (isActive) {
            setIsExpanded(true)
        }
    }, [isActive])

    const hasChildren = item.children && item.children.length > 0

    // Parent item (expandable - could have children or not)
    const Icon = item.icon

    // If item has href and no children - direct link
    if (item.href && !hasChildren) {
        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
            </Link>
        )
    }

    // Expandable parent item
    return (
        <div>
            {/* Parent Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                        ? "text-foreground" // Active parent
                        : "text-muted-foreground hover:text-foreground"
                )}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className={cn("font-medium", isActive && "font-semibold")}>{item.label}</span>
                </div>
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
            </button>

            {/* Children Items */}
            {isExpanded && hasChildren && (
                <div className="ml-7 mt-1 space-y-1">
                    {item.children?.map((child, index) => (
                        <NavChildItem key={child.href || index} item={child} currentPath={currentPath} />
                    ))}
                </div>
            )}
        </div>
    )
}

/**
 * Child Navigation Item Component
 * For nested menu items under parent categories
 */
function NavChildItem({ item, currentPath }: { item: NavItemConfig, currentPath: string }) {
    const isActive = isPathActive(currentPath, item.href, item.exact)

    if (!item.href) return null

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                    ? "bg-accent text-accent-foreground font-medium border-l-2 border-primary pl-[10px]" // indent adjusted for border
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {item.label}
        </Link>
    )
}
