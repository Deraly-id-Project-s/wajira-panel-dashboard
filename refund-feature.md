# Dokumentasi Integrasi Fitur Refund Transaksi Unit & Finance Refund (Frontend Next.js)

Dokumentasi ini dibuat sebagai panduan komprehensif bagi developer frontend Next.js dalam mengimplementasikan alur Refund Unit Transaksi pada sisi **Administrasi Transaksi** dan sisi **Finance Refund**.

---

## 1. Ikhtisar Alur Bisnis (Workflow Overview)

```mermaid
flowchart TD
    A["Tabel / Detail Unit Transaksi"] -->|Cek is_paid Transaksi| B{"Billing Lunas? (is_paid == true)"}
    B -->|Tidak| C["Tombol Refund DISABLED + Tooltip Transaksi ini belum lunas"]
    B -->|Ya| D["Tombol Refund ENABLED"]
    
    D -->|1. Submit Form Refund| E["POST /api/v1/unit-transaction-refund"]
    E --> F["Refund Record Terbuat (is_paid: false)"]
    
    F -->|2. Bayar Refund (Admin)| G["POST /api/v1/unit-transaction-refund-payment"]
    G --> H{"Sisa Refund (remaining_payment) == 0?"}
    H -->|Belum Lunas| G
    H -->|Sudah Lunas| I["3. Tandai Lunas Refund"]
    
    I -->|PUT .../paid-status| J["PUT /api/v1/unit-transaction-refund/{id}/paid-status"]
    J -->|Otomatis Sinkron Backend| K["FinanceRefund & FinanceRefundCash Terbuat"]
    
    K -->|4. Modul Finance| L["GET /api/v1/finance-refund/{id}"]
    L --> M["Tampilkan Detail Tagihan & Tabel Finance Billing"]
    M -->|5. Bayar Tagihan Finance| N["POST /api/v1/finance-billing"]
    N --> O{"Finance remaining_payment == 0?"}
    O -->|Belum Lunas| N
    O -->|Sudah Lunas| P["Tagihan Finance Refund Selesai"]
```

---

## 2. Aturan & Validasi Frontend (Frontend Rules)

### 2.1 Pengecekan Status Lunas pada Tabel & Detail Unit Transaksi
* **Syarat Refund**: Tombol aksi Refund **hanya boleh aktif** jika transaksi induk telah lunas:
  ```typescript
  const isPaid = Boolean(unitTransaction?.unitTransactionBilling?.is_paid);
  ```
* **Kondisi `is_paid === false`**:
  - Tombol Refund dibuat **Disabled** (`disabled={!isPaid}`).
  - Ketika kursor di-hover pada tombol, tampilkan tooltip/popover informasi:
    > *"Transaksi ini belum lunas"*
* **Kondisi `is_paid === true`**:
  - Tombol Refund **Enabled** dan ketika diklik akan membuka modal/halaman pengajuan refund.

### 2.2 Penempatan Tombol Refund
* **Tabel List Transaksi (`Unit Transaction Table`)**: Pada kolom *Action / Aksi*, sediakan tombol Refund dengan logika disable + hover tooltip di atas.
* **Halaman Detail Transaksi (`Unit Transaction Detail Page`)**: Pada bagian header aksi / card ringkasan, sediakan tombol Refund dengan ketentuan yang sama.

### 2.3 Fleksibilitas Item Details (Stok Fisik)
* Array `unit_transaction_item_detail_ids` bersifat **opsional (`nullable`)**.
* Pengguna diperbolehkan mengosongkan pilihan unit jika refund hanya berupa penyesuaian nominal (tanpa pengembalian fisik barang/stok gudang).

---

## 3. Langkah-Langkah Integrasi API

### TAHAP 1: Administrasi Transaksi Unit

#### 1. Membuat Pengajuan Refund Unit
* **Endpoint**: `POST /api/v1/unit-transaction-refund`
* **Permission**: `permission:transaction:create`
* **Request Payload**:
```json
{
  "unit_transaction_id": 10,
  "refund_date": "2026-11-05",
  "refund_amount": 5000000,
  "note": "Refund pengembalian unit cacat",
  "unit_transaction_item_detail_ids": [101, 102] 
}
```
> [!NOTE]
> Jika refund tidak melibatkan pengembalian fisik barang, kirim `unit_transaction_item_detail_ids: []` atau tidak menyertakan atribut tersebut.

* **Response Success (201 Created)**:
```json
{
  "status": true,
  "message": "Unit transaction refund created successfully",
  "data": {
    "id": 1,
    "uuid": "4bc47385-...",
    "code": "RBN-WJM/202611-0001",
    "unit_transaction_id": 10,
    "refund_date": "2026-11-05T00:00:00.000000Z",
    "refund_amount": 5000000,
    "is_paid": false,
    "is_with_stock": true,
    "remaining_payment": 5000000,
    "note": "Refund pengembalian unit cacat"
  }
}
```

---

#### 2. Mencatat Pembayaran Refund (Admin Payment)
Admin mencatat pembayaran refund secara bertahap atau langsung lunas.
* **Endpoint**: `POST /api/v1/unit-transaction-refund-payment`
* **Permission**: `permission:transaction:create`
* **Request Payload (Multi-Kas / Rekening)**:
```json
{
  "unit_transaction_refund_id": 1,
  "amount": 5000000,
  "payment_date": "2026-11-05",
  "note": "Transfer refund via BCA",
  "cashes": [
    {
      "cash_id": 2,
      "amount": 5000000,
      "original_amount": 5000000
    }
  ]
}
```

* **Validasi Frontend**:
  - `amount` tidak boleh melebihi sisa tagihan refund (`remaining_payment`).

---

#### 3. Menandai Status Lunas Pengajuan Refund
Setelah seluruh nominal refund terbayarkan (`remaining_payment === 0`), admin menekan tombol **Tandai Lunas / Selesai**.
* **Endpoint**: `PUT /api/v1/unit-transaction-refund/{id}/paid-status`
* **Permission**: `permission:transaction:edit`
* **Request Payload**:
```json
{
  "is_paid": true,
  "note": "Pelunasan penuh refund unit"
}
```
* **Efek Otomatis di Backend**:
  1. `UnitTransactionRefund.is_paid` berubah menjadi `true`.
  2. `UnitTransaction.is_refunded` otomatis menjadi `true`.
  3. Backend otomatis mengeksekusi `FinanceRefundService::syncFromUnitTransactionRefund` untuk membuat record **`FinanceRefund`** dan **`FinanceRefundCash`**.
  4. *(Bila `is_paid` diubah menjadi `false`, backend otomatis menghapus record `FinanceRefund` terkait).*

---

### TAHAP 2: Modul Finance (Finance Refund & Finance Billing)

#### 4. Melihat Detail Tagihan Finance Refund
User Finance membuka menu Finance Refund untuk memantau kewajiban pembayaran refund.
* **Endpoint**: `GET /api/v1/finance-refund/{id}`
* **Permission**: `permission:finance:list`
* **Response Payload**:
```json
{
  "status": true,
  "message": "Finance Refund retrieved successfully",
  "data": {
    "id": 5,
    "uuid": "81fcae12-...",
    "code": "REF2026110500001",
    "transaction_of": "unit_type",
    "date": "2026-11-05",
    "note": "Pelunasan Refund RBN-WJM/202611-0001",
    "is_paid": false,
    "is_valid": true,
    "remaining_payment": 5000000,
    "cash_position": {
      "debet_idr_total": 0,
      "credit_idr_total": 5000000,
      "debet_usd_total": 0,
      "credit_usd_total": 0
    },
    "financeRefundCashes": [
      {
        "id": 12,
        "cash_id": 2,
        "amount": 5000000,
        "amount_original": 5000000,
        "type": "credit",
        "cash": {
          "id": 2,
          "cash_name": "Bank BCA",
          "currency_type": "idr"
        }
      }
    ],
    "financeBillings": []
  }
}
```

* **Komponen Tampilan di Halaman Detail**:
  1. **Header / Kartu Informasi Tagihan**:
     - Kode Refund (`code`), Tanggal (`date`), Tipe Transaksi (`transaction_of`), Catatan (`note`).
     - Posisi Kas Asal (`financeRefundCashes`) yang mencantumkan nama kas, jenis arah (`type`), dan nominal.
     - **Sisa Pembayaran (`remaining_payment`)**.
  2. **Tabel Pembayaran (`Finance Billing Table`)**:
     - Menampilkan daftar riwayat pembayaran pada `financeBillings` (tanggal bayar, kas keluar/masuk, nominal, bukti bayar).
  3. **Tombol "Tambah Pembayaran" (`Add Finance Billing`)**:
     - Ditampilkan jika `remaining_payment > 0`.

---

#### 5. Melakukan Pembayaran Finance Billing
Ketika finance melakukan pengeluaran kas / pencatatan realisasi dana refund:
* **Endpoint**: `POST /api/v1/finance-billing`
* **Permission**: `permission:finance:create`
* **Request Payload**:
```json
{
  "finance_refund_id": 5,
  "cash_id": 2,
  "account_id": 14,
  "amount": 3000000,
  "payment_at": "2026-11-05",
  "note": "Pembayaran tahap 1 refund unit"
}
```
*(Opsional: sertakan file bukti pembayaran via multipart/form-data pada key `payment_proof`).*

* **Guard & Validasi Overpayment (Sinkron dengan `remaining_payment`)**:
  - Jika sisa tagihan `remaining_payment = 3.000.000` dan pengguna menginput `5.000.000`, API secara otomatis menolak dengan error HTTP `422`:
    ```json
    {
      "status": false,
      "message": "Validation failed",
      "errors": "Payment amount exceeds remaining billing balance (3,000,000)."
    }
    ```
  - Pembayaran dilakukan hingga nilai `remaining_payment` mencapai `0`.

---

#### 6. (Opsional) Mengubah Status Pelunasan Finance Refund
Finance juga dapat mengunci status pelunasan refund melalui:
* **Endpoint**: `PUT /api/v1/finance-refund/{id}/paid-status`
* **Permission**: `permission:finance:edit`
* **Request Body**:
```json
{
  "is_paid": true
}
```
> [!IMPORTANT]
> Request `is_paid = true` pada Finance Refund hanya berhasil jika seluruh sisa tagihan telah lunas (`remaining_payment <= 0`).

---

## 4. Contoh Implementasi Komponen Next.js (TypeScript)

### 4.1 Tombol Refund dengan Tooltip Validasi Lunas
```tsx
import React from 'react';
import { Button, Tooltip } from '@/components/ui'; // Sesuaikan UI library project Anda

interface RefundButtonProps {
  unitTransaction: {
    id: number;
    code: string;
    unitTransactionBilling?: {
      is_paid: boolean;
    };
  };
  onOpenRefundModal: (transactionId: number) => void;
}

export const RefundActionButton: React.FC<RefundButtonProps> = ({
  unitTransaction,
  onOpenRefundModal,
}) => {
  const isPaid = Boolean(unitTransaction?.unitTransactionBilling?.is_paid);

  if (!isPaid) {
    return (
      <Tooltip content="Transaksi ini belum lunas">
        <span className="inline-block cursor-not-allowed">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="pointer-events-none opacity-50"
          >
            Refund
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => onOpenRefundModal(unitTransaction.id)}
    >
      Refund
    </Button>
  );
};
```

---

### 4.2 Validasi Form Input Finance Billing terhadap `remaining_payment`
```typescript
import { z } from 'zod';

export const createFinanceBillingSchema = (remainingPayment: number) =>
  z.object({
    finance_refund_id: z.number(),
    cash_id: z.number().min(1, 'Pilih akun kas/bank'),
    account_id: z.number().optional().nullable(),
    amount: z
      .number({ invalid_type_error: 'Nominal harus berupa angka' })
      .min(0.01, 'Nominal minimal 0.01')
      .max(
        remainingPayment,
        `Nominal tidak boleh melebihi sisa tagihan (${remainingPayment.toLocaleString('id-ID')})`
      ),
    payment_at: z.string().nonempty('Tanggal pembayaran wajib diisi'),
    note: z.string().optional(),
  });
```

---

## 5. Ringkasan Endpoint & Izin Akses (Cheatsheet)

| Modul | Method | Endpoint | Permission | Kegunaan |
|---|---|---|---|---|
| **Admin** | `POST` | `/api/v1/unit-transaction-refund` | `transaction:create` | Mengajukan refund unit transaksi baru |
| **Admin** | `POST` | `/api/v1/unit-transaction-refund-payment` | `transaction:create` | Mencatat alokasi kas pembayaran refund unit |
| **Admin** | `PUT` | `/api/v1/unit-transaction-refund/{id}/paid-status` | `transaction:edit` | Mengubah status lunas refund (memicu pembuatan Finance Refund) |
| **Finance** | `GET` | `/api/v1/finance-refund` | `finance:list` | Mengambil daftar tagihan finance refund |
| **Finance** | `GET` | `/api/v1/finance-refund/{id}` | `finance:list` | Mengambil detail tagihan finance refund & daftar billing |
| **Finance** | `PUT` | `/api/v1/finance-refund/{id}` | `finance:edit` | Memperbarui informasi tagihan multi-kas finance refund |
| **Finance** | `POST` | `/api/v1/finance-billing` | `finance:create` | Menambah pembayaran/billing kas pada finance refund |
| **Finance** | `PUT` | `/api/v1/finance-refund/{id}/paid-status` | `finance:edit` | Mengubah status lunas finance refund |
