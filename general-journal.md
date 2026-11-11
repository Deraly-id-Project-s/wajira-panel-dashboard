# Dokumentasi API Jurnal Umum (General Journal)

Dokumen ini merupakan panduan integrasi komprehensif untuk Frontend Developer / AI Frontend (Next.js) dan QA dalam mengimplementasikan modul **Jurnal Umum (General Journal)**, **Alokasi Pembayaran Dual (Billing Payments: Debit & Kredit)**, dan **Laporan Jurnal Umum (General Journal Report)**.

---

## 1. Arsitektur & Hirarki Skema

Struktur relasi data Jurnal Umum distandarisasi ke dalam 4 tingkatan hirarki:
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
   - Mengelola **Alokasi Pembayaran Akun Lawan / Dual Payment** (`GeneralJournalBillingPayment`) per billing item dengan klasifikasi `type`: `debit` atau `credit`.
3. **`GeneralJournalReportController`**:
   - Menampilkan laporan rincian memorial untuk jurnal yang telah diposting dan seimbang (`is_paid = true` & `is_valid = true`).

---

## 2. Ikhtisar Alur Dual Payment & Lifecycle

Alur pembayaran General Journal disamakan dengan sistem **Dual Cash Flow** (pembayaran 2 kali berlawanan arah):

### 2.1 Alur 3 Langkah Dual Payment (Contoh Kasus 100.000)
1. **Langkah 1 (Pembuatan Data Billing)**:
   - Terbuat General Journal Billing dengan kas debit sebesar **Rp 100.000**.
   - Pada saat ini:
     - `expected_debit`: 100.000
     - `expected_credit`: 100.000
     - `remaining_payment` (sisa debit): 100.000
     - `dual_remaining_payment` (sisa kredit): 100.000
     - `is_paid`: `false`
     - `is_balanced`: `false`
     - `is_valid`: `false`
2. **Langkah 2 (Wajib Bayar Debit Rp 100.000 untuk Lunas)**:
   - User melakukan pembayaran debit sebesar **Rp 100.000** (`type: "debit"` pada `general_journal_billing_payments`).
   - Setelah pembayaran debit tersimpan:
     - `paid_debit`: 100.000, `remaining_payment`: 0 (`is_original_settled: true`).
     - `paid_credit`: 0, `dual_remaining_payment`: 100.000.
     - Status pembayaran debit telah lunas, sehingga billing **bisa ditandai Lunas (`is_paid = true`)** melalui endpoint `PUT /wapi/general-journal/{id}/paid-status`.
     - Namun pada tahap ini, jurnal **belum seimbang** (`is_balanced: false` dan `is_valid: false`) karena sisi kredit belum terbayar.
3. **Langkah 3 (Opsional Bayar Kredit Rp 100.000 untuk Seimbang)**:
   - User kemudian dapat (opsional) membayarkan sisi kredit sebesar **Rp 100.000** (`type: "credit"` pada `general_journal_billing_payments`).
   - Setelah sisi kredit terbayar:
     - `paid_credit`: 100.000, `dual_remaining_payment`: 0.
     - Karena kedua sisi (debit dan kredit) sudah lunas terbayar, sistem secara otomatis menandai billing dan jurnal sebagai **Seimbang (`is_balanced: true`)** dan **Valid (`is_valid: true`)**.

### 2.2 Aturan Posting & Kunci Mutasi (Immutability)
1. **Syarat Tandai Lunas (`is_paid: true`)**:
   - Hanya mensyaratkan pembayaran arah utama (misal debit) lunas (`remaining_payment <= 0`).
   - Sisi lawan (kredit) tidak memblokir posting status lunas.
2. **Kapan Jurnal Terkunci Penuh?**:
   - Jika jurnal sudah lunas (`is_paid = true`) DAN sudah seimbang (`is_valid = true`), maka seluruh modifikasi (tambah/edit/hapus payment, billing, cash) terkunci penuh.
   - Jika jurnal baru berstatus lunas (`is_paid = true`) tetapi belum seimbang (`is_valid = false`), user masih diizinkan menambahkan atau mengedit pembayaran sisi dual (kredit) sampai seimbang. Pembayaran arah asli (debit) tetap terkunci kecuali di-unpost terlebih dahulu.
3. **Laporan Jurnal Umum**:
   - Hanya jurnal yang telah berstatus lunas DAN seimbang (`is_paid = true` & `is_valid = true`) yang diakui dan muncul di Laporan Jurnal Umum (`/wapi/general-journal-report`).

---

## 3. Struktur Entitas & Field Model

### 3.1 GeneralJournal (`general_journals`)
| Kolom / Attribute | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `uuid` | string (UUID) | Identifier unik publik |
| `company_id` | integer | Relasi ke `companies.id` |
| `code` | string | Kode otomatis jurnal: `JRN{YYYYMMDD}#####` |
| `date` | date (YYYY-MM-DD) | Tanggal transaksi jurnal |
| `note` | string (nullable) | Keterangan transaksi jurnal |
| `payment_proof` | string (nullable) | File bukti dokumen (RFS storage) |
| `amount` | decimal | Total nilai nominal kas jurnal |
| `amount_original` | decimal | Nilai nominal asli jurnal |
| `is_usd_transaction`| boolean | Flag transaksi mata uang USD (default: `false`) |
| `is_paid` | boolean | Status posting lunas (`true` jika seluruh billing telah `is_paid`) |
| `is_valid` | boolean | Status valid / seimbang (`true` jika seluruh billing telah seimbang) |
| **Appends** | | |
| `total_amount` | float | Total nominal kas dari seluruh billing |
| `total_debit` | float | Nominal nominal debit transaksi |
| `total_credit` | float | Nominal nominal kredit transaksi |
| `paid_debit` | float | Total pembayaran sisi debit yang telah dibayar |
| `paid_credit` | float | Total pembayaran sisi kredit yang telah dibayar |
| `total_paid` | float | Total akumulasi seluruh pembayaran (`paid_debit + paid_credit`) |
| `remaining_payment`| float | Sisa pembayaran sisi debit / utama |
| `dual_remaining_payment`| float | Sisa pembayaran sisi kredit / dual |
| `remaining_amount` | float | Alias dari `remaining_payment` |
| `is_balanced` | boolean | `true` jika kedua sisi (debit & kredit) telah lunas pada seluruh billing |

### 3.2 GeneralJournalBilling (`general_journal_billings`)
| Kolom / Attribute | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `uuid` | string (UUID) | Identifier unik |
| `general_journal_id` | integer | Relasi ke `general_journals.id` |
| `date` | date (nullable) | Tanggal billing |
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
| `cash_id` | integer | Relasi ke master `cashes.id` (Kas/Bank) |
| `amount` | decimal | Nominal alokasi kas |
| `type` | enum (`debit`, `credit`) | Posisi alokasi kas (default: `debit`, mendukung input `debet`) |

### 3.4 GeneralJournalBillingPayment (`general_journal_billing_payments`)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | integer | Primary Key |
| `general_journal_billing_id` | integer | Relasi ke `general_journal_billings.id` |
| `account_id` | integer | Relasi ke master `accounts.id` (Akun COA) |
| `type` | enum (`debit`, `credit`) | **Penanda pembayaran debit atau kredit** (wajib valid, otomatis terisi dari akun jika tidak dikirim) |
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
  "message": "General Journal billing payment created successfully",
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
    "amount": ["Payment amount (150000) exceeds the remaining debit balance (100000)."]
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
  - `page`, `per_page`, `search`, `company_id`, `is_paid`, `is_valid`, `date`, `start_date`, `end_date`, `sort_by`, `sort_order`

#### B. Detail Jurnal Umum (`GET /wapi/general-journal/{id}`)
- **Method**: `GET`
- **Parameter**: `id` (integer ID atau UUID string)
- **Response**: Mengembalikan header jurnal lengkap beserta relasi `company`, `billings.cashes.cash`, dan `billings.payments.account`, lengkap dengan kalkulasi dual payment (`paid_debit`, `paid_credit`, `remaining_payment`, `dual_remaining_payment`, `is_balanced`, `is_paid`, `is_valid`).

#### C. Tambah Jurnal Umum (`POST /wapi/general-journal`)
- **Method**: `POST`
- **Permissions**: `general-journal:create` atau `finance:create`
- **Request Body (Format Lengkap):**
```json
{
  "company_id": 1,
  "date": "2026-11-11",
  "note": "Pengeluaran operasional cabang",
  "billings": [
    {
      "date": "2026-11-11",
      "note": "Operasional logistik minggu ke-2",
      "cashes": [
        {
          "cash_id": 1,
          "amount": 100000.00,
          "type": "debit"
        }
      ]
    }
  ]
}
```

#### D. Posting / Tandai Lunas Jurnal (`PUT /wapi/general-journal/{id}/paid-status`)
- **Method**: `PUT`
- **Permissions**: `general-journal:edit` atau `finance:edit`
- **Aturan**:
  - Mensyaratkan pembayaran debit/arah utama lunas (`is_original_settled: true`).
  - Tidak memblokir jika sisi kredit belum dibayar.
  - Jika sisi kredit juga sudah terbayar, jurnal otomatis berstatus seimbang (`is_balanced: true`) dan valid (`is_valid: true`).

```json
{
  "is_paid": true
}
```
*(Kirim `"is_paid": false` untuk unpost / membatalkan status lunas)*

---

### 5.2 Manajemen Pembayaran Dual (`GeneralJournalBillingPaymentController`)

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
  "note": "Pembayaran debit beban operasional"
}
```

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
*(Setelah pembayaran ini, billing siap ditandai lunas melalui `updatePaidStatus`).*

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
*(Setelah kredit terbayar, `is_balanced` otomatis bernilai `true` dan `is_valid` bernilai `true`).*

#### C. Perbarui Pembayaran (`PUT /wapi/general-journal-billing-payment/{id}`)
- **Method**: `PUT`
- **Catatan**: Pembayaran arah utama hanya dapat diupdate jika status `is_paid` belum true (atau sudah di-unpost).

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

---

### 5.3 Laporan Jurnal Umum (`GeneralJournalReportController`)

Menampilkan data transaksi memorial jurnal yang telah **Lunas dan Seimbang (`is_paid = true` & `is_valid = true`)**.

- **Endpoint**: `GET /wapi/general-journal-report`
- **Export Excel**: `GET /wapi/general-journal-report/export`

---

## 6. Panduan Integrasi Frontend (Next.js / TypeScript)

### 6.1 TypeScript Interface

```typescript
export interface MasterAccount {
  id: number;
  uuid: string;
  code: string;
  name: string;
  type?: 'debit' | 'credit' | string;
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
  cashes: any[];
  payments: GeneralJournalBillingPayment[];
}

export interface GeneralJournal {
  id: number;
  uuid: string;
  company_id: number;
  code: string;
  date: string;
  note: string | null;
  amount: number;
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
  billings: GeneralJournalBilling[];
}
```

### 6.2 Alur UX yang Direkomendasikan
1. **Header & Kas**: Buat transaksi jurnal umum baru (`POST /wapi/general-journal`).
2. **Tahap 1 Pembayaran (Wajib Debit)**:
   - Form pembayaran membuka pilihan tipe `type: "debit"`.
   - Tampilkan indikator `Sisa Pembayaran Debit: remaining_payment`.
   - Setelah sisa debit = 0, aktifkan tombol **"Tandai Lunas"** (`is_paid: true`).
3. **Tahap 2 Pembayaran (Opsional Kredit)**:
   - Form pembayaran membuka pilihan tipe `type: "credit"`.
   - Tampilkan indikator `Sisa Pembayaran Kredit: dual_remaining_payment`.
   - Badge Status:
     - Jika `is_paid && !is_balanced`: Badge Kuning **"Lunas (Belum Seimbang)"**.
     - Jika `is_paid && is_balanced`: Badge Hijau **"Lunas & Seimbang"**.
