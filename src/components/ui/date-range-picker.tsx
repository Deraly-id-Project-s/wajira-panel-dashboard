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

const MONTH_OPTIONS = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
]

const MIN_YEAR = 2000
const MAX_YEAR = 3000

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
    const currentDate = React.useMemo(() => new Date(), [])
    const currentYear = format(currentDate, "yyyy")
    const currentMonth = format(currentDate, "MM")

    const handleModeChange = (nextMode: DateRangePickerMode) => {
        if (nextMode === activeMode) return

        if (mode === undefined) {
            setInternalMode(nextMode)
        }
        onModeChange?.(nextMode)

        if (nextMode === "week") {
            onChange?.({ from: startOfISOWeek(currentDate), to: endOfISOWeek(currentDate) })
        } else if (nextMode === "month") {
            onChange?.({ from: startOfMonth(currentDate), to: endOfMonth(currentDate) })
        } else if (nextMode === "year") {
            onChange?.({ from: startOfYear(currentDate), to: endOfYear(currentDate) })
        } else {
            onChange?.(undefined)
        }
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
                from: date?.from ? format(date.from, "yyyy-MM") : `${currentYear}-${currentMonth}`,
                to: date?.to ? format(date.to, "yyyy-MM") : `${currentYear}-${currentMonth}`,
            }
        }
        if (activeMode === "year") {
            return {
                from: date?.from ? format(date.from, "yyyy") : currentYear,
                to: date?.to ? format(date.to, "yyyy") : currentYear,
            }
        }
        return { from: "", to: "" }
    }, [activeMode, currentMonth, currentYear, date?.from, date?.to])
    const [yearDraft, setYearDraft] = React.useState({ from: currentYear, to: currentYear })

    React.useEffect(() => {
        if (activeMode === "month") {
            setYearDraft({
                from: periodValues.from.slice(0, 4),
                to: periodValues.to.slice(0, 4),
            })
        } else if (activeMode === "year") {
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
            const yearValue = Number(value.slice(0, 4))
            if (yearValue < MIN_YEAR || yearValue > MAX_YEAR) return undefined
            const month = parse(value, "yyyy-MM", new Date())
            return boundary === "start" ? startOfMonth(month) : endOfMonth(month)
        }

        const yearValue = Number(value)
        if (yearValue < MIN_YEAR || yearValue > MAX_YEAR) return undefined
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
        if (/^\d{4}$/.test(value) && numericYear >= MIN_YEAR && numericYear <= MAX_YEAR) {
            const periodValue = activeMode === "month"
                ? `${value}-${periodValues[field].slice(5, 7)}`
                : value
            handlePeriodChange(field, periodValue)
        }
    }

    const handleMonthChange = (field: "from" | "to", month: string) => {
        if (!isValidYear(yearDraft[field])) return
        handlePeriodChange(field, `${yearDraft[field]}-${month}`)
    }

    const isValidYear = (value: string) => {
        const year = Number(value)
        return /^\d{4}$/.test(value) && year >= MIN_YEAR && year <= MAX_YEAR
    }

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

                    {activeMode === "month" ? (
                        <div className="grid gap-3 p-3 sm:grid-cols-2">
                            {(["from", "to"] as const).map((field) => (
                                <fieldset key={field} className="space-y-1.5">
                                    <legend className="text-xs font-medium text-slate-600">
                                        Periode {field === "from" ? "Awal" : "Akhir"}
                                    </legend>
                                    <div className="grid grid-cols-[minmax(120px,1fr)_90px] gap-2">
                                        <select
                                            id={`${inputId}-${field}-month`}
                                            aria-label={`Bulan ${field === "from" ? "awal" : "akhir"}`}
                                            value={periodValues[field].slice(5, 7)}
                                            onChange={(event) => handleMonthChange(field, event.target.value)}
                                            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                        >
                                            {MONTH_OPTIONS.map((month, index) => (
                                                <option key={month} value={String(index + 1).padStart(2, "0")}>
                                                    {month}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            id={`${inputId}-${field}-year`}
                                            type="number"
                                            aria-label={`Tahun ${field === "from" ? "awal" : "akhir"}`}
                                            min={MIN_YEAR}
                                            max={MAX_YEAR}
                                            step={1}
                                            inputMode="numeric"
                                            value={yearDraft[field]}
                                            onChange={(event) => handleYearChange(field, event.target.value)}
                                            onBlur={() => {
                                                if (!isValidYear(yearDraft[field])) {
                                                    setYearDraft((current) => ({
                                                        ...current,
                                                        [field]: periodValues[field].slice(0, 4),
                                                    }))
                                                }
                                            }}
                                            className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                        />
                                    </div>
                                </fieldset>
                            ))}
                        </div>
                    ) : activeMode === "week" ? (
                        <div className="grid gap-3 p-3 sm:grid-cols-2">
                            {(["from", "to"] as const).map((field) => (
                                <div key={field} className="space-y-1.5">
                                    <label htmlFor={`${inputId}-${field}`} className="text-xs font-medium text-slate-600">
                                        Minggu {field === "from" ? "Awal" : "Akhir"}
                                    </label>
                                    <input
                                        id={`${inputId}-${field}`}
                                        type="week"
                                        value={periodValues[field]}
                                        onChange={(event) => handlePeriodChange(field, event.target.value)}
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : activeMode === "year" ? (
                        <div className="grid gap-3 p-3 sm:grid-cols-2">
                            {(["from", "to"] as const).map((field) => (
                                <div key={field} className="space-y-1.5">
                                    <label htmlFor={`${inputId}-${field}`} className="text-xs font-medium text-slate-600">
                                        Tahun {field === "from" ? "Awal" : "Akhir"}
                                    </label>
                                    <input
                                        id={`${inputId}-${field}`}
                                        type="number"
                                        min={MIN_YEAR}
                                        max={MAX_YEAR}
                                        step={1}
                                        inputMode="numeric"
                                        value={yearDraft[field]}
                                        onChange={(event) => handleYearChange(field, event.target.value)}
                                        onBlur={() => {
                                            if (!isValidYear(yearDraft[field])) {
                                                setYearDraft(periodValues)
                                            }
                                        }}
                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                    />
                                </div>
                            ))}
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
