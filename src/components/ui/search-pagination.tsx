"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchInput, type SearchInputProps } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SearchPaginationProps {
    children: React.ReactNode
    searchValue: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    searchAriaLabel?: string
    searchInputProps?: Omit<SearchInputProps, "value" | "onValueChange" | "placeholder">
    page: number
    perPage: number
    total?: number
    lastPage?: number
    from?: number
    to?: number
    perPageOptions?: number[]
    onPageChange: (page: number) => void
    onPerPageChange: (perPage: number) => void
    actions?: React.ReactNode
    className?: string
}

const getVisiblePages = (currentPage: number, lastPage: number) => {
    if (lastPage <= 5) {
        return Array.from({ length: lastPage }, (_, index) => index + 1)
    }
    if (currentPage <= 3) return [1, 2, 3, 4, 5]
    if (currentPage >= lastPage - 2) {
        return Array.from({ length: 5 }, (_, index) => lastPage - 4 + index)
    }
    return Array.from({ length: 5 }, (_, index) => currentPage - 2 + index)
}

export function SearchPagination({
    children,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Cari...",
    searchAriaLabel = "Cari data",
    searchInputProps,
    page,
    perPage,
    total = 0,
    lastPage = 1,
    from,
    to,
    perPageOptions = [10, 25, 50, 100],
    onPageChange,
    onPerPageChange,
    actions,
    className,
}: SearchPaginationProps) {
    const safeLastPage = Math.max(1, lastPage)
    const safePage = Math.min(Math.max(1, page), safeLastPage)
    const visiblePages = getVisiblePages(safePage, safeLastPage)
    const startItem = total === 0 ? 0 : (from ?? (safePage - 1) * perPage + 1)
    const endItem = total === 0 ? 0 : (to ?? Math.min(safePage * perPage, total))

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex flex-col items-stretch justify-between gap-4 py-1 sm:flex-row sm:items-center">
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                    <SearchInput
                        {...searchInputProps}
                        value={searchValue}
                        onValueChange={onSearchChange}
                        placeholder={searchPlaceholder}
                        aria-label={searchAriaLabel}
                        wrapperClassName={cn("sm:w-[300px]", searchInputProps?.wrapperClassName)}
                    />

                    <div className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-500">
                        <span>Show</span>
                        <Select value={String(perPage)} onValueChange={(value) => onPerPageChange(Number(value))}>
                            <SelectTrigger className="w-[70px] cursor-pointer bg-white" aria-label="Jumlah data per halaman">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {perPageOptions.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span>Page</span>
                    </div>
                </div>

                {actions ? <div className="flex items-center justify-end">{actions}</div> : null}
            </div>

            {children}

            {total > 0 && (
                <nav
                    className="flex flex-col gap-4 py-2 text-sm text-slate-500 no-print lg:flex-row lg:items-center lg:justify-between"
                    aria-label="Navigasi halaman"
                >
                    <p>Showing {startItem}-{endItem} of {total} data</p>
                    <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
                            disabled={safePage <= 1}
                            onClick={() => onPageChange(safePage - 1)}
                            aria-label="Halaman sebelumnya"
                        >
                            Previous
                        </Button>

                        {visiblePages.map((pageNumber) => (
                            <Button
                                key={pageNumber}
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-9 min-w-9 rounded-md border px-3 text-sm font-medium shadow-none",
                                    pageNumber === safePage
                                        ? "border-slate-200 bg-white text-slate-950 shadow-sm"
                                        : "border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white",
                                )}
                                onClick={() => onPageChange(pageNumber)}
                                aria-label={`Buka halaman ${pageNumber}`}
                                aria-current={pageNumber === safePage ? "page" : undefined}
                            >
                                {pageNumber}
                            </Button>
                        ))}

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
                            disabled={safePage >= safeLastPage}
                            onClick={() => onPageChange(safePage + 1)}
                            aria-label="Halaman berikutnya"
                        >
                            Next
                        </Button>
                    </div>
                </nav>
            )}
        </div>
    )
}
