"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input, type InputProps } from "@/components/ui/input"

export interface SearchInputProps extends Omit<InputProps, "type"> {
    wrapperClassName?: string
    onValueChange?: (value: string) => void
    enableShortcut?: boolean
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    (
        {
            className,
            wrapperClassName,
            onChange,
            onValueChange,
            placeholder = "Cari...",
            enableShortcut = true,
            disabled,
            readOnly,
            ...props
        },
        forwardedRef,
    ) => {
        const inputRef = React.useRef<HTMLInputElement | null>(null)

        const setInputRef = React.useCallback((node: HTMLInputElement | null) => {
            inputRef.current = node

            if (typeof forwardedRef === "function") {
                forwardedRef(node)
            } else if (forwardedRef) {
                forwardedRef.current = node
            }
        }, [forwardedRef])

        React.useEffect(() => {
            if (!enableShortcut || disabled || readOnly) return

            const focusSearchInput = (event: KeyboardEvent) => {
                if (
                    event.defaultPrevented
                    || !event.ctrlKey
                    || event.altKey
                    || event.metaKey
                    || event.key.toLowerCase() !== "h"
                ) {
                    return
                }

                event.preventDefault()
                inputRef.current?.focus()
                inputRef.current?.select()
            }

            document.addEventListener("keydown", focusSearchInput)
            return () => document.removeEventListener("keydown", focusSearchInput)
        }, [disabled, enableShortcut, readOnly])

        return (
            <div className={cn("relative w-full", wrapperClassName)}>
                <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <Input
                    {...props}
                    ref={setInputRef}
                    type="search"
                    disabled={disabled}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    aria-keyshortcuts={enableShortcut ? "Control+H" : undefined}
                    className={cn("bg-white pl-9", enableShortcut && "pr-16", className)}
                    onChange={(event) => {
                        onChange?.(event)
                        onValueChange?.(event.target.value)
                    }}
                />
                {enableShortcut && (
                    <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-flex">
                        Ctrl H
                    </kbd>
                )}
            </div>
        )
    },
)

SearchInput.displayName = "SearchInput"

export { SearchInput }
