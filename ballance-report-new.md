# Dokumentasi API Laporan Neraca (Balance Sheet) — Frontend Friendly (Next.js)

Dokumentasi lengkap integrasi API Laporan Neraca (*Balance Sheet*) untuk **Frontend Developer / Next.js**. Dokumen ini mencakup skema data baru, spesifikasi endpoint, TypeScript interface, contoh request/response, serta panduan implementasi service client di Next.js.

---

## 1. Ikhtisar & Arsitektur Bisnis

Laporan Neraca (*Balance Sheet*) menyajikan posisi keuangan perusahaan pada suatu periode waktu berdasarkan persamaan akuntansi:

$$\mathbf{\text{Aktiva (Assets)} = \text{Pasiva (Liabilities + Equity)}}$$

### Poin Kunci Skema Baru:
1. **Konfigurasi Berbasis Tahun (`BallanceTemplateYear`)**:
   Konfigurasi akun neraca disimpan per tahun pajak/laporan (`year`) untuk setiap perusahaan (`company_id`).
2. **4 Grup Akun Utama**:
   - `current_asset_account_ids`: Aktiva Lancar (Kas, Bank, Piutang Usaha, Uang Muka, Perlengkapan).
   - `fixed_asset_account_ids`: Aktiva Tetap (Kendaraan, Truk, Peralatan Operasional, Gedung, Akumulasi Penyusutan).
   - `liability_account_ids`: Kewajiban / Hutang (Hutang Usaha, Hutang Bank, Hutang Pajak, Hutang Lain-lain).
   - `equity_account_ids`: Ekuitas / Modal (Modal Disetor, Laba Ditahan, Prive).
3. **Penyederhanaan Kas & Bank**:
   Tabel lama `ballance_cashes` telah dihapus. Seluruh Kas dan Bank kini didaftarkan langsung sebagai ID akun di dalam grup `current_asset_account_ids`.
4. **Saldo Normal & Rumus Perhitungan Saldo**:
   - **Aktiva (Aset Lancar & Tetap)**: Saldo Normal **Debit**.
     $$\text{Nominal} = \text{Debit} - \text{Kredit}$$
   - **Kewajiban & Ekuitas**: Saldo Normal **Kredit**.
     $$\text{Nominal} = \text{Kredit} - \text{Debit}$$
5. **Akun Tanpa Transaksi Tetap Ditampilkan**:
   Semua akun yang didaftarkan pada konfigurasi tahun akan selalu dikembalikan pada array `accounts` dengan `amount: 0` jika belum ada transaksi. Hal ini memastikan UI tabel neraca tetap konsisten dan tidak berubah-ubah.
6. **Multi-Currency (IDR & USD)**:
   - Transaksi dalam mata uang IDR menghasilkan item dengan `"type": "IDR"`.
   - Transaksi dalam mata uang USD menghasilkan item terpisah dengan `"type": "USD"`.
   - Field `total` pada setiap kategori menjumlahkan nominal transaksi IDR.
7. **Cache & Invalidasi Otomatis**:
   Backend menerapkan caching query selama 1 jam (3600s). Cache otomatis di-invalidate ketika konfigurasi tahun diubah atau ketika ada mutasi kas masuk/keluar terkait.

---

## 2. TypeScript Definitions (Siap Digunakan di Next.js)

Simpan definisi tipe ini di direktori project Next.js Anda (misal `types/balance-report.ts`):

```typescript
// ==========================================
// Standard API Envelope Response
// ==========================================
export interface ApiResponse<T> {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | null;
  data: T;
}

// ==========================================
// Balance Sheet Template & Config Types
// ==========================================
export interface BalanceSheetConfig {
  current_asset_account_ids: number[];
  fixed_asset_account_ids: number[];
  liability_account_ids: number[];
  equity_account_ids: number[];
}

export interface BalanceTemplateYear {
  id: number;
  ballance_template_id: number;
  year: number;
  config: BalanceSheetConfig;
  created_at: string;
  updated_at: string;
}

export interface BalanceTemplate {
  id: number;
  company_id: number;
  created_at: string;
  updated_at: string;
  ballance_template_years: BalanceTemplateYear[];
}

export interface BalanceTemplateResponse {
  template: BalanceTemplate;
  default_structure: BalanceSheetConfig;
}

// ==========================================
// Balance Sheet Report Data Types
// ==========================================
export interface BalanceAccountItem {
  id: number;
  account_id: number;
  account_code: string | null;
  account_name: string;
  account_type: 'debit' | 'credit' | null;
  amount: number;
  type: 'IDR' | 'USD';
}

export interface BalanceCategoryCalc {
  total: number; // Total dalam IDR
  accounts: BalanceAccountItem[];
}

export interface BalanceReportSummary {
  opening_balance: number;
  ending_balance: number;
}

export interface BalanceReportData {
  year: number;
  month: string | null; // e.g. "january" .. "december" atau null jika setahun penuh
  summary: BalanceReportSummary;
  
  // ID Akun yang terdaftar pada konfigurasi
  current_asset_account_ids: number[];
  fixed_asset_account_ids: number[];
  liability_account_ids: number[];
  equity_account_ids: number[];

  // Rincian Akun & Subtotal per Kategori
  current_asset_calc: BalanceCategoryCalc;
  fixed_asset_calc: BalanceCategoryCalc;
  liability_calc: BalanceCategoryCalc;
  equity_calc: BalanceCategoryCalc;

  // Ringkasan Total
  total_current_assets: number;
  total_fixed_assets: number;
  total_assets: number;        // total_current_assets + total_fixed_assets
  total_liabilities: number;
  total_equity: number;
  total_passiva: number;       // total_liabilities + total_equity
}

// ==========================================
// Request Payloads
// ==========================================
export interface CreateBalanceYearPayload {
  year: number;
  current_asset_account_ids?: number[];
  fixed_asset_account_ids?: number[];
  liability_account_ids?: number[];
  equity_account_ids?: number[];
  config?: Partial<BalanceSheetConfig>;
}

export interface UpdateBalanceYearPayload {
  year?: number; // Bisa ubah tahun jika diperlukan
  current_asset_account_ids?: number[];
  fixed_asset_account_ids?: number[];
  liability_account_ids?: number[];
  equity_account_ids?: number[];
  config?: Partial<BalanceSheetConfig>;
}

export interface BalanceReportFilterParams {
  year?: number;
  month?: string | number; // 1-12 atau "january".."december"
  start_date?: string;     // YYYY-MM-DD
  end_date?: string;       // YYYY-MM-DD
  date?: string;           // YYYY-MM-DD (spesifik tanggal)
  category?: 
    | 'current_asset' | 'current_assets' | 'aktiva_lancar'
    | 'fixed_asset' | 'fixed_assets' | 'aktiva_tetap'
    | 'liability' | 'liabilities' | 'kewajiban' | 'hutang'
    | 'equity' | 'ekuitas' | 'modal'
    | 'assets' | 'aktiva'
    | 'passiva';
  account_id?: number;
  account_name?: string;
  account_code?: string;
  search?: string;
}
```

---

## 3. Ringkasan Endpoint API

Semua request membutuhkan header `Authorization: Bearer <token>` dan permission `report:list`.

| No | Method | Endpoint | Deskripsi |
|---|---|---|---|
| 1 | `GET` | `/api/balance-report/{company_id}` | Mengambil data Laporan Neraca & kalkulasi saldo |
| 2 | `GET` | `/api/balance-report/{company_id}/template` | Mengambil template dan daftar seluruh konfigurasi tahun |
| 3 | `GET` | `/api/balance-report/{company_id}/year/{year}` | Mengambil detail konfigurasi akun untuk tahun tertentu |
| 4 | `POST` | `/api/balance-report/{company_id}/year` | Menambahkan konfigurasi tahun baru |
| 5 | `PUT` | `/api/balance-report/{company_id}/year/{year}` | Memperbarui daftar akun pada tahun tertentu |
| 6 | `DELETE` | `/api/balance-report/{company_id}/year/{year}` | Menghapus konfigurasi tahun tertentu |
| 7 | `PUT` | `/api/balance-report/{company_id}/template` | Endpoint update kompatibilitas template |
| 8 | `GET` | `/api/balance-report/{company_id}/export` | Export laporan neraca ke format Excel (`.xlsx`) |

> **Catatan Endpoint Prefix**: Prefix rute default backend adalah `/api` atau `/wapi` sesuai konfigurasi reverse proxy/gateway frontend Next.js Anda.

---

## 4. Rincian Spesifikasi Endpoint

### 4.1. Ambil Data Laporan Neraca
Mengambil ringkasan saldo, rincian aktiva (lancar & tetap), rincian pasiva (kewajiban & ekuitas), serta kalkulasi neraca.

- **URL**: `GET /api/balance-report/{company_id}`
- **Query Parameters**:

| Parameter | Tipe | Wajib? | Contoh / Keterangan |
|---|---|---|---|
| `year` | Integer | Opsional | `2026`. Default: tahun berjalan `now()->year` atau diambil dari tanggal filter. |
| `month` | String / Int | Opsional | `january`, `february`, ..., `december` atau `1`..`12`. Jika kosong, menghitung sepanjang tahun. |
| `start_date` | String (Date) | Opsional | `2026-01-01` (alias: `date_from`, `from_date`) |
| `end_date` | String (Date) | Opsional | `2026-12-31` (alias: `date_to`, `to_date`) |
| `date` | String (Date) | Opsional | `2026-10-15` (alias: `payment_at`) untuk transaksi pada tanggal spesifik. |
| `category` | String | Opsional | Filter kelompok akun: `current_asset`, `fixed_asset`, `liability`, `equity`, `assets` (semua aktiva), `passiva` (kewajiban + ekuitas). |
| `account_id` | Integer | Opsional | `15` (ID spesifik akun). |
| `account_name` | String | Opsional | Pencarian parsial nama akun (`LIKE %name%`). |
| `account_code` | String | Opsional | Pencarian parsial kode akun (`LIKE %code%`). |
| `search` | String | Opsional | Pencarian teks pada catatan transaksi (*note*) atau nominal transaksi. |

#### Contoh Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Balance report data retrieved successfully",
  "errors": null,
  "data": {
    "year": 2026,
    "month": "january",
    "summary": {
      "opening_balance": 50000000,
      "ending_balance": 85000000
    },
    "current_asset_account_ids": [10, 11, 12],
    "fixed_asset_account_ids": [20, 21],
    "liability_account_ids": [30, 31],
    "equity_account_ids": [40],
    "current_asset_calc": {
      "total": 55000000,
      "accounts": [
        {
          "id": 10,
          "account_id": 10,
          "account_code": "1110",
          "account_name": "Kas Operasional",
          "account_type": "debit",
          "amount": 25000000,
          "type": "IDR"
        },
        {
          "id": 11,
          "account_id": 11,
          "account_code": "1120",
          "account_name": "Bank BCA",
          "account_type": "debit",
          "amount": 30000000,
          "type": "IDR"
        },
        {
          "id": 12,
          "account_id": 12,
          "account_code": "1130",
          "account_name": "Piutang Usaha",
          "account_type": "debit",
          "amount": 0,
          "type": "IDR"
        }
      ]
    },
    "fixed_asset_calc": {
      "total": 120000000,
      "accounts": [
        {
          "id": 20,
          "account_id": 20,
          "account_code": "1210",
          "account_name": "Kendaraan Truk Ekspedisi",
          "account_type": "debit",
          "amount": 120000000,
          "type": "IDR"
        }
      ]
    },
    "liability_calc": {
      "total": 35000000,
      "accounts": [
        {
          "id": 30,
          "account_id": 30,
          "account_code": "2110",
          "account_name": "Hutang Usaha",
          "account_type": "credit",
          "amount": 35000000,
          "type": "IDR"
        }
      ]
    },
    "equity_calc": {
      "total": 140000000,
      "accounts": [
        {
          "id": 40,
          "account_id": 40,
          "account_code": "3110",
          "account_name": "Modal Pemilik Disetor",
          "account_type": "credit",
          "amount": 140000000,
          "type": "IDR"
        }
      ]
    },
    "total_current_assets": 55000000,
    "total_fixed_assets": 120000000,
    "total_assets": 175000000,
    "total_liabilities": 35000000,
    "total_equity": 140000000,
    "total_passiva": 175000000
  }
}
```

---

### 4.2. Ambil Template & Daftar Seluruh Tahun
Digunakan pada halaman pengaturan atau dropdown pemilihan tahun untuk melihat tahun mana saja yang sudah memiliki konfigurasi akun.

- **URL**: `GET /api/balance-report/{company_id}/template`
- **Query Parameters**:
  - `year` *(opsional, integer)*: Jika ingin memfilter konfigurasi hanya tahun tertentu.

#### Contoh Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Balance template retrieved successfully",
  "errors": null,
  "data": {
    "template": {
      "id": 1,
      "company_id": 1,
      "created_at": "2026-10-13T10:00:00.000000Z",
      "updated_at": "2026-10-13T10:00:00.000000Z",
      "ballance_template_years": [
        {
          "id": 12,
          "ballance_template_id": 1,
          "year": 2026,
          "config": {
            "current_asset_account_ids": [10, 11, 12],
            "fixed_asset_account_ids": [20, 21],
            "liability_account_ids": [30, 31],
            "equity_account_ids": [40]
          },
          "created_at": "2026-10-13T10:00:00.000000Z",
          "updated_at": "2026-10-13T10:00:00.000000Z"
        },
        {
          "id": 8,
          "ballance_template_id": 1,
          "year": 2025,
          "config": {
            "current_asset_account_ids": [10, 11],
            "fixed_asset_account_ids": [20],
            "liability_account_ids": [30],
            "equity_account_ids": [40]
          },
          "created_at": "2025-01-05T08:00:00.000000Z",
          "updated_at": "2025-01-05T08:00:00.000000Z"
        }
      ]
    },
    "default_structure": {
      "current_asset_account_ids": [],
      "fixed_asset_account_ids": [],
      "liability_account_ids": [],
      "equity_account_ids": []
    }
  }
}
```

---

### 4.3. Ambil Detail Konfigurasi Tahun Tertentu
Mengambil konfigurasi akun untuk 1 tahun tertentu.

- **URL**: `GET /api/balance-report/{company_id}/year/{year}`
  *(Parameter `{year}` dapat berupa angka 4 digit seperti `2026` ATAU primary key `id` record konfigurasi).*

#### Contoh Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Balance template year retrieved successfully",
  "errors": null,
  "data": {
    "id": 12,
    "ballance_template_id": 1,
    "year": 2026,
    "config": {
      "current_asset_account_ids": [10, 11, 12],
      "fixed_asset_account_ids": [20, 21],
      "liability_account_ids": [30, 31],
      "equity_account_ids": [40]
    },
    "created_at": "2026-10-13T10:00:00.000000Z",
    "updated_at": "2026-10-13T10:00:00.000000Z"
  }
}
```

#### Response Error 404 (Not Found):
```json
{
  "status": false,
  "message": "Configuration for year 2028 not found",
  "errors": null,
  "data": null
}
```

---

### 4.4. Buat Konfigurasi Tahun Baru
Menambahkan mapping akun neraca untuk tahun baru.

- **URL**: `POST /api/balance-report/{company_id}/year`
- **Headers**: `Content-Type: application/json`
- **Request Body (Format Flat / Root Level)**:
```json
{
  "year": 2027,
  "current_asset_account_ids": [10, 11, 12],
  "fixed_asset_account_ids": [20, 21],
  "liability_account_ids": [30],
  "equity_account_ids": [40]
}
```
*(Backend juga mendukung format bersarang / nested object `config: { ... }`)*.

#### Validasi Field:
- `year` *(wajib)*: Integer antara `2000` s/d `2100`.
- Setiap elemen array akun *(opsional)*: Wajib integer, valid di tabel `accounts`, dan terdaftar di `company_id` yang sama (`RightAccountRule`).

#### Response Sukses (201 Created):
```json
{
  "status": true,
  "message": "Balance template year created successfully",
  "errors": null,
  "data": {
    "id": 15,
    "ballance_template_id": 1,
    "year": 2027,
    "config": {
      "current_asset_account_ids": [10, 11, 12],
      "fixed_asset_account_ids": [20, 21],
      "liability_account_ids": [30],
      "equity_account_ids": [40]
    },
    "created_at": "2026-10-15T06:15:00.000000Z",
    "updated_at": "2026-10-15T06:15:00.000000Z"
  }
}
```

#### Response Duplikasi Tahun (422 Unprocessable Entity):
```json
{
  "status": false,
  "message": "Configuration for year 2027 already exists for this template",
  "errors": null,
  "data": null
}
```

---

### 4.5. Perbarui Konfigurasi Tahun
Memperbarui daftar akun yang dipilih untuk tahun tertentu.

- **URL**: `PUT /api/balance-report/{company_id}/year/{year}`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "current_asset_account_ids": [10, 11, 12, 15],
  "liability_account_ids": [30, 31, 32]
}
```
> **Partial Update**: Anda hanya perlu mengirimkan kategori yang ingin diperbarui. Kategori yang tidak dikirimkan dalam request akan tetap mempertahankan konfigurasi yang sudah tersimpan sebelumnya.

#### Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Balance template year updated successfully",
  "errors": null,
  "data": {
    "id": 12,
    "ballance_template_id": 1,
    "year": 2026,
    "config": {
      "current_asset_account_ids": [10, 11, 12, 15],
      "fixed_asset_account_ids": [20, 21],
      "liability_account_ids": [30, 31, 32],
      "equity_account_ids": [40]
    },
    "updated_at": "2026-10-15T06:30:00.000000Z"
  }
}
```

---

### 4.6. Hapus Konfigurasi Tahun
Menghapus konfigurasi tahun dari template perusahaan.

- **URL**: `DELETE /api/balance-report/{company_id}/year/{year}`

#### Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Balance template year deleted successfully",
  "errors": null,
  "data": null
}
```

---

### 4.7. Update Kompatibilitas Template (Fallback)
Endpoint kompatibilitas untuk form lama yang mengirim update ke `/template`. Jika `year` tidak dikirim, otomatis menargetkan tahun berjalan.

- **URL**: `PUT /api/balance-report/{company_id}/template`
- **Request Body**:
```json
{
  "year": 2026,
  "current_asset_account_ids": [10, 11, 12],
  "fixed_asset_account_ids": [20]
}
```

#### Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Balance template updated successfully",
  "errors": null,
  "data": {
    "template": { ... },
    "template_year": { ... }
  }
}
```

---

### 4.8. Export Laporan Neraca ke File Excel
Mengunduh spreadsheet `.xlsx` dari laporan neraca sesuai filter yang dipilih.

- **URL**: `GET /api/balance-report/{company_id}/export`
- **Query Parameters**: Sama seperti parameter filter pada `GET /api/balance-report/{company_id}` (`year`, `month`, `category`, `start_date`, `end_date`, dll).
- **Response**: Binary stream file Excel dengan `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` dan header `Content-Disposition: attachment; filename="balance_report.xlsx"`.

---

## 5. Implementasi Frontend Next.js (Best Practices)

### 5.1. Service Layer Client (`services/balanceReportService.ts`)

```typescript
import axios from 'axios';
import type {
  ApiResponse,
  BalanceReportData,
  BalanceReportFilterParams,
  BalanceTemplateResponse,
  BalanceTemplateYear,
  CreateBalanceYearPayload,
  UpdateBalanceYearPayload,
} from '@/types/balance-report';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

// Interceptor untuk menyematkan auth token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const balanceReportService = {
  // 1. Ambil Data Laporan Neraca
  async getReport(companyId: number | string, params?: BalanceReportFilterParams): Promise<BalanceReportData> {
    const res = await apiClient.get<ApiResponse<BalanceReportData>>(`/balance-report/${companyId}`, {
      params,
    });
    return res.data.data;
  },

  // 2. Ambil Template & Daftar Tahun
  async getTemplate(companyId: number | string, year?: number): Promise<BalanceTemplateResponse> {
    const res = await apiClient.get<ApiResponse<BalanceTemplateResponse>>(`/balance-report/${companyId}/template`, {
      params: year ? { year } : undefined,
    });
    return res.data.data;
  },

  // 3. Ambil Konfigurasi 1 Tahun Spesifik
  async getYearConfig(companyId: number | string, year: number | string): Promise<BalanceTemplateYear> {
    const res = await apiClient.get<ApiResponse<BalanceTemplateYear>>(`/balance-report/${companyId}/year/${year}`);
    return res.data.data;
  },

  // 4. Tambah Konfigurasi Tahun Baru
  async createYearConfig(companyId: number | string, payload: CreateBalanceYearPayload): Promise<BalanceTemplateYear> {
    const res = await apiClient.post<ApiResponse<BalanceTemplateYear>>(`/balance-report/${companyId}/year`, payload);
    return res.data.data;
  },

  // 5. Update Konfigurasi Tahun
  async updateYearConfig(
    companyId: number | string,
    year: number | string,
    payload: UpdateBalanceYearPayload
  ): Promise<BalanceTemplateYear> {
    const res = await apiClient.put<ApiResponse<BalanceTemplateYear>>(`/balance-report/${companyId}/year/${year}`, payload);
    return res.data.data;
  },

  // 6. Hapus Konfigurasi Tahun
  async deleteYearConfig(companyId: number | string, year: number | string): Promise<void> {
    await apiClient.delete<ApiResponse<null>>(`/balance-report/${companyId}/year/${year}`);
  },

  // 7. Unduh File Excel Laporan Neraca
  async downloadExcel(companyId: number | string, params?: BalanceReportFilterParams): Promise<void> {
    const response = await apiClient.get(`/balance-report/${companyId}/export`, {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `balance_report_${companyId}_${params?.year || new Date().getFullYear()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
```

---

### 5.2. Logika Cek Keseimbangan Neraca (*Balance Check*)

Di komponen UI Next.js, Anda dapat menghitung status keseimbangan dan selisihnya:

```tsx
import React from 'react';
import type { BalanceReportData } from '@/types/balance-report';

interface BalanceStatusProps {
  data: BalanceReportData;
}

export const BalanceStatusBar: React.FC<BalanceStatusProps> = ({ data }) => {
  const isBalanced = data.total_assets === data.total_passiva;
  const difference = Math.abs(data.total_assets - data.total_passiva);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  return (
    <div className={`p-4 rounded-lg flex items-center justify-between ${isBalanced ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
      <div>
        <p className="font-semibold text-sm">
          Status Neraca: {isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG (UNBALANCED)'}
        </p>
        <p className="text-xs text-gray-600">
          Total Aktiva: {formatCurrency(data.total_assets)} | Total Pasiva: {formatCurrency(data.total_passiva)}
        </p>
      </div>

      {!isBalanced && (
        <span className="text-rose-600 font-bold text-sm">
          Selisih: {formatCurrency(difference)}
        </span>
      )}
    </div>
  );
};
```

---

### 5.3. Penanganan Multi-Currency (IDR & USD)

Karena Wajira mendukung akun valas (USD):
1. **Nilai IDR**: Disajikan dengan `"type": "IDR"`. Subtotal kalkulasi kategori (`current_asset_calc.total`, dll.) dan total neraca (`total_assets`, `total_passiva`) merepresentasikan akumulasi mata uang dasar (IDR).
2. **Nilai USD**: Jika akun memiliki transaksi USD, objek akun tambahan akan muncul dengan `"type": "USD"`.
3. Rekomendasi UI: Tampilkan badge mata uang di samping nominal:
   ```tsx
   <span>
     {item.type === 'USD' ? `$${item.amount.toLocaleString()}` : `Rp ${item.amount.toLocaleString('id-ID')}`}
     <span className="ml-2 text-xs uppercase px-1.5 py-0.5 rounded bg-gray-100">{item.type}</span>
   </span>
   ```

---

## 6. Kode Error & Rekomendasi Penanganan di Frontend

| HTTP Status | Penyebab | Cara Penanganan di Frontend Next.js |
|---|---|---|
| `401 Unauthorized` | Token Bearer belum disertakan atau masa berlaku habis. | Redirect pengguna ke halaman `/login`. |
| `403 Forbidden` | Akun pengguna tidak memiliki permission `report:list`. | Tampilkan notifikasi "Anda tidak memiliki hak akses melihat laporan ini". |
| `404 Not Found` | Perusahaan (`companyId`) atau konfigurasi tahun tidak ditemukan. | Tampilkan empty state dengan opsi membuat konfigurasi untuk tahun tersebut. |
| `422 Unprocessable` | Validasi gagal (misal tahun sudah pernah dibuat, atau akun bukan milik perusahaan). | Baca field `errors` dari response untuk memunculkan pesan merah di bawah field form terkait. |
| `500 Server Error` | Terjadi kesalahan query/kalkulasi di server backend. | Tampilkan pesan toast error: "Gagal memuat laporan neraca, silakan hubungi tim IT". |
