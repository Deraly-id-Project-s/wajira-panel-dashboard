import { type FieldValues, type Path, type UseFormReturn, type UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiValidationError } from '@/lib/api/response';
import { ApiError } from '@/@types/api';

export interface HandleApiFormErrorOptions<TFieldValues extends FieldValues> {
  /**
   * Custom field mapping from Backend API field names to Form field names.
   * Example: { 'unit_type': 'unitType', 'selling_price': 'sellingPrice' }
   */
  fieldMapping?: Partial<Record<string, Path<TFieldValues>>>;

  /**
   * Whether to display a toast notification with the error message.
   * Defaults to true.
   */
  showToast?: boolean;

  /**
   * Fallback error message if no message is found in the error response.
   */
  fallbackMessage?: string;
}

/**
 * Extract validation errors dictionary from various API error structures
 * (Laravel 422 response, ApiError, ApiValidationError, AxiosError, etc.)
 */
export function extractApiValidationErrors(error: unknown): Record<string, string[]> | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  // Check ApiValidationError instance
  if (error instanceof ApiValidationError && error.fieldErrors) {
    return error.fieldErrors;
  }

  // Check ApiError instance or formatted object
  const anyError = error as any;

  if (anyError.fieldErrors && typeof anyError.fieldErrors === 'object') {
    return anyError.fieldErrors;
  }

  if (anyError.details && typeof anyError.details === 'object' && !Array.isArray(anyError.details)) {
    return anyError.details;
  }

  if (anyError.errors && typeof anyError.errors === 'object' && !Array.isArray(anyError.errors)) {
    return anyError.errors;
  }

  if (anyError.response?.data?.errors && typeof anyError.response.data.errors === 'object') {
    return anyError.response.data.errors;
  }

  return null;
}

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Extract the top-level error message from an API error
 */
export function extractApiErrorMessage(error: unknown, fallbackMessage = 'Terjadi kesalahan validasi'): string {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const anyError = error as any;

  if (typeof anyError.message === 'string' && anyError.message.trim().length > 0) {
    // If it's a generic Axios error message like "Request failed with status code 422", try checking response
    if (anyError.response?.data?.message) {
      return anyError.response.data.message;
    }
    return anyError.message;
  }

  if (anyError.response?.data?.message && typeof anyError.response.data.message === 'string') {
    return anyError.response.data.message;
  }

  const fieldErrors = extractApiValidationErrors(error);
  if (fieldErrors) {
    const firstKey = Object.keys(fieldErrors)[0];
    if (firstKey && fieldErrors[firstKey]?.[0]) {
      return fieldErrors[firstKey][0];
    }
  }

  return fallbackMessage;
}

/**
 * Handle 422 API validation errors and map them to react-hook-form field errors
 * and sonner toast notifications.
 *
 * @returns boolean True if validation errors were found and handled, false otherwise.
 */
export function handleApiFormError<TFieldValues extends FieldValues>(
  error: unknown,
  form?: UseFormReturn<TFieldValues> | { setError: UseFormSetError<TFieldValues> },
  options?: HandleApiFormErrorOptions<TFieldValues>
): boolean {
  const { fieldMapping = {}, showToast = true, fallbackMessage = 'Terjadi kesalahan validasi data' } = options || {};

  const validationErrors = extractApiValidationErrors(error);
  const anyError = error as any;
  const is422 = anyError?.statusCode === 422 || anyError?.response?.status === 422 || !!validationErrors;

  if (validationErrors && form) {
    const errorEntries = Object.entries(validationErrors);
    let firstErrorMessage: string | null = null;

    errorEntries.forEach(([fieldKey, messages]) => {
      if (!Array.isArray(messages) || messages.length === 0) return;

      const errorMessage = messages[0];
      if (!firstErrorMessage) {
        firstErrorMessage = errorMessage;
      }

      // 1. Check direct field mapping
      const mappedField = fieldMapping[fieldKey];

      // 2. Check direct key match or camelCase conversion
      const targetField = (mappedField || fieldKey || toCamelCase(fieldKey)) as Path<TFieldValues>;

      try {
        form.setError(targetField, {
          type: 'server',
          message: errorMessage,
        });
      } catch {
        // If field does not exist in form schema, try camelCase version
        try {
          form.setError(toCamelCase(fieldKey) as Path<TFieldValues>, {
            type: 'server',
            message: errorMessage,
          });
        } catch {
          // Ignore non-existent form fields
        }
      }
    });

    if (showToast) {
      const topMessage = extractApiErrorMessage(error, firstErrorMessage || fallbackMessage);
      // If top message is generic like "The given data was invalid." and we have a specific field message, show the specific message
      if (
        (topMessage.toLowerCase().includes('the given data was invalid') ||
          topMessage.toLowerCase().includes('validation error')) &&
        firstErrorMessage
      ) {
        toast.error(firstErrorMessage);
      } else {
        toast.error(topMessage);
      }
    }

    return true;
  }

  if (is422) {
    if (showToast) {
      toast.error(extractApiErrorMessage(error, fallbackMessage));
    }
    return true;
  }

  return false;
}
