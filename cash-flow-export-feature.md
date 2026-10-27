# Fitur Export Cash Flow ke Excel (.xlsx)

Dokumentasi ini menjelaskan implementasi fitur export data Cash Flow ke format spreadsheet Excel (.xlsx) pada backend Wajira Enterprise.

---

## 1. Ringkasan Endpoint

| Komponen | Keterangan |
|---|---|
| **URL** | `GET /wapi/finance/cash-flow/export` |
| **Middleware** | `api`, `auth:api`, `feature:daily-cash-transactions` |
| **Permission** | `finance:list` |
| **Controller** | `App\Http\Controllers\Finance\DailyCashFlowController@export` |
| **Export Class** | `App\Exports\CashFlowExport` |
| **Format File** | Microsoft Excel OpenXML Spreadsheet (`.xlsx`) |
| **Filename Default** | `wajira_cash_flow_data.xlsx` |

---

## 2. Query Parameters (Filter & Pengurutan)

Fitur export ini mendukung seluruh filter dan parameter pengurutan yang sama dengan endpoint daftar Cash Flow (`GET /wapi/finance/cash-flow`):

| Parameter | Tipe | Contoh / Keterangan |
|---|---|---|
| `company_id` | integer | Filter berdasarkan ID perusahaan |
| `is_paid` | boolean | `true` (hanya lunas) atau `false` (belum lunas) |
| `is_valid` | boolean | `true` (hanya yang sudah valid) atau `false` |
| `search` | string | Pencarian teks pada nomor transaksi (`code`) atau catatan (`note`) |
| `date` | date (`Y-m-d`) | Filter transaksi pada tanggal tertentu |
| `start_date` | date (`Y-m-d`) | Tanggal awal rentang transaksi |
| `end_date` | date (`Y-m-d`) | Tanggal akhir rentang transaksi |
| `month` / `bulan` | integer/string | Filter bulan transaksi (contoh: `10` atau `2026-10`) |
| `year` / `tahun` | integer | Filter tahun transaksi (contoh: `2026`) |
| `sort_by` | string | Kolom pengurutan (`id`, `date`, `code`, `is_paid`, dsb.) |
| `sort_order` | string | `asc` atau `desc` |

---

## 3. Struktur Kolom File Excel

File Excel yang di-generate memiliki kolom-kolom berikut:

| Header Kolom | Sumber Data | Keterangan |
|---|---|---|
| **No** | Auto-increment | Nomor urut baris |
| **Kode Transaksi** | `code` | Kode unik Cash Flow (e.g. `TRX202610240001`) |
| **Tanggal** | `date` | Tanggal transaksi (`YYYY-MM-DD`) |
| **Nomor Invoice** | `invoice_number` | Nomor transaksi unit/invoice terkait |
| **Keterangan** | `note` | Catatan transaksi |
| **Kas / Bank** | Relasi Cash | Daftar nama akun kas/bank yang digunakan (dipisahkan koma) |
| **Debit (IDR)** | `debet_total` | Total mutasi debit IDR |
| **Kredit (IDR)** | `credit_total` | Total mutasi kredit IDR |
| **Debit (USD)** | `debet_usd_total` | Total mutasi debit USD |
| **Kredit (USD)** | `credit_usd_total` | Total mutasi kredit USD |
| **Grand Total (IDR)** | `grand_total` | Total transaksi IDR |
| **Grand Total (USD)** | `grand_total_usd` | Total transaksi USD |
| **Sisa Pembayaran (IDR)** | `remaining_payment` | Sisa tagihan belum terbayar IDR |
| **Sisa Pembayaran (USD)** | `remaining_payment_usd`| Sisa tagihan belum terbayar USD |
| **Status Bayar** | `is_paid` | `Lunas` atau `Belum Lunas` |
| **Status Validasi** | `is_valid` | `Valid` atau `Belum Valid` |

---

## 4. Contoh Request

```http
GET /wapi/finance/cash-flow/export?company_id=1&start_date=2026-10-01&end_date=2026-10-31 HTTP/1.1
Host: api-finance.wajiracorps.co.id
Authorization: Bearer <access_token>
Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

---

## 5. Respons

- **200 OK**: Mengunduh stream binary file `.xlsx`.
- **401 Unauthorized**: Token JWT tidak valid atau sudah kedaluwarsa.
- **403 Forbidden**: Pengguna tidak memiliki akses modul/fitur atau permission `finance:list`.
- **500 Internal Server Error**: Envelope JSON error jika terjadi kendala saat generate Excel:
  ```json
  {
    "status": false,
    "message": "Cash Flow export failed",
    "errors": "<error_message>",
    "data": null
  }
  ```
