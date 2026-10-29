# Dokumentasi Pembaruan Unit Transaction Billing & Transaction Flow (1:1)

Dokumen ini menjelaskan perubahan arsitektur dan penyesuaian logika yang diimplementasikan pada backend sistem Wajira Enterprise terkait:
1. **Task 1**: Pembentukan data `TransactionFlow` secara independen untuk setiap penambahan data `UnitTransactionBillingHistory` (1 `UnitTransactionBillingHistory` == 1 `TransactionFlow`, tanpa penggabungan/merge nominal atau pembaruan record lama).
2. **Task 2**: Dukungan kolom `is_usd_transaction` pada model `UnitTransactionBilling` serta integrasi penentuan transaksi USD pada seluruh method `UnitTransactionBillingController`.

---

## 1. Ringkasan Arsitektur & Relasi Data

Sebelum pembaruan ini, seluruh riwayat pembayaran (`UnitTransactionBillingHistory`) diakumulasikan ke dalam satu record `TransactionFlow` yang terikat pada `unit_transaction_id`. Hal ini mengakibatkan nominal seluruh riwayat pembayaran digabungkan (merge) ke satu baris data arus transaksi.

Dengan pembaruan ini:
- Setiap 1 `UnitTransactionBillingHistory` secara eksklusif memiliki 1 `TransactionFlow`.
- Foreign key `unit_transaction_billing_history_id` pada tabel `transaction_flows` menjadi kunci unik hubungan 1:1 antara riwayat pembayaran dan arus kas.
- Kode transaksi pada `TransactionFlow` digenerate secara otomatis dan unik oleh sistem menggunakan format `TRX{Ymd}#####`.

```mermaid
flowchart TD
    UT[UnitTransaction] -->|hasOne| UTB[UnitTransactionBilling]
    UTB -->|hasMany| UTBH1["UnitTransactionBillingHistory #1"]
    UTB -->|hasMany| UTBH2["UnitTransactionBillingHistory #2"]
    UTBH1 -->|hasOne (1:1)| TF1["TransactionFlow #1 (Nominal History 1)"]
    UTBH2 -->|hasOne (1:1)| TF2["TransactionFlow #2 (Nominal History 2)"]
```

---

## 2. Detail Implementasi Task 1: 1 History == 1 Transaction Flow

### 2.1 Service Arus Transaksi (`App\Services\TransactionFlowService`)

Metode `syncFromUnitTransactionBillingHistory` diperbarui agar tidak lagi mendelegasikan ke method `syncFromUnitTransactionBilling` (yang menggabungkan total tagihan).

**Perilaku Baru:**
- **Pencarian / Pembuatan Berdasarkan History ID**:
  Menggunakan `updateOrCreateTransactionFlow` dengan atribut kunci `['unit_transaction_billing_history_id' => $history->id]`.
- **Perhitungan Nominal Terisolasi**:
  Nominal debit dan kredit diambil secara eksklusif dari pivot kas riwayat pembayaran tersebut (`$history->cashes`):
  - BCA IDR: `$history->cashes->where('code', 'bca_idr')->sum('pivot.amount')`
  - Cash IDR: `$history->cashes->where('code', 'cash_idr')->sum('pivot.amount')`
  - BCA USD: `$history->cashes->where('code', 'bca_usd')->sum('pivot.amount')`
  - BCA USD (konversi IDR): `$history->cashes->where('code', 'bca_usd')->sum('pivot.original_amount')`
- **Mapping Posisi Kas (Sales vs Purchase)**:
  - Transaksi Penjualan (`sales`): dialokasikan ke sisi **Debit** (`bank_usd_debit`, `bank_idr_debit`, `cash_idr_debit`).
  - Transaksi Pembelian (`purchase`): dialokasikan ke sisi **Kredit** (`bank_usd_credit`, `bank_idr_credit`, `cash_idr_credit`).
- **Metadata Transaksi**:
  - `transaction_proof`: Diambil dari bukti bayar riwayat (`$history->payment_proof`).
  - `transaction_date`: Diambil dari tanggal bayar (`$history->payment_at ?? now()`).
  - `is_lock`: Mengunci transaksi jika parameter bernilai true.

### 2.2 Controller Riwayat Billing (`UnitTransactionBillingHistoryController`)

1. **`store(Request $request)`**:
   - Di dalam loop iterasi pembayaran (`foreach ($payments as $slug => $amount)`), setiap instance `UnitTransactionBillingHistory` yang dibuat langsung memicu sinkronisasi arus transaksi individu:
     ```php
     $this->transactionFlowService->syncFromUnitTransactionBillingHistory(
         $history,
         true,
         $validated['note'] ?? null
     );
     ```
   - Pemanggilan `syncFromUnitTransactionBilling` di luar perulangan telah dihilangkan sehingga tidak ada lagi penggabungan nominal antar-pembayaran.
2. **`update(Request $request, string $id)`**:
   - Ketika catatan atau detail riwayat pembayaran diubah, pembaruan dialirkan ke `syncFromUnitTransactionBillingHistory` untuk history yang bersangkutan.
3. **`destroy(string $id)`**:
   - Sebelum riwayat dihapus, record `TransactionFlow` yang memiliki relasi `unit_transaction_billing_history_id` ke history tersebut dihapus menggunakan `$this->transactionFlowService->deleteTransactionFlow($existingFlow)`.

---

## 3. Detail Implementasi Task 2: Kolom `is_usd_transaction`

Penambahan kolom boolean `is_usd_transaction` pada tabel `unit_transaction_billings` diintegrasikan secara menyeluruh ke dalam model dan controller.

### 3.1 Model `App\Models\UnitTransactionBilling`

1. **Mass Assignment & Type Casting**:
   - Menambahkan `'is_usd_transaction'` ke properti `$fillable`.
   - Menambahkan `'is_usd_transaction' => 'boolean'` ke properti `$casts`.
2. **Method Reusable `isUsdTransaction(): bool`**:
   Logika penentuan transaksi USD dipusatkan pada satu helper method:
   ```php
   public function isUsdTransaction(): bool
   {
       // 1. Cek kolom fisik pada tabel billing
       if (!empty($this->attributes['is_usd_transaction'])) {
           return true;
       }

       // 2. Cek relasi ke unitTransaction jika sudah di-load
       if ($this->relationLoaded('unitTransaction') && $this->unitTransaction && array_key_exists('is_usd_transaction', $this->unitTransaction->getAttributes())) {
           return (bool) $this->unitTransaction->is_usd_transaction;
       }

       // 3. Fallback query ke relasi unitTransaction
       return (bool) $this->unitTransaction()->value('is_usd_transaction');
   }
   ```
3. **Model Booting Hook**:
   Pada event `creating`, nilai `is_usd_transaction` otomatis disinkronkan dari relasi `unitTransaction` apabila belum ditentukan secara eksplisit:
   ```php
   static::creating(function ($model) {
       $model->uuid = (string) Str::uuid();

       if (!isset($model->attributes['is_usd_transaction']) || $model->is_usd_transaction === null) {
           $model->is_usd_transaction = $model->isUsdTransaction();
       }
   });
   ```

### 3.2 Penyesuaian Method pada `UnitTransactionBillingController`

| Method | Penyesuaian yang Dilakukan |
|---|---|
| `__construct` | Menambahkan `'is_usd_transaction'` ke daftar kolom whitelist `$this->unitTransactionBillingTable`. |
| `index` | - Eager load `unitTransaction:id,code,is_usd_transaction`.<br>- Menambahkan filter opsional `$request->is_usd_transaction` (mencakup pengecekan pada tabel billing maupun relasi unit transaction).<br>- Menetapkan nilai boolean `$item->is_usd_transaction` serta menghitung `remaining_payment` secara tepat. |
| `show` | - Eager loading optimal `unitTransactionBillingHistories.cashes`.<br>- Menghilangkan boilerplate code manual kalkulasi IDR/USD dan menggantinya dengan helper model reusable: `$data->getTotalPaid()` dan `$data->getRemainingPayment()`.<br>- Menambahkan field `$data->is_usd_transaction` dan `$data->usd_payment_set`. |
| `store` | - Validasi field opsional `'is_usd_transaction' => 'nullable\|boolean'`.<br>- Menentukan status USD dengan prioritas input request atau nilai dari `(bool) $unitTransaction->is_usd_transaction`.<br>- Menyimpan kolom `is_usd_transaction` saat record dibuat. |
| `update` | - Validasi field `'is_usd_transaction' => 'sometimes\|boolean'`.<br>- Pengecekan pelunasan tagihan (`isPaidTrue`) secara dinamis mengecek apakah transaksi merupakan USD melalui `$billing->isUsdTransaction()`. |
| `checkRightAmount` | Mengembalikan properti status `'is_usd_transaction' => (bool) $unitTransaction->is_usd_transaction` baik pada kondisi valid maupun mismatch. |

---

## 4. Contoh Penggunaan API

### 4.1 Membuat Tagihan Unit Transaction (`POST /wapi/transaction/unit-transaction-billing`)

**Request Payload:**
```json
{
  "unit_transaction_id": 105
}
```
*Catatan: Sistem secara otomatis mendeteksi apakah `unit_transaction_id: 105` merupakan transaksi USD dari kolom `is_usd_transaction` di unit transaction.*

**Response (201 Created):**
```json
{
  "status": true,
  "message": "Billing created successfully",
  "errors": null,
  "data": {
    "id": 12,
    "uuid": "43e2b34a-8d19-4841-a1e1-c85292de9cf4",
    "unit_transaction_id": 105,
    "grand_total": 45000,
    "is_paid": false,
    "is_usd_transaction": true,
    "created_at": "2026-10-29T21:05:00.000000Z",
    "updated_at": "2026-10-29T21:05:00.000000Z"
  }
}
```

---

### 4.2 Menambah Riwayat Pembayaran (`POST /wapi/transaction/unit-transaction-billing-history`)

**Request Payload:**
```json
{
  "unit_transaction_billing_id": 12,
  "bca_payment_usd_amount": 15000,
  "payment_at": "2026-10-29",
  "note": "Pembayaran termin 1 USD"
}
```

**Dampak pada Sistem:**
1. Satu record baru dibuat pada tabel `unit_transaction_billing_histories`.
2. Satu record baru dibuat pada tabel `transaction_flows` dengan:
   - `unit_transaction_billing_history_id`: ID history yang baru dibuat.
   - `code`: `TRX2026102900001` (kode unik sequence harian).
   - `bank_usd_debit_original`: `15000`.
   - `is_lock`: `true`.
3. Jika pembayaran kedua ditambahkan (misal sebesar $10,000), sistem akan membuat `TransactionFlow` kedua yang terpisah dengan nominal $10,000 tanpa menggabungkannya menjadi $25,000.

---

### 4.3 Detail Tagihan (`GET /wapi/transaction/unit-transaction-billing/{id}`)

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Billing retrieved successfully",
  "errors": null,
  "data": {
    "id": 12,
    "uuid": "43e2b34a-8d19-4841-a1e1-c85292de9cf4",
    "unit_transaction_id": 105,
    "grand_total": 45000,
    "last_payment_at": "2026-10-29",
    "is_paid": false,
    "is_usd_transaction": true,
    "total_cash_payment": 0,
    "total_bca_payment": 0,
    "total_bca_cash_payment": 0,
    "total_usd_payment": 15000,
    "total_paid": 15000,
    "remaining_payment": 30000,
    "usd_payment_set": true,
    "total_payment_count": 1,
    "unit_transaction": {
      "id": 105,
      "code": "PBL-WJM/20261029-0001",
      "is_usd_transaction": true
    }
  }
}
```

---

## 5. File yang Dimodifikasi

1. [`app/Services/TransactionFlowService.php`](file:///home/popo/Documents/project/project-wajira/finance-be/app/Services/TransactionFlowService.php)
   - Implementasi logika independen 1:1 `syncFromUnitTransactionBillingHistory`.
2. [`app/Http/Controllers/Transaction/UnitTransactionBillingHistoryController.php`](file:///home/popo/Documents/project/project-wajira/finance-be/app/Http/Controllers/Transaction/UnitTransactionBillingHistoryController.php)
   - Sinkronisasi `TransactionFlow` per history pada method `store`, `update`, dan `destroy`.
3. [`app/Models/UnitTransactionBilling.php`](file:///home/popo/Documents/project/project-wajira/finance-be/app/Models/UnitTransactionBilling.php)
   - Penambahan kolom `is_usd_transaction`, helper `isUsdTransaction()`, dan hook auto-fill `booted()`.
4. [`app/Http/Controllers/Transaction/UnitTransactionBillingController.php`](file:///home/popo/Documents/project/project-wajira/finance-be/app/Http/Controllers/Transaction/UnitTransactionBillingController.php)
   - Penyesuaian method `index`, `show`, `store`, `update`, dan `checkRightAmount` terhadap field dan status transaksi USD.
