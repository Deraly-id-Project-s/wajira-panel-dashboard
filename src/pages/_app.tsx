import type { AppProps } from "next/app"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Toaster } from "@/components/ui/sonner"
import { useAuthCheck } from "@/features/auth/hooks/use-auth-check"

import "@/styles/globals.css"
import { CompanyProvider } from "@/contexts/CompanyContext"
import { PageLoadingProvider } from "@/contexts/PageLoadingContext"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  }))
  const router = useRouter()

  useAuthCheck(router)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
        return
      }

      const target = event.target
      if (!(target instanceof HTMLElement)) {
        return
      }

      if (target.closest("[data-no-enter-submit='true']")) {
        return
      }

      const tagName = target.tagName.toLowerCase()
      if (tagName === "textarea" || target.isContentEditable) {
        return
      }

      if (target.getAttribute("role") === "combobox" || target.getAttribute("aria-expanded") === "true") {
        return
      }

      if (target.closest("[data-slot='dropdown-menu-content'], [data-slot='select-content'], [cmdk-root]")) {
        return
      }

      const form = target.closest("form")
      if (!(form instanceof HTMLFormElement)) {
        return
      }

      const submitButton = form.querySelector<HTMLButtonElement | HTMLInputElement>(
        "button[type='submit']:not([disabled]), input[type='submit']:not([disabled])",
      )

      if (!submitButton && typeof form.requestSubmit !== "function") {
        return
      }

      event.preventDefault()

      if (typeof form.requestSubmit === "function") {
        form.requestSubmit(submitButton ?? undefined)
        return
      }

      form.submit()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <CompanyProvider>
        <PageLoadingProvider>
          <TooltipProvider>
            <main className="font-sans">
              <Component {...pageProps} />
              <Toaster position="bottom-center" />
            </main>
          </TooltipProvider>
        </PageLoadingProvider>
      </CompanyProvider>
    </QueryClientProvider>
  )
}
