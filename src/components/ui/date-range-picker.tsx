"use client"

import * as React from "react"
import {
    endOfISOWeek,
    endOfMonth,
    endOfYear,
    format,
    getISOWeek,
    getISOWeekYear,
    parse,
    startOfISOWeek,
    startOfMonth,
    startOfYear,
} from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { formatDateUI } from '@/lib/utils/date';

export type DateRangePickerMode = "date" | "week" | "month" | "year"

interface DatePickerWithRangeProps {
    className?: string
    date?: DateRange | undefined
    onChange?: (date: DateRange | undefined) => void
    placeholder?: string
    enablePeriodFilter?: boolean
    /** @deprecated Gunakan enablePeriodFilter. */
    enableMonthRange?: boolean
    mode?: DateRangePickerMode
    onModeChange?: (mode: DateRangePickerMode) => void
}

const MODE_OPTIONS: Array<{ value: DateRangePickerMode; label: string }> = [
    { value: "date", label: "Tanggal" },
    { value: "week", label: "Minggu" },
    { value: "month", label: "Bulan" },
    { value: "year", label: "Tahun" },
]

const formatRangeValue = (date: Date, mode: DateRangePickerMode) => {
    if (mode === "week") {
        return `Minggu ${getISOWeek(date)}, ${getISOWeekYear(date)}`
    }
    if (mode === "month") {
        return format(date, "MMMM yyyy", { locale: id })
    }
    if (mode === "year") {
        return format(date, "yyyy")
    }
    return formatDateUI(date)
}

export function DatePickerWithRange({
    className,
    date,
    onChange,
    placeholder = "Pilih rentang tanggal",
    enablePeriodFilter = false,
    enableMonthRange = false,
    mode,
    onModeChange,
}: DatePickerWithRangeProps) {
    const [internalMode, setInternalMode] = React.useState<DateRangePickerMode>("date")
    const activeMode = mode ?? internalMode
    const showPeriodFilter = enablePeriodFilter || enableMonthRange
    const inputId = React.useId()

    const handleModeChange = (nextMode: DateRangePickerMode) => {
        if (mode === undefined) {
            setInternalMode(nextMode)
        }
        onModeChange?.(nextMode)
    }

    const periodValues = React.useMemo(() => {
        if (activeMode === "week") {
            return {
                from: date?.from ? format(date.from, "RRRR-'W'II") : "",
                to: date?.to ? format(date.to, "RRRR-'W'II") : "",
            }
        }
        if (activeMode === "month") {
            return {
                from: date?.from ? format(date.from, "yyyy-MM") : "",
                to: date?.to ? format(date.to, "yyyy-MM") : "",
            }
        }
        if (activeMode === "year") {
            return {
                from: date?.from ? format(date.from, "yyyy") : "",
                to: date?.to ? format(date.to, "yyyy") : "",
            }
        }
        return { from: "", to: "" }
    }, [activeMode, date?.from, date?.to])
    const [yearDraft, setYearDraft] = React.useState({ from: "", to: "" })

    React.useEffect(() => {
        if (activeMode === "year") {
            setYearDraft(periodValues)
        }
    }, [activeMode, periodValues])

    const parsePeriodValue = (value: string, boundary: "start" | "end") => {
        if (!value) return undefined

        if (activeMode === "week") {
            const week = parse(value, "RRRR-'W'II", new Date())
            return boundary === "start" ? startOfISOWeek(week) : endOfISOWeek(week)
        }
        if (activeMode === "month") {
            const month = parse(value, "yyyy-MM", new Date())
            return boundary === "start" ? startOfMonth(month) : endOfMonth(month)
        }

        const year = parse(value, "yyyy", new Date())
        return boundary === "start" ? startOfYear(year) : endOfYear(year)
    }

    const handlePeriodChange = (field: "from" | "to", value: string) => {
        const nextFromValue = field === "from" ? value : periodValues.from
        const nextToValue = field === "to" ? value : periodValues.to
        let from = parsePeriodValue(nextFromValue, "start")
        let to = parsePeriodValue(nextToValue, "end")

        if (field === "from" && from && !to) {
            to = parsePeriodValue(nextFromValue, "end")
        } else if (field === "to" && to && !from) {
            from = parsePeriodValue(nextToValue, "start")
        } else if (from && to && from > to) {
            if (field === "from") {
                to = parsePeriodValue(nextFromValue, "end")
            } else {
                from = parsePeriodValue(nextToValue, "start")
            }
        }

        onChange?.(from || to ? { from, to } : undefined)
    }

    const handleYearChange = (field: "from" | "to", value: string) => {
        setYearDraft((current) => ({ ...current, [field]: value }))

        if (value === "") {
            handlePeriodChange(field, value)
            return
        }

        const numericYear = Number(value)
        if (/^\d{4}$/.test(value) && numericYear >= 1900 && numericYear <= 9999) {
            handlePeriodChange(field, value)
        }
    }

    const periodInputType = activeMode === "week" ? "week" : activeMode === "month" ? "month" : "number"
    const periodLabel = activeMode === "week" ? "Minggu" : activeMode === "month" ? "Bulan" : "Tahun"

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id={`${inputId}-trigger`}
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal bg-white",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (() => {
                            const fromLabel = formatRangeValue(date.from, activeMode)
                            const toLabel = date.to ? formatRangeValue(date.to, activeMode) : undefined

                            return toLabel && toLabel !== fromLabel ? (
                                <>
                                    {fromLabel} - {toLabel}
                                </>
                            ) : (
                                fromLabel
                            )
                        })() : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0 shadow-lg rounded-md" align="start" sideOffset={8}>
                    {showPeriodFilter && (
                        <div className="grid grid-cols-4 border-b border-slate-200 p-2" aria-label="Jenis periode">
                            {MODE_OPTIONS.map((option, index) => (
                                <Button
                                    key={option.value}
                                    type="button"
                                    variant={activeMode === option.value ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-8 rounded-none px-3",
                                        index === 0 && "rounded-l-md",
                                        index === MODE_OPTIONS.length - 1 && "rounded-r-md",
                                    )}
                                    onClick={() => handleModeChange(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    )}

                    {activeMode !== "date" ? (
                        <div className="grid gap-3 p-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label htmlFor={`${inputId}-from`} className="text-xs font-medium text-slate-600">
                                    {periodLabel} Awal
                                </label>
                                <input
                                    id={`${inputId}-from`}
                                    type={periodInputType}
                                    min={activeMode === "year" ? 1900 : undefined}
                                    max={activeMode === "year" ? 9999 : undefined}
                                    step={activeMode === "year" ? 1 : undefined}
                                    inputMode={activeMode === "year" ? "numeric" : undefined}
                                    value={activeMode === "year" ? yearDraft.from : periodValues.from}
                                    onChange={(event) => activeMode === "year"
                                        ? handleYearChange("from", event.target.value)
                                        : handlePeriodChange("from", event.target.value)}
                                    onBlur={() => {
                                        if (activeMode === "year" && !/^\d{4}$/.test(yearDraft.from)) {
                                            setYearDraft(periodValues)
                                        }
                                    }}
                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor={`${inputId}-to`} className="text-xs font-medium text-slate-600">
                                    {periodLabel} Akhir
                                </label>
                                <input
                                    id={`${inputId}-to`}
                                    type={periodInputType}
                                    min={activeMode === "year" ? 1900 : undefined}
                                    max={activeMode === "year" ? 9999 : undefined}
                                    step={activeMode === "year" ? 1 : undefined}
                                    inputMode={activeMode === "year" ? "numeric" : undefined}
                                    value={activeMode === "year" ? yearDraft.to : periodValues.to}
                                    onChange={(event) => activeMode === "year"
                                        ? handleYearChange("to", event.target.value)
                                        : handlePeriodChange("to", event.target.value)}
                                    onBlur={() => {
                                        if (activeMode === "year" && !/^\d{4}$/.test(yearDraft.to)) {
                                            setYearDraft(periodValues)
                                        }
                                    }}
                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                />
                            </div>
                        </div>
                    ) : (
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={onChange}
                            numberOfMonths={2}
                        />
                    )}
                </PopoverContent>
            </Popover>
        </div>
    )
}
