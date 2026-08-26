/**
 * Error Library
 * Menyediakan pemetaan kode error dan pesan error bahasa Inggris dari backend
 * ke pesan bahasa Indonesia yang ramah pengguna (user-friendly).
 */

// 1. Pemetaan Kode Error (Error Codes Mapping)
export const ERROR_CODES: Record<string, string> = {
  // --- AUTHENTICATION & AUTHORIZATION ---
  'UNAUTHORIZED': 'Sesi Anda telah berakhir. Silakan login kembali.',
  'UNAUTHENTICATED': 'Anda harus login terlebih dahulu.',
  'FORBIDDEN': 'Anda tidak memiliki akses untuk melakukan aksi ini.',
  'PERMISSION_DENIED': 'Akses ditolak. Anda tidak memiliki izin yang diperlukan.',
  'INVALID_CREDENTIALS': 'Email atau kata sandi yang Anda masukkan salah.',
  'TOKEN_EXPIRED': 'Sesi Anda telah kedaluwarsa. Silakan login kembali.',
  'TOKEN_INVALID': 'Sesi tidak valid. Silakan login kembali.',
  'USER_NOT_FOUND': 'Pengguna tidak terdaftar dalam sistem.',
  'USER_BLOCKED': 'Akun Anda telah dinonaktifkan. Hubungi administrator.',

  // --- VALIDATION & CLIENT ERRORS ---
  'VALIDATION_ERROR': 'Data yang dikirim tidak valid. Periksa kembali input Anda.',
  'BAD_REQUEST': 'Permintaan tidak dapat diproses oleh server.',
  'INVALID_INPUT': 'Input yang Anda masukkan tidak valid.',
  'MISSING_REQUIRED_FIELDS': 'Beberapa field wajib belum diisi.',

  // --- RESOURCE & DATABASE ERRORS ---
  'NOT_FOUND': 'Data tidak ditemukan.',
  'RECORD_NOT_FOUND': 'Data yang dicari tidak ditemukan di database.',
  'DUPLICATE_ENTRY': 'Data ini sudah terdaftar di dalam sistem.',
  'RESOURCE_EXISTS': 'Data ini sudah ada.',
  'FOREIGN_KEY_VIOLATION': 'Data tidak dapat dihapus atau diubah karena sedang digunakan oleh data lain.',
  'DELETE_RESTRICTED': 'Data ini terikat dengan transaksi aktif dan tidak bisa dihapus.',

  // --- BUSINESS LOGIC & TRANSACTION ERRORS ---
  'BILLING_NOT_FOUND': 'Billing utama tidak ditemukan. Silakan buat billing terlebih dahulu sebelum melakukan pembayaran.',
  'INSUFFICIENT_BALANCE': 'Saldo Anda tidak mencukupi untuk melakukan transaksi ini.',
  'INSUFFICIENT_STOCK': 'Stok barang tidak mencukupi untuk jumlah yang diminta.',
  'TRANSACTION_FAILED': 'Transaksi gagal diproses. Silakan coba beberapa saat lagi.',
  'PAYMENT_FAILED': 'Pembayaran gagal. Silakan periksa kembali detail pembayaran Anda.',
  'ALREADY_PROCESSED': 'Data ini sudah diproses sebelumnya dan tidak dapat diubah lagi.',
  'VEHICLE_ALREADY_PROCESSED': 'Registrasi kendaraan yang dipilih sudah diproses.',
  'LIMIT_EXCEEDED': 'Batas maksimum transaksi telah tercapai.',

  // --- SERVER & NETWORK ERRORS ---
  'INTERNAL_SERVER_ERROR': 'Terjadi kesalahan pada server internal. Silakan hubungi tim teknis.',
  'SERVICE_UNAVAILABLE': 'Layanan backend sedang tidak tersedia. Coba lagi nanti.',
  'GATEWAY_TIMEOUT': 'Server membutuhkan waktu terlalu lama untuk merespons. Silakan coba lagi.',
};

// 2. Pemetaan Pola Pesan Error Bahasa Inggris (English Message Patterns Mapping)
// Berguna jika backend tidak mengirimkan kode error spesifik, tapi mengirimkan pesan teks bahasa Inggris.
export interface ErrorPattern {
  pattern: RegExp | string;
  indonesian: string;
}

export const ERROR_MESSAGE_PATTERNS: ErrorPattern[] = [
  // Authentication & Auth
  { pattern: /unauthenticated/i, indonesian: 'Sesi Anda telah berakhir. Silakan login kembali.' },
  { pattern: /unauthorized/i, indonesian: 'Anda tidak memiliki akses untuk melakukan aksi ini.' },
  { pattern: /forbidden/i, indonesian: 'Akses ditolak. Anda tidak memiliki izin untuk aksi ini.' },
  { pattern: /invalid credentials/i, indonesian: 'Email atau kata sandi salah.' },
  { pattern: /token has expired/i, indonesian: 'Sesi login telah kedaluwarsa. Silakan login kembali.' },

  // Resource / CRUD
  { pattern: /not found/i, indonesian: 'Data tidak ditemukan.' },
  { pattern: /unable to locate/i, indonesian: 'Gagal menemukan data yang diminta.' },
  { pattern: /already exists/i, indonesian: 'Data tersebut sudah terdaftar di sistem.' },
  { pattern: /has already been taken/i, indonesian: 'Data ini sudah digunakan oleh data lain.' },
  
  // Validation (Laravel defaults)
  { pattern: /field is required/i, indonesian: 'Field ini wajib diisi.' },
  { pattern: /must be a number/i, indonesian: 'Input harus berupa angka.' },
  { pattern: /must be numeric/i, indonesian: 'Input harus berupa angka.' },
  { pattern: /must be greater than 0/i, indonesian: 'Nilai harus lebih besar dari 0.' },
  { pattern: /must be a valid date/i, indonesian: 'Format tanggal tidak valid.' },
  
  // Business logic
  { pattern: /billing utama tidak ditemukan/i, indonesian: 'Billing utama tidak ditemukan. Silakan buat billing terlebih dahulu sebelum melakukan pembayaran.' },
  { pattern: /already been processed/i, indonesian: 'Registrasi kendaraan yang dipilih sudah diproses.' },
  { pattern: /insufficient stock/i, indonesian: 'Stok barang tidak mencukupi.' },
  { pattern: /insufficient balance/i, indonesian: 'Saldo kas atau rekening tidak mencukupi.' },

  // System & Connection
  { pattern: /network error/i, indonesian: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' },
  { pattern: /timeout/i, indonesian: 'Waktu tunggu koneksi habis. Silakan coba lagi.' },
  { pattern: /server error/i, indonesian: 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi.' },
];

/**
 * Menerjemahkan dan menangani error dari backend.
 * Fungsi ini membandingkan kode error dan/atau pesan error bahasa Inggris dari backend
 * dengan library terjemahan bahasa Indonesia.
 * 
 * @param code Kode error dari backend (misalnya 'VALIDATION_ERROR', 'INSUFFICIENT_STOCK')
 * @param message Pesan error asli dari backend dalam bahasa Inggris
 * @param fallbackMessage Pesan default jika tidak ditemukan kecocokan (default: 'Terjadi kesalahan. Silakan coba lagi.')
 * @returns Pesan error dalam Bahasa Indonesia yang sudah diterjemahkan
 */
export function handleBackendError(
  code?: string | number | null,
  message?: string | null,
  fallbackMessage?: string
): string {
  // 1. Cek kecocokan berdasarkan Kode Error (Error Code)
  if (code) {
    const cleanCode = String(code).trim().toUpperCase();
    if (ERROR_CODES[cleanCode]) {
      return ERROR_CODES[cleanCode];
    }
  }

  // 2. Cek kecocokan berdasarkan Pola Pesan Error (Error Message Pattern)
  if (message) {
    const cleanMessage = String(message).trim();
    for (const item of ERROR_MESSAGE_PATTERNS) {
      if (item.pattern instanceof RegExp) {
        if (item.pattern.test(cleanMessage)) {
          return item.indonesian;
        }
      } else {
        if (cleanMessage.toLowerCase().includes(item.pattern.toLowerCase())) {
          return item.indonesian;
        }
      }
    }
  }

  // 3. Jika tidak ada kecocokan, gunakan pesan asli (jika sudah bahasa Indonesia)
  // atau kembalikan fallbackMessage / default
  if (message) {
    // Deteksi sederhana apakah pesan sudah mengandung bahasa Indonesia
    const hasIndonesianWords = /\b(tidak|dan|atau|adalah|sudah|wajib|diisi|ditemukan|kesalahan|kembali|silakan)\b/i.test(message);
    if (hasIndonesianWords) {
      return message;
    }
  }

  return fallbackMessage || message || 'Terjadi kesalahan. Silakan coba lagi.';
}
