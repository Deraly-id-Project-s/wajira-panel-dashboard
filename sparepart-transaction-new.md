# Sparepart Transaction & Billing Refactor Documentation

Dokumentasi ini menjelaskan refaktorisasi pada modul **Sparepart Transaction**, **Sparepart Transaction Billing**, dan **Sparepart Transaction Billing History**, mengikuti pola arsitektur yang sejalan dengan **Unit Transaction**.

---

## 1. Ringkasan Perubahan

| Komponen | Sebelum Refactor | Setelah Refactor |
|---|---|---|
| **Diskon Sparepart Transaction** | Format string / persentase (`10%`, `5`), dihitung secara persentase | Format **nominal angka** (`numeric|min:0`), langsung mengurangi bruto (`grand_total = (qty * price) - discount`) |
| **Tabel `sparepart_transaction_billing_histories`** | Kolom: `sparepart_transaction_id`, `grand_total`, `last_payment_at`, `is_paid`, `note` | Kolom baru: `sparepart_transaction_id`, `payment_proof`, `payment_at`, `note`. (Kolom `grand_total`, `last_payment_at`, `is_paid` dihapus) |
| **Pivot Pembayaran Kas/Bank** | `cash_sparepart_transaction_billing_histories` hanya kolom `amount` | Menggunakan model pivot `CashSparepartTransactionBillingHistory` dengan kolom `amount`, `original_amount`, `exchange_amount` |
| **Perhitungan Saldo Pembayaran** | Membaca `grand_total` dari history | Dihitung dinamis melalui relasi kas (`getTotalCashPayment()`, `getTotalBcaCashPayment()`, `getTotalBcaUsdPayment()`, `getTotalPaid()`, `getRemainingPayment()`) |
| **File Upload Bukti Bayar** | Belum ada penanganan file upload terstandar | Menggunakan `RFSTrait` (`storeFile`, `updateFile`, `destroyFile`) ke disk object storage `rfs` |
| **Status `is_paid`** | - | **Aturan Ketat:** Status `is_paid` **TIDAK PERNAH** diubah secara otomatis saat pelunasan ataupun saat history dibuat/dihapus; hanya diubah jika dikirim eksplisit oleh pengguna |

---

## 2. Detail Perubahan Teknis

### 2.1 Task 1: Diskon Nominal pada Sparepart Transaction

#### Model `App\Models\SparepartTransaction`:
- Mengubah tipe `$casts` kolom `price` dan `discount` menjadi `decimal:2`.
- Menambahkan helper method:
  - `getBrutoAmount(): float`: `(float) $this->qty * (float) $this->price`
  - `getTotalDiscount(): float`: `(float) ($this->discount ?? 0)`
  - `getNettoTotal(): float`: `max(0, $this->getBrutoAmount() - $this->getTotalDiscount())`

#### Controller `App\Http\Controllers\Transaction\SparepartTransactionController`:
- **`store()`**:
  - Validasi diskon: `'discount' => 'nullable|numeric|min:0'`.
  - Perhitungan:
    ```php
    $qty = (int) $validated['qty'];
    $price = (float) $validated['price'];
    $nominalDiscount = isset($validated['discount']) ? (float) $validated['discount'] : 0.0;
    $grandTotal = max(0, ($qty * $price) - $nominalDiscount);
    $validated['discount'] = $nominalDiscount;
    ```
- **`update()`**:
  - Validasi diskon: `'discount' => 'nullable|numeric|min:0'`.
  - Mengambil nominal diskon langsung tanpa konversi persentase:
    ```php
    if (array_key_exists('discount', $validated)) {
        $nominalDiscount = $validated['discount'] !== null ? (float) $validated['discount'] : 0.0;
        $validated['discount'] = $nominalDiscount;
    } else {
        $nominalDiscount = (float) ($transaction->discount ?? 0);
    }
    $grandTotal = max(0, ($qty * $price) - $nominalDiscount);
    ```
- **`index()` & `show()`**:
  - Perhitungan bruto & netto:
    ```php
    $item->transaction_bruto_total = (float) $item->qty * (float) $item->price;
    $item->transaction_netto_total = max(0, $item->transaction_bruto_total - (float) $item->discount);
    ```
  - `billing_summary` mengambil total pembayaran langsung dari billing helper:
    ```php
    $totalPaid = $billing->getTotalPaid();
    $remaining = $billing->getRemainingPayment();
    ```

---

### 2.2 Task 2: Skema Migration & Relasi Pivot Model

#### Migration `database/migrations/2026_11_19_084912_modify_table_sparepart_transaction_billings_add_is_usd_transaction_column.php`:
- Memodifikasi tabel `sparepart_transaction_billings`:
  - Menambahkan kolom `last_payment_at` (date, nullable)
  - Menambahkan kolom `is_usd_transaction` (boolean, default false)
- Memodifikasi tabel `sparepart_transaction_billing_histories`:
  - Menghapus kolom lama: `grand_total`, `last_payment_at`, `is_paid`
  - Menambahkan kolom baru: `payment_proof` (string, nullable), `payment_at` (date, nullable)
- Memodifikasi tabel `cash_sparepart_transaction_billing_histories`:
  - Menambahkan kolom `original_amount` (bigInteger, default 0)
  - Menambahkan kolom `exchange_amount` (bigInteger, default 0)

#### Model `App\Models\CashSparepartTransactionBillingHistory`:
- Mewarisi `Illuminate\Database\Eloquent\Relations\Pivot`.
- Menambahkan `$fillable` dan `$casts` untuk `amount`, `original_amount`, dan `exchange_amount`.

#### Model `App\Models\SparepartTransactionBillingHistory`:
- Mengatur `$fillable` menjadi `['uuid', 'sparepart_transaction_id', 'payment_proof', 'payment_at', 'note']`.
- Mengatur `$casts` untuk `payment_at => 'date'`.
- Menghubungkan relasi kas `cashes()` menggunakan pivot model:
  ```php
  public function cashes()
  {
      return $this->belongsToMany(Cash::class, 'cash_sparepart_transaction_billing_histories', 'sparepart_transaction_billing_history_id', 'cash_id')
          ->using(CashSparepartTransactionBillingHistory::class)
          ->withPivot(['amount', 'original_amount', 'exchange_amount'])
          ->withTimestamps();
  }
  ```

#### Model `App\Models\Cash`:
- Mengupdate relasi `sparepartTransactionBillingHistories()` menggunakan `CashSparepartTransactionBillingHistory::class` dan pivot `['amount', 'original_amount', 'exchange_amount']`.

#### Model `App\Models\SparepartTransactionBilling`:
- Menambahkan helper calculation methods:
  - `isUsdTransaction(): bool`
  - `getIsUsdTransactionAttribute(): bool`
  - `getNoteAttribute(): ?string`
  - `getTotalCashPayment(): int` (akumulasi kas `cash_idr`)
  - `getTotalBcaCashPayment(): int` (akumulasi bank `bca_idr`)
  - `getTotalBcaUsdPayment(): float` (akumulasi pembayaran `bca_usd`)
  - `getTotalBcaUsdPaymentInIdr(): int`
  - `getTotalPaid(): float|int`
  - `getEffectiveGrandTotal(): float`
  - `getRemainingPayment(): float|int`

---

### 2.3 Task 3: Refaktor Controller Billing & History

#### Controller `App\Http\Controllers\Transaction\SparepartTransactionBillingController`:
- Menggunakan `RFSTrait`, `ChangeLog`, `ResponseTrait`, `GlobalCodeNumberTrait`.
- Menambahkan filter dan kolom `is_usd_transaction`.
- Pada method `index()` dan `show()` menampilkan breakdown:
  - `total_cash_payment`
  - `total_bca_cash_payment` / `total_bca_payment`
  - `total_usd_payment`
  - `total_paid`
  - `remaining_payment`
  - `is_usd_transaction`
- Pada method `update()`:
  - Validasi manual `is_paid = true` hanya dapat dilakukan jika `$billing->getTotalPaid() >= $billing->grand_total`.

#### Controller `App\Http\Controllers\Transaction\SparepartTransactionBillingHistoryController`:
- **File Upload (`RFSTrait`)**:
  - Upload file `payment_proof` otomatis diproses dengan `storeFile()` ke folder `'payment_proof'` pada penyimpanan disk `rfs`.
  - Saat update history, bukti lama diganti via `updateFile()`.
  - Saat history dihapus (`destroy()`), file bukti pembayaran dihapus via `destroyFile()`.
- **Multi-Payment & Currency Validation**:
  - Mendukung input `cash_payment_amount`, `bca_payment_amount`, dan `bca_payment_usd_amount`.
  - Jika transaksi berjenis USD, mencegah input IDR. Jika transaksi IDR, mencegah input USD.
  - Memvalidasi agar total pembayaran yang diinput tidak melebihi `grand_total` billing.
- **Penyimpanan History & Attachment Kas**:
  - Menyimpan data riwayat pembayaran ke `SparepartTransactionBillingHistory` (`sparepart_transaction_id`, `payment_at`, `payment_proof`, `note`).
  - Mengaitkan nominal pembayaran ke tabel pivot `cash_sparepart_transaction_billing_histories`.
  - Mengupdate `last_payment_at` pada billing.
  - **Status `is_paid` TIDAK diubah secara otomatis.**

---

## 3. API Reference

### 3.1 Sparepart Transaction
- `POST /wapi/sparepart-transaction/sparepart-transaction`
  - **Body**:
    ```json
    {
      "company_id": 1,
      "person_id": 2,
      "sparepart_id": 5,
      "type": "purchase",
      "billing_type": "cash",
      "qty": 10,
      "price": 150000,
      "discount": 50000,
      "transaction_date": "2026-11-19",
      "nota_number": "NOTA-001",
      "note": "Pembelian sparepart"
    }
    ```
  - **Perhitungan Grand Total**: `(10 * 150.000) - 50.000 = 1.450.000`

### 3.2 Sparepart Transaction Billing History
- `POST /wapi/sparepart-transaction/sparepart-transaction-billing-history`
  - **Content-Type**: `multipart/form-data`
  - **Body / Form-Data**:
    - `sparepart_transaction_billing_id`: `1` (atau `sparepart_transaction_id`)
    - `bca_payment_amount`: `500000`
    - `cash_payment_amount`: `200000`
    - `bca_payment_usd_amount`: `0`
    - `payment_at`: `2026-11-19`
    - `payment_proof`: file image/pdf (opsional)
    - `note`: `"Pembayaran termin 1"`
  - **Response (201 Created)**:
    ```json
    {
      "status": true,
      "message": "Payment history created successfully",
      "errors": null,
      "data": {
        "id": 1,
        "uuid": "...",
        "sparepart_transaction_id": 1,
        "grand_total": 1450000,
        "total_paid": 700000,
        "remaining_payment": 750000,
        "last_payment_at": "2026-11-19",
        "is_paid": false,
        "is_usd_transaction": false,
        "usd_payment_set": false
      }
    }
    ```

- `PUT /wapi/sparepart-transaction/sparepart-transaction-billing-history/{id}`
  - **Body**: update pembayaran, tanggal, nota, bukti bayar.

- `DELETE /wapi/sparepart-transaction/sparepart-transaction-billing-history/{id}`
  - Menghapus history, melepaskan relasi kas, menghapus file bukti bayar dari storage, dan mengupdate `last_payment_at` billing ke tanggal pembayaran terbaru yang tersisa.
