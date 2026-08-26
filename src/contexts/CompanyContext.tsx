import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { clearStoredCompanyId, getStoredCompanyId, setStoredCompanyId } from "@/lib/session/storage"
import { getToken } from "@/lib/auth"
import { Company, fetchUserCompanies } from "@/services/company.service"

type CompanyAccessStatus = "idle" | "loading" | "ready" | "error"

interface CompanyContextValue {
    companyId: string | null
    isLoading: boolean
    companies: Company[]
    companyAccessStatus: CompanyAccessStatus
    companyAccessError: string | null
    setCompanyId: (id: string) => void
    clearCompanyId: () => void
    loadCompanies: (options?: { forceRefresh?: boolean }) => Promise<Company[]>
    isCompanyAccessVerified: () => boolean
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [companyId, setCompanyIdState] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [companies, setCompanies] = useState<Company[]>([])
    const [companyAccessStatus, setCompanyAccessStatus] = useState<CompanyAccessStatus>("idle")
    const [companyAccessError, setCompanyAccessError] = useState<string | null>(null)
    const companiesRef = useRef<Company[]>([])
    const loadedForTokenRef = useRef<string | null>(null)
    const activeRequestRef = useRef<Promise<Company[]> | null>(null)

    useEffect(() => {
        const stored = getStoredCompanyId()
        if (stored) {
            setCompanyIdState(stored)
        }
        setIsLoading(false)
    }, [])

    function setCompanyId(id: string) {
        setStoredCompanyId(id)
        setCompanyIdState(id)
    }

    function clearCompanyId() {
        clearStoredCompanyId()
        setCompanyIdState(null)
    }

    const isCompanyAccessVerified = useCallback(() => {
        const token = getToken()
        return Boolean(token) && loadedForTokenRef.current === token
    }, [])

    const loadCompanies = useCallback(async (options: { forceRefresh?: boolean } = {}) => {
        const token = getToken()
        if (!token) {
            companiesRef.current = []
            loadedForTokenRef.current = null
            setCompanies([])
            setCompanyAccessStatus("idle")
            setCompanyAccessError(null)
            return []
        }

        const isCurrentSessionLoaded = loadedForTokenRef.current === token
        if (!options.forceRefresh && isCurrentSessionLoaded) {
            return companiesRef.current
        }

        if (activeRequestRef.current) {
            return activeRequestRef.current
        }

        setCompanyAccessStatus("loading")
        setCompanyAccessError(null)

        const request = fetchUserCompanies({ forceRefresh: options.forceRefresh })
            .then((data) => {
                companiesRef.current = data
                loadedForTokenRef.current = token
                setCompanies(data)
                setCompanyAccessStatus("ready")
                return data
            })
            .catch((error) => {
                const message = error?.message || "Gagal memverifikasi akses perusahaan"
                loadedForTokenRef.current = null
                setCompanyAccessError(message)
                setCompanyAccessStatus("error")
                throw error
            })
            .finally(() => {
                activeRequestRef.current = null
            })

        activeRequestRef.current = request
        return request
    }, [])

    return (
        <CompanyContext.Provider
            value={{
                companyId,
                isLoading,
                companies,
                companyAccessStatus,
                companyAccessError,
                setCompanyId,
                clearCompanyId,
                loadCompanies,
                isCompanyAccessVerified,
            }}
        >
            {children}
        </CompanyContext.Provider>
    )
}

export function useCompany() {
    const ctx = useContext(CompanyContext)
    if (!ctx) {
        throw new Error("useCompany must be used within CompanyProvider")
    }
    return ctx
}
