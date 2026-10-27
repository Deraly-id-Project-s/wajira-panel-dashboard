import { ApiResponseError } from '@/lib/api/response';

export interface DownloadResponseLike {
  data: Blob | any;
  headers?: Record<string, any>;
}

/**
 * Reusable utility to handle file download from Axios response (with responseType: 'blob')
 * - Parses JSON error if backend returned an error envelope
 * - Extracts filename from Content-Disposition header if available
 * - Triggers browser download and cleans up URL object
 */
export async function downloadFileFromResponse(
  response: DownloadResponseLike,
  defaultFilename = 'download.xlsx',
): Promise<void> {
  const headers = response.headers || {};
  const contentType = headers['content-type'] || headers['Content-Type'];
  const isJson = typeof contentType === 'string' && contentType.includes('application/json');

  if (isJson) {
    let message = 'Gagal mengunduh file';
    try {
      const textData =
        typeof response.data?.text === 'function'
          ? await response.data.text()
          : typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data);
      const jsonResponse = JSON.parse(textData);
      message = jsonResponse.errors || jsonResponse.message || message;
    } catch {
      // fallback to default message
    }
    throw new ApiResponseError(message);
  }

  let filename = defaultFilename;
  const disposition = headers['content-disposition'] || headers['Content-Disposition'];
  if (typeof disposition === 'string') {
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i);
    if (filenameMatch?.[1]) {
      filename = decodeURIComponent(filenameMatch[1].trim());
    }
  }

  if (typeof window === 'undefined') return;

  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Extracts error message from Axios error when responseType: 'blob' was set
 */
export async function extractBlobErrorMessage(error: any, fallbackMessage = 'Gagal mengunduh file'): Promise<string> {
  if (error?.response?.data instanceof Blob) {
    try {
      const text = await error.response.data.text();
      const json = JSON.parse(text);
      return json.errors || json.message || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }
  return error?.message || fallbackMessage;
}
