# Dokumentasi API Jurnal Umum (General Journal)

Dokumen ini merupakan panduan integrasi komprehensif untuk Frontend Developer / AI Frontend (Next.js) dan QA dalam mengimplementasikan modul **Jurnal Umum (General Journal)**, **Alokasi Pembayaran (Billing Payments)**, dan **Laporan Jurnal Umum (General Journal Report)**.

---

## 1. Arsitektur & Hirarki Skema

Struktur relasi data Jurnal Umum telah distandarisasi ke dalam 4 tingkatan hirarki:
```
GeneralJournal (Header)
  └── GeneralJournalBilling (Billing Item / Baris Transaksi)
        ├── GeneralJournalBillingCash (Sumber Kas & Posisi Arah Kas)
        └── GeneralJournalBillingPayment (Alokasi Dual Pembayaran: Debet & Kredit)
```

### Pemisahan Tanggung Jawab Controller:
1. **`GeneralJournalController`**:
   - Mengelola **Header Jurnal** (`GeneralJournal`).
   - Mengelola **Item Baris Billing** (`GeneralJournalBilling`).
   - Mengelola **Alokasi Kas** (`GeneralJournalBillingCash`).
   - Mengelola status lunas / posting (`updateIsPaidStatus` / `updatePaidStatus`).
2. **`GeneralJournalBillingPaymentController`**:
   - Mengelola **Alokasi Pembayaran Akun Lawan / Dual Payment** (`GeneralJournalBillingPayment`) per billing item dengan kolom `type`: `'debit'` atau `'credit'`.
3. **`GeneralJournalReportController`**:
   - Menampilkan laporan rincian memorial untuk jurnal yang telah diposting dan seimbang (`is_paid = true` & `is_valid = true`).

---

## 2. Ikhtisar Aturan Bisnis & Lifecycle (Dual Payment & Validasi Kas)

### 2.1 Alur 3 Langkah Dual Payment (Contoh Kasus 100.000)
1. **Langkah 1 (Pembuatan Data Billing)**:
   - Terbuat General Journal Billing dengan kas debit sebesar **Rp 100.000**.
   - Pada saat ini:
     - `expected_debit`: 100.000, `expected_credit`: 100.000
     - `remaining_payment` (sisa debit): 100.000, `dual_remaining_payment` (sisa kredit): 100.000
     - `is_paid`: `false`, `is_balanced`: `false`, `is_valid`: `false`
2. **Langkah 2 (Wajib Bayar Debit Rp 100.000 untuk Lunas)**:
   - User wajib melakukan pembayaran debit sebesar **Rp 100.000** (`type: "debit"` pada `general_journal_billing_payments`).
   - Setelah pembayaran debit tersimpan:
     - `paid_debit`: 100.000, `remaining_payment`: 0 (`is_original_settled: true`).
     - `paid_credit`: 0, `dual_remaining_payment`: 100.000.
     - Status pembayaran debit telah lunas, sehingga billing **bisa ditandai Lunas (`is_paid = true`)** melalui endpoint `PUT /wapi/general-journal/{id}/paid-status`.
     - Namun pada tahap ini, jurnal **belum seimbang** (`is_balanced: false` dan `is_valid: false`) karena sisi kredit belum terbayar.
3. **Langkah 3 (Opsional Bayar Kredit Rp 100.000 untuk Seimbang)**:
   - User kemudian dapat (opsional) membayarkan sisi kredit sebesar **Rp 100.000** (`type: "credit"` pada `general_journal_billing_payments`).
   - Setelah sisi kredit terbayar:
     - `paid_credit`: 100.000, `dual_remaining_payment`: 0 (`is_dual_settled: true`).
     - Karena kedua sisi (debit dan kredit) sudah lunas terbayar, sistem secara otomatis menandai billing dan jurnal sebagai **Seimbang (`is_balanced: true`)** dan **Valid (`is_valid: true`)**.

### 2.2 Aturan Mata Uang Kas Tunggal & Auto-Select Kas IDR
- **Otomatis Pemilihan Kas IDR Pertama (Auto-Select First IDR Cash)**:
  - Frontend **tidak diwajibkan memilih data kas (`cash_id`)**. Jika `cash_id` atau `cashes` tidak disertakan dalam request, backend secara otomatis memilih master data kas pertama milik perusahaan dengan mata uang IDR (`company_id` sama dan `currency_type == 'idr'`).
  - Hal ini menyederhanakan form transaksi di frontend sehingga user tidak perlu memilih akun kas secara manual.
- **Transaksi Eksklusif Mata Uang IDR (IDR Only)**:
  - Modul Jurnal Umum dikhususkan untuk pencatatan transaksi dalam mata uang Rupiah (IDR).
  - Transaksi USD (`is_usd_transaction: true`) atau akun kas dengan mata uang non-IDR tidak diizinkan dan akan ditolak dengan error validasi HTTP 422.

### 2.3 Aturan Posting & Kunci Mutasi (Immutability)
1. **Syarat Tandai Lunas (`is_paid: true`)**:
   - Hanya mensyaratkan pembayaran arah utama (misal debit) telah lunas (`remaining_payment <= 0`). Sisi lawan (kredit) tidak memblokir penandaan status lunas.
2. **Kapan Transaksi Terkunci Penuh?**:
   - Jika jurnal sudah lunas (`is_paid = true`) DAN sudah seimbang (`is_valid = true`), maka seluruh mutasi (tambah/edit/hapus payment, billing, cash) terkunci penuh.
   - Jika jurnal baru berstatus lunas (`is_paid = true`) tetapi belum seimbang (`is_valid = false`), user masih diizinkan menambahkan pembayaran sisi dual (kredit) sampai seimbang. Pembayaran arah utama (debit) tetap terkunci kecuali di-unpost terlebih dahulu.
3. **Laporan Jurnal Umum**:
   - Hanya jurnal yang telah berstatus lunas DAN seimbang (`is_paid = true` & `is_valid = true`) yang diakui dan muncul di Laporan Jurnal Umum (`/wapi/general-journal-report`).
4. **Keunikan Kas per Jurnal Umum (Unique Cash per Journal)**:
   - Setiap data Kas/Bank (`cash_id`) hanya boleh dipilih satu kali dalam satu jurnal umum (bersifat unik di seluruh billing item). Duplikasi `cash_id` akan ditolak (HTTP 422).

### 2.4 Single-Form Store: Input Jurnal, Pembayaran Sekaligus & Tandai Lunas
Selain alur bertahap melalui controller terpisah (`GeneralJournalBillingPaymentController`), kini sistem mendukung alur **Single Form** langsung pada `POST /wapi/general-journal`:
- User dapat menginput header jurnal, nominal, akun lawan pembayaran (`account_id`), bukti transaksi (`transaction_proof`), dan sekaligus menandai status sebagai lunas (`is_paid: true`) dalam 1 kali pengiriman form.
- Kas IDR akan otomatis dipilihkan oleh backend jika `cash_id` tidak dikirim.
- Pembayaran otomatis dibuatkan dan billing langsung ditandai sebagai lunas (`is_paid = true`) jika kewajiban utama telah terpenuhi (`is_original_settled = true`).

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
| `is_paid` | boolean | Status posting lunas (`true` jika seluruh billing telah `is_paid`) |
| `is_valid` | boolean | Status valid / seimbang (`true` jika seluruh billing telah seimbang) |
| **Appends** | | |
| `total_amount` | float | Total nominal kas dari seluruh billing |
| `total_debit` | float | Nominal debit transaksi |
| `total_credit` | float | Nominal kredit transaksi |
| `paid_debit` | float | Total pembayaran sisi debit yang telah dibayar |
| `paid_credit` | float | Total pembayaran sisi kredit yang telah dibayar |
| `total_paid` | float | Total akumulasi seluruh pembayaran (`paid_debit + paid_credit`) |
| `remaining_payment`| float | Sisa pembayaran sisi debit / utama |
| `dual_remaining_payment`| float | Sisa pembayaran sisi kredit / dual |
| `remaining_amount` | float | Alias dari `remaining_payment` |
| `is_balanced` | boolean | `true` jika kedua sisi (debit & kredit) telah lunas pada seluruh billing |

### 3.2 GeneralJournalBilling (`general_journal_billings`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `uuid` | string (UUID) | Identifier unik |
| `general_journal_id` | integer | Relasi ke `general_journals.id` |
| `date` | date (nullable) | Tanggal billing (default mengikuti tanggal jurnal) |
| `note` | string (nullable) | Keterangan per baris billing |
| `is_paid` | boolean | Status lunas billing |
| `is_valid` | boolean | Status validitas billing (`true` jika `is_balanced` terpenuhi) |
| **Appends** | | |
| `original_direction`| string | Arah transaksi utama: `'debit'` atau `'credit'` |
| `dual_direction` | string | Arah transaksi lawan: `'credit'` atau `'debit'` |
| `total_amount` | float | Total nominal kas billing |
| `paid_debit` | float | Akumulasi pembayaran debit (`payments.where(type, 'debit')`) |
| `paid_credit` | float | Akumulasi pembayaran kredit (`payments.where(type, 'credit')`) |
| `total_paid` | float | Total akumulasi pembayaran (`paid_debit + paid_credit`) |
| `remaining_debit` | float | Sisa kewajiban pembayaran sisi debit |
| `remaining_credit` | float | Sisa kewajiban pembayaran sisi kredit |
| `remaining_payment`| float | Sisa kewajiban pembayaran arah utama (`remaining_debit`) |
| `dual_remaining_payment`| float | Sisa kewajiban pembayaran arah lawan (`remaining_credit`) |
| `remaining_amount` | float | Alias dari `remaining_payment` |
| `is_original_settled`| boolean | `true` jika `remaining_payment <= 0` |
| `is_dual_settled` | boolean | `true` jika `dual_remaining_payment <= 0` |
| `is_balanced` | boolean | `true` jika debit dan kredit keduanya lunas terbayar |

### 3.3 GeneralJournalBillingCash (`general_journal_billing_cashes`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `general_journal_billing_id` | integer | Relasi ke `general_journal_billings.id` |
| `cash_id` | integer | Relasi ke master `cashes.id` (Kas/Bank, currency_type wajib seragam per jurnal) |
| `amount` | decimal | Nominal alokasi kas |
| `type` | enum (`debit`, `credit`) | Tipe alokasi kas (`debit` atau `credit`, default: `debit`, mendukung alias input `debet`) |

### 3.4 GeneralJournalBillingPayment (`general_journal_billing_payments`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `general_journal_billing_id` | integer | Relasi ke `general_journal_billings.id` |
| `account_id` | integer | Relasi ke master `accounts.id` (Akun COA) |
| `type` | enum (`debit`, `credit`) | **Penanda pembayaran debit atau kredit** (wajib valid, otomatis terisi dari tipe akun jika tidak dikirim) |
| `amount` | decimal | Nominal pembayaran yang dialokasikan |
| `amount_original` | decimal | Nominal asli pembayaran |
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

**Format 4: Single Form - Auto IDR Cash + Input Pembayaran Sekaligus + Tandai Lunas (Rekomendasi Frontend):**
> *Frontend tidak perlu mengirim `cash_id` (backend otomatis memilih akun kas IDR pertama dari `company_id`). Form 1 langkah langsung membuat jurnal, membuat item pembayaran akun lawan, dan menandai lunas (`is_paid: true`).*
```json
{
  "company_id": 1,
  "date": "2026-11-23",
  "note": "Biaya listrik dan utilitas kantor",
  "amount": 500000.00,
  "account_id": 15,
  "payment_note": "Pembayaran rekening PLN bulan berjalan",
  "is_paid": true
}
```

**Format 5: Single Form dengan Multiple / Split Payments:**
```json
{
  "company_id": 1,
  "date": "2026-11-23",
  "note": "Operasional armada kantor",
  "amount": 1000000.00,
  "payments": [
    {
      "account_id": 15,
      "amount": 600000.00,
      "note": "Bahan bakar solar"
    },
    {
      "account_id": 16,
      "amount": 400000.00,
      "note": "Biaya tol & parkir"
    }
  ],
  "is_paid": true
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

### 5.3 Manajemen Pembayaran Dual (`GeneralJournalBillingPaymentController`)

Digunakan untuk mencatat pembayaran sisi **Debit** (Langkah 2) dan sisi **Kredit** (Langkah 3).

#### A. Tambah Pembayaran Debit (Wajib untuk Lunas)
- **Endpoint**: `POST /wapi/general-journal-billing-payment`
- **Method**: `POST`
- **Permissions**: `general-journal:create` atau `finance:create`

**Request Body (Bayar Debit 100.000):**
```json
{
  "general_journal_billing_id": 10,
  "account_id": 15,
  "type": "debit",
  "amount": 100000.00,
  "amount_original": 100000.00,
  "note": "Pembayaran debit beban operasional",
  "is_paid": true
}
```
*(Catatan: Field `is_paid: true` bersifat opsional. Jika disertakan dan pembayaran arah utama lunas, billing akan langsung ditandai sebagai lunas).*

**Response Sukses (HTTP 201):**
```json
{
  "status": true,
  "message": "General Journal billing payment created successfully",
  "errors": null,
  "data": {
    "id": 1,
    "general_journal_billing_id": 10,
    "account_id": 15,
    "type": "debit",
    "amount": "100000.00",
    "amount_original": "100000.00",
    "note": "Pembayaran debit beban operasional",
    "transaction_proof": null,
    "paid_debit": 100000,
    "paid_credit": 0,
    "remaining_payment": 0,
    "dual_remaining_payment": 100000,
    "is_balanced": false,
    "is_paid": false,
    "is_valid": false,
    "account": {
      "id": 15,
      "uuid": "...",
      "code": "5101",
      "name": "Beban Operasional"
    }
  }
}
```
*(Setelah pembayaran debit ini lunas, billing dapat ditandai lunas melalui `updatePaidStatus`, namun status `is_balanced` masih false).*

#### B. Tambah Pembayaran Kredit (Opsional untuk Seimbang)
- **Endpoint**: `POST /wapi/general-journal-billing-payment`
- **Method**: `POST`

**Request Body (Bayar Kredit 100.000):**
```json
{
  "general_journal_billing_id": 10,
  "account_id": 20,
  "type": "credit",
  "amount": 100000.00,
  "amount_original": 100000.00,
  "note": "Pembayaran kredit akun lawan kas"
}
```

**Response Sukses (HTTP 201):**
```json
{
  "status": true,
  "message": "General Journal billing payment created successfully",
  "errors": null,
  "data": {
    "id": 2,
    "general_journal_billing_id": 10,
    "account_id": 20,
    "type": "credit",
    "amount": "100000.00",
    "amount_original": "100000.00",
    "note": "Pembayaran kredit akun lawan kas",
    "transaction_proof": null,
    "paid_debit": 100000,
    "paid_credit": 100000,
    "remaining_payment": 0,
    "dual_remaining_payment": 0,
    "is_balanced": true,
    "is_paid": true,
    "is_valid": true,
    "account": {
      "id": 20,
      "uuid": "...",
      "code": "1101",
      "name": "Kas Utama"
    }
  }
}
```
*(Setelah sisi kredit terbayar, `is_balanced` otomatis bernilai `true` dan `is_valid` otomatis bernilai `true`).*

#### C. Perbarui Pembayaran (`PUT /wapi/general-journal-billing-payment/{id}`)
- **Method**: `PUT`
- **Permissions**: `general-journal:edit` atau `finance:edit`

```json
{
  "account_id": 15,
  "type": "debit",
  "amount": 100000.00,
  "note": "Revisi catatan pembayaran"
}
```

#### D. Hapus Pembayaran (`DELETE /wapi/general-journal-billing-payment/{id}`)
- **Method**: `DELETE`
- **Permissions**: `general-journal:delete` atau `finance:delete`

---

### 5.4 Laporan Jurnal Umum (`GeneralJournalReportController`)

Menampilkan data transaksi memorial jurnal yang telah **Lunas dan Seimbang (`is_paid = true` & `is_valid = true`)**.

- **Endpoint**: `GET /wapi/general-journal-report`
- **Export Excel**: `GET /wapi/general-journal-report/export`

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
  type?: 'debit' | 'credit' | string;
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
  type: 'debit' | 'credit';
  amount: number;
  amount_original?: number;
  note?: string | null;
  transaction_proof?: string | null;
  paid_debit?: number;
  paid_credit?: number;
  remaining_payment?: number;
  dual_remaining_payment?: number;
  is_balanced?: boolean;
  is_paid?: boolean;
  is_valid?: boolean;
  account?: MasterAccount;
}

export interface GeneralJournalBilling {
  id: number;
  uuid: string;
  general_journal_id: number;
  date: string | null;
  note: string | null;
  is_paid: boolean;
  is_valid: boolean;
  original_direction: 'debit' | 'credit';
  dual_direction: 'credit' | 'debit';
  total_amount: number;
  paid_debit: number;
  paid_credit: number;
  total_paid: number;
  remaining_debit: number;
  remaining_credit: number;
  remaining_payment: number;
  dual_remaining_payment: number;
  remaining_amount: number;
  is_original_settled: boolean;
  is_dual_settled: boolean;
  is_balanced: boolean;
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
  total_amount: number;
  total_debit: number;
  total_credit: number;
  paid_debit: number;
  paid_credit: number;
  total_paid: number;
  remaining_payment: number;
  dual_remaining_payment: number;
  remaining_amount: number;
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
   - User memasukkan informasi tanggal, perusahaan, catatan, dan memilih akun kas (`cash_id` & `amount`).
   - **Validasi Currency**: Pastikan jika akun kas pertama berjenis IDR, opsi pemilihan kas berikutnya hanya menampilkan kas IDR (backend akan me-reject jika berbeda jenis currency).
   - Simpan entri awal via `POST /wapi/general-journal`.
2. **Langkah 2 (Input Pembayaran Debit - Wajib)**:
   - Form pembayaran memilih `type: "debit"`.
   - Tampilkan informasi sisa kewajiban: `Sisa Pembayaran Debit: remaining_payment`.
   - Setelah sisa pembayaran debit = 0, aktifkan tombol **"Tandai Lunas"** (`PUT /wapi/general-journal/{id}/paid-status` dengan `is_paid: true`).
   - Tampilkan badge kuning: **"Lunas (Belum Seimbang)"**.
3. **Langkah 3 (Input Pembayaran Kredit - Opsional)**:
   - Form pembayaran memilih `type: "credit"`.
   - Tampilkan informasi sisa kewajiban: `Sisa Pembayaran Kredit: dual_remaining_payment`.
   - Begitu pembayaran kredit selesai diisi lunas, status otomatis beralih menjadi **"Lunas & Seimbang"** (Badge Hijau, `is_balanced: true` dan `is_valid: true`).
