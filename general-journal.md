# Dokumentasi API Jurnal Umum (General Journal)

Dokumen ini merupakan panduan integrasi komprehensif untuk Frontend Developer / AI Frontend (Next.js) dan QA dalam mengimplementasikan modul **Jurnal Umum (General Journal)**, **Alokasi Pembayaran (Billing Payments)**, dan **Laporan Jurnal Umum (General Journal Report)**.

---

## 1. Arsitektur & Hirarki Skema

Struktur relasi data Jurnal Umum telah distandarisasi ke dalam 4 tingkatan hirarki:
```
GeneralJournal (Header)
  └── GeneralJournalBilling (Billing Item)
        ├── GeneralJournalBillingCash (Debet / Sumber Kas)
        └── GeneralJournalBillingPayment (Kredit / Akun Lawan COA)
```

### Pemisahan Tanggung Jawab Controller:
1. **`GeneralJournalController`**:
   - Mengelola **Header Jurnal** (`GeneralJournal`).
   - Mengelola **Item Baris Billing** (`GeneralJournalBilling`).
   - Mengelola **Alokasi Kas** (`GeneralJournalBillingCash`).
2. **`GeneralJournalBillingPaymentController`**:
   - Mengelola **Alokasi Akun Lawan / Kredit** (`GeneralJournalBillingPayment`) per billing item.
3. **`GeneralJournalReportController`**:
   - Menampilkan laporan rincian memorial untuk jurnal yang telah diposting (`is_paid = true` & `is_valid = true`).

---

## 2. Ikhtisar Aturan Bisnis & Lifecycle

1. **Prinsip Akuntansi (Debet & Kredit)**:
   - **Debet**: Dihitung dari total nominal alokasi kas pada `general_journal_billing_cashes`.
   - **Kredit**: Dihitung dari total nominal alokasi akun lawan (COA) pada `general_journal_billing_payments`.
   - Jurnal dinyatakan seimbang (**`is_balanced: true`**) jika $\sum \text{Debet} = \sum \text{Kredit}$ dan nilai total $> 0$.
2. **Posting & Unposting (`updatePaidStatus`)**:
   - Jurnal baru berstatus draft (`is_paid = false`).
   - Posting jurnal (`is_paid: true`) **hanya diizinkan** jika jurnal memiliki minimal satu billing item dan berada dalam kondisi seimbang (`is_balanced: true`).
   - Saat status `is_paid: true`, `is_valid` otomatis bernilai `true`.
3. **Immutability Setelah Posting**:
   - Jurnal yang telah berstatus `is_paid = true` terkunci dari segala operasi modifikasi (`update`, `destroy`, penambahan/pengubahan/penghapusan billing dan payment).
   - Untuk mengedit atau menghapus, jurnal harus di-unpost terlebih dahulu (`updatePaidStatus` dengan `is_paid: false`).
4. **Laporan Jurnal Umum**:
   - Hanya jurnal yang telah diposting (`is_paid = true` dan `is_valid = true`) yang akan diakui dan muncul di Laporan Jurnal Umum (`/wapi/general-journal-report`).
5. **Multi-Tenancy & Headers**:
   - Header autentikasi: `Authorization: Bearer <TOKEN>`
   - Header context tenant perusahaan: `company-id: <COMPANY_ID>` atau `X-Company-ID: <COMPANY_ID>`
   - `Content-Type: application/json` & `Accept: application/json`

---

## 3. Struktur Entitas & Model

### 3.1 GeneralJournal (`general_journals`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `uuid` | string (UUID) | Identifier unik publik |
| `company_id` | integer | Relasi ke `companies.id` |
| `code` | string | Kode otomatis jurnal: `JRN{YYYYMMDD}#####` |
| `date` | date (YYYY-MM-DD) | Tanggal transaksi jurnal |
| `note` | string (nullable) | Keterangan transaksi jurnal |
| `payment_proof` | string (nullable) | Nama file bukti dokumen (RFS storage) |
| `amount` | decimal | Total nilai nominal kas jurnal |
| `amount_original` | decimal | Nilai nominal asli jurnal |
| `is_usd_transaction`| boolean | Flag transaksi mata uang USD (otomatis bernilai `true` jika terdapat kas dengan `currency_type = 'usd'`, default: `false`) |
| `is_paid` | boolean | Status posting (`true` = sudah diposting) |
| `is_valid` | boolean | Status validitas keseimbangan debet & kredit |
| **Appends** | | |
| `total_amount` | float | Total debet kas dari seluruh billing |
| `total_paid` | float | Total kredit pembayaran dari seluruh billing |
| `remaining_amount` | float | Sisa alokasi pembayaran (`total_amount - total_paid`) |
| `is_balanced` | boolean | `true` jika debet kas == kredit pembayaran dan > 0 |
| `total_debit` | float | Alias dari `total_amount` |
| `total_credit` | float | Alias dari `total_paid` |

### 3.2 GeneralJournalBilling (`general_journal_billings`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `uuid` | string (UUID) | Identifier unik |
| `general_journal_id` | integer | Relasi ke `general_journals.id` |
| `date` | date (nullable) | Tanggal billing (default mengikuti tanggal jurnal) |
| `note` | string (nullable) | Keterangan per baris billing |
| `is_paid` | boolean | Status lunas billing |
| `is_valid` | boolean | Status validitas billing |
| **Appends** | | |
| `total_amount` | float | Total kas (`cashes.sum('amount')`) |
| `total_paid` | float | Total pembayaran (`payments.sum('amount')`) |
| `remaining_amount` | float | Sisa kas yang belum dialokasikan pembayaran |

### 3.3 GeneralJournalBillingCash (`general_journal_billing_cashes`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `general_journal_billing_id` | integer | Relasi ke `general_journal_billings.id` |
| `cash_id` | integer | Relasi ke master `cashes.id` (Kas/Bank) |
| `amount` | decimal | Nominal alokasi kas |
| `type` | enum (`debit`, `credit`) | Tipe alokasi kas (`debit` atau `credit`, default: `debit`, mendukung alias input `debet`) |

### 3.4 GeneralJournalBillingPayment (`general_journal_billing_payments`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `general_journal_billing_id` | integer | Relasi ke `general_journal_billings.id` |
| `account_id` | integer | Relasi ke master `accounts.id` (COA Kredit) |
| `amount` | decimal | Nominal alokasi beban/akun (Kredit) |
| `amount_original` | decimal | Nominal asli alokasi |
| `note` | string (nullable) | Catatan rincian akun pembayaran |
| `transaction_proof`| string (nullable) | Bukti lampiran file per pembayaran |

---

## 4. Standar Response JSON Envelope

Setiap response API menggunakan format standar JSON:
```json
{
  "status": true,
  "message": "General Journal created successfully",
  "errors": null,
  "data": { ... }
}
```

Jika terjadi kesalahan validasi (HTTP 422):
```json
{
  "status": false,
  "message": "Validation failed",
  "errors": {
    "company_id": ["The company id field is required."],
    "date": ["The date field is required."]
  },
  "data": null
}
```

---

## 5. Daftar Endpoint API

### 5.1 Manajemen Jurnal Umum (`GeneralJournalController`)

#### A. Daftar Jurnal Umum (`GET /wapi/general-journal`)
- **Method**: `GET`
- **Permissions**: `general-journal:list` atau `finance:list`
- **Query Parameters**:
  - `page` (integer, default: 1)
  - `per_page` (integer, default: 10)
  - `search` (string, mencari pada `code` dan `note`)
  - `company_id` (integer)
  - `is_paid` (`true` | `false`)
  - `is_valid` (`true` | `false`)
  - `date` (`YYYY-MM-DD`)
  - `start_date` & `end_date` (`YYYY-MM-DD`)
  - `sort_by` (`id`, `date`, `code`, `amount`, `created_at`, default: `id`)
  - `sort_order` (`asc` | `desc`, default: `desc`)

#### B. Detail Jurnal Umum (`GET /wapi/general-journal/{id}`)
- **Method**: `GET`
- **Parameter**: `id` (integer ID atau UUID string)
- **Permissions**: `general-journal:list` atau `finance:list`
- **Response**: Mengembalikan header jurnal lengkap beserta relasi `company`, `billings.cashes.cash`, dan `billings.payments.account`.

#### C. Tambah Jurnal Umum (`POST /wapi/general-journal`)
- **Method**: `POST`
- **Permissions**: `general-journal:create` atau `finance:create`
- **Content-Type**: `application/json` atau `multipart/form-data` (jika melampirkan file `payment_proof`)

**Format 1: Lengkap (Nested Billings & Cashes):**
```json
{
  "company_id": 1,
  "date": "2026-10-30",
  "note": "Pengeluaran operasional cabang",
  "billings": [
    {
      "date": "2026-10-30",
      "note": "Operasional logistik minggu ke-4",
      "cashes": [
        {
          "cash_id": 1,
          "amount": 1500000.00,
          "type": "debit"
        },
        {
          "cash_id": 2,
          "amount": 1000000.00,
          "type": "debit"
        }
      ]
    }
  ]
}
```

**Format 2: Flat Billing (Satu Kas per Baris):**
```json
{
  "company_id": 1,
  "date": "2026-10-30",
  "note": "Beban operasional logistik",
  "billings": [
    {
      "date": "2026-10-30",
      "note": "Bahan bakar armada",
      "cash_id": 1,
      "amount": 750000.00,
      "type": "debit"
    }
  ]
}
```

**Format 3: Simple Root Level (Otomatis Membuat 1 Billing Item):**
```json
{
  "company_id": 1,
  "date": "2026-10-30",
  "note": "Biaya operasional kantor",
  "cash_id": 1,
  "amount": 500000.00,
  "type": "debit"
}
```

#### D. Perbarui Jurnal Umum (`PUT /wapi/general-journal/{id}`)
- **Method**: `PUT`
- **Permissions**: `general-journal:edit` atau `finance:edit`
- **Catatan**: Hanya dapat diupdate jika `is_paid: false`. Sertakan `id` pada item billing dan kas yang ingin dipertahankan/diperbarui.

```json
{
  "company_id": 1,
  "date": "2026-10-31",
  "note": "Pengeluaran operasional cabang - revisi",
  "billings": [
    {
      "id": 10,
      "date": "2026-10-31",
      "note": "Operasional logistik minggu ke-4 (revisi)",
      "cashes": [
        {
          "id": 5,
          "cash_id": 1,
          "amount": 2000000.00,
          "type": "debit"
        },
        {
          "cash_id": 2,
          "amount": 500000.00,
          "type": "debit"
        }
      ]
    }
  ]
}
```

#### E. Posting / Unposting Jurnal (`PUT /wapi/general-journal/{id}/paid-status`)
- **Method**: `PUT`
- **Permissions**: `general-journal:edit` atau `finance:edit`

```json
{
  "is_paid": true
}
```
*(Kirim `"is_paid": false` untuk membatalkan posting/unposting)*

#### F. Hapus Jurnal Umum (`DELETE /wapi/general-journal/{id}`)
- **Method**: `DELETE`
- **Permissions**: `general-journal:delete` atau `finance:delete`
- **Catatan**: Hanya jurnal berstatus draft (`is_paid: false`) yang dapat dihapus.

---

### 5.2 Manajemen Item Billing Parsial

#### A. Tambah Billing Item (`POST /wapi/general-journal/{journal_id}/billing`)
```json
{
  "date": "2026-10-30",
  "note": "Tagihan utilitas kantor",
  "cashes": [
    {
      "cash_id": 2,
      "amount": 1250000.00,
      "type": "debit"
    }
  ]
}
```

#### B. Perbarui Billing Item (`PUT /wapi/general-journal/billing/{billing_id}`)
```json
{
  "date": "2026-10-30",
  "note": "Tagihan utilitas kantor revisi",
  "cashes": [
    {
      "id": 15,
      "cash_id": 2,
      "amount": 1350000.00,
      "type": "debit"
    }
  ]
}
```

#### C. Hapus Billing Item (`DELETE /wapi/general-journal/billing/{billing_id}`)
- **Method**: `DELETE`
- **Permissions**: `general-journal:delete` atau `finance:delete`

---

### 5.3 Manajemen Alokasi Akun Lawan (`GeneralJournalBillingPaymentController`)

Digunakan untuk mencatat akun lawan COA (sisi kredit) pada masing-masing billing item.

#### A. Daftar Alokasi Pembayaran (`GET /wapi/general-journal-billing-payment`)
- **Method**: `GET`
- **Query Parameters**:
  - `general_journal_billing_id` (integer)
  - `general_journal_id` (integer)
  - `account_id` (integer)
  - `search` (string)
  - `per_page` (integer)

#### B. Tambah Alokasi Akun Lawan (`POST /wapi/general-journal-billing-payment`)
- **Method**: `POST`
- **Permissions**: `general-journal:create` atau `finance:create`

```json
{
  "general_journal_billing_id": 10,
  "account_id": 25,
  "amount": 1500000.00,
  "amount_original": 1500000.00,
  "note": "Alokasi beban perlengkapan kantor"
}
```

#### C. Perbarui Alokasi Akun Lawan (`PUT /wapi/general-journal-billing-payment/{id}`)
- **Method**: `PUT`
- **Permissions**: `general-journal:edit` atau `finance:edit`

```json
{
  "account_id": 25,
  "amount": 1600000.00,
  "amount_original": 1600000.00,
  "note": "Alokasi beban perlengkapan kantor revisi"
}
```

#### D. Hapus Alokasi Akun Lawan (`DELETE /wapi/general-journal-billing-payment/{id}`)
- **Method**: `DELETE`
- **Permissions**: `general-journal:delete` atau `finance:delete`

---

### 5.4 Laporan Jurnal Umum (`GeneralJournalReportController`)

Endpoint ini menyajikan seluruh rincian transaksi memorial dari jurnal yang telah berstatus **diposting (`is_paid = true` & `is_valid = true`)**.

#### A. Ambil Data Laporan (`GET /wapi/general-journal-report`)
- **Method**: `GET`
- **Permissions**: `report:list`
- **Query Parameters**:
  - `page` (integer, default: 1)
  - `per_page` (integer, default: 10)
  - `date` (`YYYY-MM-DD`)
  - `start_date` / `date_from` (`YYYY-MM-DD`)
  - `end_date` / `date_to` (`YYYY-MM-DD`)
  - `company_id` (integer)
  - `cash_id` (integer)
  - `account_id` (integer)
  - `cash_name` / `cash_code` (string)
  - `search` (string)
  - `sort_by` (`id`, `date`, `created_at`, default: `id`)
  - `sort_order` (`asc` | `desc`, default: `desc`)

**Struktur Objek per Baris:**
- `debit`: Nominal total kas debit (`total_amount`).
- `credit`: Nominal total pembayaran kredit (`total_paid`).
- `cashes`: Array kas terkait beserta detail master cash (`id, uuid, name, code, type`).
- `payments`: Array akun COA terkait beserta detail master account (`id, uuid, name, code`).
- `general_journal`: Objek header jurnal `{ id, company_id, code, note, date, is_paid, is_valid }`.

#### B. Export Excel Laporan (`GET /wapi/general-journal-report/export`)
- **Method**: `GET`
- **Permissions**: `report:list`
- **Query Parameters**: Sama dengan filter data laporan di atas.
- **Response**: File spreadsheet Excel binary (`general_journal_report.xlsx`).

---

## 6. Panduan Integrasi Frontend (Next.js / TypeScript)

### 6.1 TypeScript Interface Model

```typescript
export interface MasterCash {
  id: number;
  uuid: string;
  cash_name?: string;
  name?: string;
  code: string;
  type: string;
  currency_type: 'idr' | 'usd';
}

export interface MasterAccount {
  id: number;
  uuid: string;
  name: string;
  code: string;
}

export interface GeneralJournalBillingCash {
  id?: number;
  general_journal_billing_id?: number;
  cash_id: number;
  amount: number;
  type?: 'debit' | 'credit';
  cash?: MasterCash;
}

export interface GeneralJournalBillingPayment {
  id?: number;
  general_journal_billing_id: number;
  account_id: number;
  amount: number;
  amount_original?: number;
  note?: string | null;
  transaction_proof?: string | null;
  account?: MasterAccount;
}

export interface GeneralJournalBilling {
  id?: number;
  uuid?: string;
  general_journal_id?: number;
  date?: string | null;
  note?: string | null;
  is_paid: boolean;
  is_valid: boolean;
  total_amount: number;
  total_paid: number;
  remaining_amount: number;
  cashes: GeneralJournalBillingCash[];
  payments: GeneralJournalBillingPayment[];
}

export interface GeneralJournal {
  id: number;
  uuid: string;
  company_id: number;
  code: string;
  date: string;
  note: string | null;
  payment_proof: string | null;
  amount: number;
  amount_original: number;
  is_usd_transaction: boolean;
  is_paid: boolean;
  is_valid: boolean;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  company?: {
    id: number;
    uuid: string;
    slug: string;
  };
  billings: GeneralJournalBilling[];
  created_at: string;
}
```

### 6.2 Alur UX yang Direkomendasikan
1. **Langkah 1 (Input Header & Kas / Debet)**:
   - User memasukkan informasi tanggal, perusahaan, catatan, dan menentukan kas/bank sumber pengeluaran (`cash_id` & `amount`).
   - Panggil `POST /wapi/general-journal` untuk menyimpan entri awal.
2. **Langkah 2 (Input Akun Lawan / Kredit)**:
   - Pada halaman detail atau drawer rincian billing, user menambahkan baris alokasi beban akun COA.
   - Panggil `POST /wapi/general-journal-billing-payment` dengan `general_journal_billing_id` yang terbentuk pada Langkah 1.
3. **Langkah 3 (Indikator Keseimbangan & Posting)**:
   - Tampilkan indikator status di UI:
     - `Total Debet (Kas)` vs `Total Kredit (Pembayaran)`.
     - Selisih (*Remaining Amount*).
     - Badge Keseimbangan: `Balanced` (hijau) atau `Unbalanced` (merah).
   - Tombol **Posting Jurnal** hanya diaktifkan jika `is_balanced: true`.
   - Setelah user mengklik Posting (`PUT /wapi/general-journal/{id}/paid-status` dengan `is_paid: true`), form otomatis beralih ke mode **Read-Only** dengan badge `POSTED`.
