"use client"

import * as React from "react"
import { endOfMonth, format, startOfMonth } from "date-fns"
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

interface DatePickerWithRangeProps {
    className?: string
    date?: DateRange | undefined
    onChange?: (date: DateRange | undefined) => void
    placeholder?: string
    enableMonthRange?: boolean
    mode?: "date" | "month"
    onModeChange?: (mode: "date" | "month") => void
}

export function DatePickerWithRange({
    className,
    date,
    onChange,
    placeholder = "Pilih rentang tanggal",
    enableMonthRange = false,
    mode,
    onModeChange,
}: DatePickerWithRangeProps) {
    const [internalMode, setInternalMode] = React.useState<"date" | "month">("date")
    const activeMode = mode ?? internalMode

    const handleModeChange = (nextMode: "date" | "month") => {
        if (mode === undefined) {
            setInternalMode(nextMode)
        }
        onModeChange?.(nextMode)
    }

    const monthFrom = date?.from ? format(date.from, "yyyy-MM") : ""
    const monthTo = date?.to ? format(date.to, "yyyy-MM") : ""

    const handleMonthChange = (field: "from" | "to", value: string) => {
        const nextFromValue = field === "from" ? value : monthFrom
        const nextToValue = field === "to" ? value : monthTo
        const from = nextFromValue ? startOfMonth(new Date(`${nextFromValue}-01`)) : undefined
        const to = nextToValue ? endOfMonth(new Date(`${nextToValue}-01`)) : undefined

        onChange?.(from || to ? { from, to: to ?? from } : undefined)
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal bg-white",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {activeMode === "month" ? format(date.from, "MM/yyyy") : formatDateUI(date.from)} -{" "}
                                    {activeMode === "month" ? format(date.to, "MM/yyyy") : formatDateUI(date.to)}
                                </>
                            ) : (
                                activeMode === "month" ? format(date.from, "MM/yyyy") : formatDateUI(date.from)
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-lg rounded-md" align="start" sideOffset={8}>
                    {enableMonthRange && (
                        <div className="flex border-b border-slate-200 p-2">
                            <Button
                                type="button"
                                variant={activeMode === "date" ? "default" : "ghost"}
                                size="sm"
                                className="h-8 rounded-r-none"
                                onClick={() => handleModeChange("date")}
                            >
                                Tanggal
                            </Button>
                            <Button
                                type="button"
                                variant={activeMode === "month" ? "default" : "ghost"}
                                size="sm"
                                className="h-8 rounded-l-none"
                                onClick={() => handleModeChange("month")}
                            >
                                Bulan
                            </Button>
                        </div>
                    )}

                    {activeMode === "month" ? (
                        <div className="grid gap-3 p-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600">Bulan Awal</label>
                                <input
                                    type="month"
                                    value={monthFrom}
                                    onChange={(event) => handleMonthChange("from", event.target.value)}
                                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-600">Bulan Akhir</label>
                                <input
                                    type="month"
                                    value={monthTo}
                                    onChange={(event) => handleMonthChange("to", event.target.value)}
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
