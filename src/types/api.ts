/**
 * Generic API Type Definitions
 * Reusable types untuk semua API interactions
 */

export type ApiStatus = 'success' | 'error'

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T> {
    data: T
    status: ApiStatus
    message?: string
    timestamp: string
}

/**
 * API Error Structure
 */
export interface ApiError {
    code: string
    message: string
    details?: Record<string, unknown> | string
    statusCode?: number
}

/**
 * Paginated Response untuk list endpoints
 */
export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

/**
 * Query Parameters untuk filtering dan sorting
 */
export interface QueryParams {
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
    search?: string
    filters?: Record<string, string | number | boolean>
}

/**
 * Authentication Token Response
 */
export interface AuthTokenResponse {
    accessToken: string
    refreshToken: string
    expiresIn: number
    tokenType: 'Bearer'
}
