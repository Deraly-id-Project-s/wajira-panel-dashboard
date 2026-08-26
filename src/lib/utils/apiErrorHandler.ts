import { ApiValidationError } from '@/lib/api/response';
import { handleBackendError } from './errorLibrary';

type BackendErrorResponse = {
  status?: boolean;
  message?: string;
  errors?: Record<string, string[] | string> | string[] | string | null;
};

const fieldLabels: Record<string, string> = {
  company_id: "Company",
  cash_id: "Kas",
  account_id: "Akun",
  amount: "Nominal",
  date: "Tanggal",
  transaction_date: "Tanggal transaksi",
  payment_at: "Tanggal pembayaran",
  paid_date: "Tanggal bayar",
  bill_date: "Tanggal tagihan",
  receipt_date: "Tanggal terima",
  description: "Deskripsi",
  note: "Catatan",
  supplier_id: "Supplier",
  customer_id: "Customer",
  driver_id: "Driver",
  vehicle_fleet_id: "Kendaraan",
  vehicle_equipment_id: "Perlengkapan",
  material_id: "Material",
  qty: "Qty",
  price: "Harga",
  type: "Tipe",
  code: "Kode",
  name: "Nama",
  file: "File",
  invoice_file: "Nota",
  payment_proof: "Bukti pembayaran",
  ditlantas_process_id: "Proses Ditlantas",
  bbn_bill_id: "Tagihan BBN",
  bbn_bill_billing_id: "Billing Tagihan BBN",
  goods_transaction_id: "Transaksi barang",
  goods_transaction_billing_id: "Billing transaksi barang",
  unit_transaction_id: "Transaksi unit",
  unit_transaction_billing_id: "Billing transaksi unit",
  unit_transaction_item_detail_ids: "Unit yang dipilih",
};

const getFieldLabel = (field: string) => {
  return fieldLabels[field] || field.replace(/_/g, " ");
};

export const translateValidationMessage = (message: string, field?: string): string => {
  const label = field ? getFieldLabel(field) : "Data";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("required")) {
    return `${label} wajib diisi.`;
  }

  if (lowerMessage.includes("must be greater than 0")) {
    return `${label} harus lebih dari 0.`;
  }

  if (lowerMessage.includes("must be a number") || lowerMessage.includes("must be numeric")) {
    return `${label} harus berupa angka.`;
  }

  if (lowerMessage.includes("must be a date")) {
    return `${label} harus berupa tanggal yang valid.`;
  }

  if (lowerMessage.includes("must be a file")) {
    return `${label} harus berupa file.`;
  }

  if (lowerMessage.includes("invalid")) {
    return `${label} tidak valid.`;
  }

  if (lowerMessage.includes("already exists") || lowerMessage.includes("has already been taken")) {
    return `${label} sudah digunakan.`;
  }

  if (lowerMessage.includes("already been processed") || lowerMessage.includes("sudah diproses")) {
    return "Registrasi kendaraan yang dipilih sudah diproses.";
  }

  return message;
};

export const translateBackendMessage = (message: string, code?: string | number | null): string => {
  return handleBackendError(code, message);
};

export const getApiErrorMessage = (error: unknown): string => {
  if (!error) {
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  // Handle local application/network error (no response)
  const err = error as {
    response?: {
      status?: number;
      data?: BackendErrorResponse;
    };
    request?: unknown;
    message?: string;
    fieldErrors?: Record<string, string[]>;
    code?: string;
    statusCode?: number;
  };

  // If there's an explicit ApiValidationError instance
  if (error instanceof ApiValidationError && error.fieldErrors) {
    const errorMessages: string[] = [];
    Object.entries(error.fieldErrors).forEach(([field, messages]) => {
      if (Array.isArray(messages)) {
        messages.forEach((msg) => {
          errorMessages.push(translateValidationMessage(msg, field));
        });
      } else {
        errorMessages.push(translateValidationMessage(String(messages), field));
      }
    });
    if (errorMessages.length > 0) {
      return `Data belum valid:\n${errorMessages.map((msg) => `- ${msg}`).join("\n")}`;
    }
  }

  // Check for response status and backend payload
  const statusCode = err?.response?.status || err?.statusCode;
  const responseData = err?.response?.data;
  const backendMessage = responseData?.message || err?.message;
  const backendErrors = responseData?.errors;
  const errorCode = err?.code || (responseData as any)?.code || (err as any)?.response?.data?.code;

  // Handle Network Error
  if (!err?.response && (err?.request || err?.message) && !err?.statusCode) {
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  }

  if (statusCode && statusCode >= 500) {
    return "Terjadi kesalahan pada server. Silakan coba lagi beberapa saat.";
  }

  const errorMessages: string[] = [];

  // Parse errors structure from backend
  if (backendErrors) {
    if (typeof backendErrors === "string") {
      errorMessages.push(translateValidationMessage(backendErrors));
    } else if (Array.isArray(backendErrors)) {
      backendErrors.forEach((item) => {
        errorMessages.push(translateValidationMessage(String(item)));
      });
    } else if (typeof backendErrors === "object") {
      Object.entries(backendErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach((msg) => {
            errorMessages.push(translateValidationMessage(String(msg), field));
          });
        } else {
          errorMessages.push(translateValidationMessage(String(messages), field));
        }
      });
    }
  }

  if (errorMessages.length > 0) {
    return `Data belum valid:\n${errorMessages.map((msg) => `- ${msg}`).join("\n")}`;
  }

  if (backendMessage && backendMessage !== "Validation error" && backendMessage !== "Request failed") {
    return translateBackendMessage(backendMessage, errorCode);
  }

  // Handle custom status fallback
  if (statusCode === 401) {
    return "Sesi Anda telah berakhir. Silakan login kembali.";
  }

  if (statusCode === 403) {
    return "Anda tidak memiliki akses untuk melakukan aksi ini.";
  }

  if (statusCode === 404) {
    return "Data yang diminta tidak ditemukan.";
  }

  if (statusCode === 422) {
    return "Data yang dikirim belum valid. Periksa kembali input Anda.";
  }

  // Fallback to error.message if present
  if (err.message && err.message !== "Validation error" && err.message !== "Request failed") {
    return translateBackendMessage(err.message, errorCode);
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
};
