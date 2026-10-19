# Dokumentasi API Laba Rugi (Profit & Loss) — Skema Baru

Dokumen ini ditujukan sebagai panduan integrasi bagi Frontend Developer / AI Frontend untuk mengelola konfigurasi dan laporan laba rugi berbasis tahun dan bulan.

---

## 1. Ikhtisar & Arsitektur Baru

1. **`ProfitLossTemplate`** adalah template utama per perusahaan (`company_id`).
2. **`ProfitLossTemplateYear`** menyimpan konfigurasi per tahun (`year`) untuk template tersebut.
3. Konfigurasi (`config`) mencakup 4 grup akun per bulan (Januari–Desember) dan nilai pajak (`tax`) tahunan:
   - `revenue_account_ids` (Pendapatan)
   - `cogs_account_ids` (Beban Pokok Usaha / HPP)
   - `opex_account_ids` (Beban Operasional)
   - `non_opex_account_ids` (Beban Non Operasional)
   - `tax` (Persentase pajak tahunan, berupa desimal/float atau `null`)
4. Setiap bulan pada grup akun secara default berisi array kosong `[]` (nullable/tanpa akun otomatis terpilih), dan `tax` default `null`.
5. Duplikasi kombinasi `company_id` (template) dan `year` dicegah pada level database & validasi (HTTP 422).

---

## 2. Standar Response Envelope

Semua response mengikuti standar `ResponseTrait` backend Wajira:

### Response Sukses
```json
{
  "status": true,
  "message": "Pesan sukses dalam bahasa Inggris",
  "errors": null,
  "data": { ... }
}
```

### Response Gagal / Validasi
```json
{
  "status": false,
  "message": "Validation failed",
  "errors": {
    "year": [
      "The year field is required."
    ]
  },
  "data": null
}
```

---

## 3. Daftar Endpoint API

Semua endpoint berada di bawah prefix rute API (misal `/wapi` atau disesuaikan dengan konfigurasi gateway Anda) dan membutuhkan autentikasi Bearer Token JWT serta permission `report:list`.

| No | Method | Endpoint | Deskripsi |
|---|---|---|---|
| 1 | `GET` | `/wapi/profit-loss-report/{company_id}` | Mengambil data Laporan Laba Rugi berdasarkan filter tahun & bulan |
| 2 | `GET` | `/wapi/profit-loss-report/{company_id}/template` | Mengambil template perusahaan beserta seluruh daftar tahun yang telah dikonfigurasi |
| 3 | `GET` | `/wapi/profit-loss-report/{company_id}/year/{year}` | Mengambil detail konfigurasi akun untuk tahun tertentu |
| 4 | `POST` | `/wapi/profit-loss-report/{company_id}/year` | Membuat konfigurasi akun baru untuk tahun tertentu |
| 5 | `PUT` | `/wapi/profit-loss-report/{company_id}/year/{year}` | Memperbarui konfigurasi akun untuk tahun tertentu |
| 6 | `DELETE` | `/wapi/profit-loss-report/{company_id}/year/{year}` | Menghapus konfigurasi tahun tertentu |
| 7 | `PUT` | `/wapi/profit-loss-report/{company_id}/template` | Endpoint kompatibilitas untuk memperbarui/membuat konfigurasi tahun |
| 8 | `GET` | `/wapi/profit-loss-report/{company_id}/export` | Export laporan laba rugi ke file Excel (`.xlsx`) |

---

## 4. Rincian Endpoint

### 4.1. Ambil Laporan Laba Rugi (Report Data)
Mengambil data ringkasan dan rincian transaksi laporan laba rugi untuk perusahaan, tahun, dan bulan yang diminta.

- **Method**: `GET`
- **Endpoint**: `/wapi/profit-loss-report/{company_id}`
- **Query Parameters**:
  - `year` *(optional, integer)*: Tahun laporan (contoh: `2026`). Jika tidak diisi, mengambil dari parameter tanggal atau default tahun berjalan.
  - `month` *(optional, string/integer)*: Bulan laporan (contoh: `1`, `01`, atau `january`). Jika tidak diisi, default bulan berjalan.

#### Response:
```json
{
  "status": true,
  "message": "Profit & Loss report data retrieved successfully",
  "errors": null,
  "data": {
    "year": 2026,
    "month": "january",
    "summary": {
      "opening_balance": 50000000,
      "ending_balance": 75000000
    },
    "revenue_account_ids": [12, 15],
    "cogs_account_ids": [20, 21],
    "opex_account_ids": [30, 31],
    "non_opex_account_ids": [40],
    "tax": 11,
    "revenue_calc": {
      "total": 50000000,
      "accounts": [
        {
          "id": 12,
          "account_id": 12,
          "account_code": "4-100",
          "account_name": "Pendapatan Jasa Angkut",
          "account_type": null,
          "amount": 50000000,
          "type": "IDR"
        }
      ]
    },
    "cogs_calc": {
      "total": 20000000,
      "accounts": [
        {
          "id": 20,
          "account_id": 20,
          "account_code": "5-100",
          "account_name": "Biaya Bahan Bakar",
          "account_type": null,
          "amount": 20000000,
          "type": "IDR"
        }
      ]
    },
    "opex_calc": {
      "total": 5000000,
      "accounts": [
        {
          "id": 30,
          "account_id": 30,
          "account_code": "6-100",
          "account_name": "Beban Gaji Kantor",
          "account_type": null,
          "amount": 5000000,
          "type": "IDR"
        }
      ]
    },
    "non_opex_calc": {
      "total": 1000000,
      "accounts": [
        {
          "id": 40,
          "account_id": 40,
          "account_code": "7-100",
          "account_name": "Beban Bunga Pinjaman",
          "account_type": null,
          "amount": 1000000,
          "type": "IDR"
        }
      ]
    },
    "profit_loss_before_tax": 24000000,
    "tax_amount": 2640000,
    "profit_loss_after_tax": 21360000
  }
}
```

---

### 4.2. Ambil Template & Daftar Tahun yang Dikonfigurasi
Mengambil entitas template laba rugi perusahaan beserta seluruh daftar konfigurasi tahunnya dan struktur default.

- **Method**: `GET`
- **Endpoint**: `/wapi/profit-loss-report/{company_id}/template`
- **Query Parameters**:
  - `year` *(optional, integer)*: Filter hanya tahun tertentu.

#### Response:
```json
{
  "status": true,
  "message": "Profit & Loss template retrieved successfully",
  "errors": null,
  "data": {
    "template": {
      "id": 1,
      "company_id": 1,
      "created_at": "2026-10-12T10:00:00.000000Z",
      "updated_at": "2026-10-12T10:00:00.000000Z",
      "profit_loss_template_years": [
        {
          "id": 1,
          "profit_template_id": 1,
          "year": 2026,
          "config": {
            "revenue_account_ids": {
              "january": [12, 15],
              "february": [12],
              "march": [],
              "april": [],
              "may": [],
              "june": [],
              "july": [],
              "august": [],
              "september": [],
              "october": [],
              "november": [],
              "december": []
            },
            "cogs_account_ids": {
              "january": [20, 21],
              "february": [],
              "march": [],
              "april": [],
              "may": [],
              "june": [],
              "july": [],
              "august": [],
              "september": [],
              "october": [],
              "november": [],
              "december": []
            },
            "opex_account_ids": { ... },
            "non_opex_account_ids": { ... },
            "tax": 11
          },
          "created_at": "2026-10-12T10:00:00.000000Z",
          "updated_at": "2026-10-12T10:00:00.000000Z"
        }
      ]
    },
    "default_structure": {
      "revenue_account_ids": {
        "january": [], "february": [], "march": [], "april": [], "may": [], "june": [],
        "july": [], "august": [], "september": [], "october": [], "november": [], "december": []
      },
      "cogs_account_ids": { ... },
      "opex_account_ids": { ... },
      "non_opex_account_ids": { ... },
      "tax": null
    }
  }
}
```

---

### 4.3. Ambil Konfigurasi Tahun Tertentu
Mengambil detail konfigurasi akun untuk tahun tertentu.

- **Method**: `GET`
- **Endpoint**: `/wapi/profit-loss-report/{company_id}/year/{year}`
  *(Bisa menggunakan format 4 digit tahun seperti `2026` atau ID record `profit_loss_template_years`)*

#### Response:
```json
{
  "status": true,
  "message": "Profit & Loss template year retrieved successfully",
  "errors": null,
  "data": {
    "id": 1,
    "profit_template_id": 1,
    "year": 2026,
    "config": {
      "revenue_account_ids": {
        "january": [12, 15],
        "february": [12],
        "march": [],
        "april": [],
        "may": [],
        "june": [],
        "july": [],
        "august": [],
        "september": [],
        "october": [],
        "november": [],
        "december": []
      },
      "cogs_account_ids": { ... },
      "opex_account_ids": { ... },
      "non_opex_account_ids": { ... },
      "tax": 11
    },
    "created_at": "2026-10-12T10:00:00.000000Z",
    "updated_at": "2026-10-12T10:00:00.000000Z"
  }
}
```

---

### 4.4. Buat Konfigurasi Tahun Baru
Membuat konfigurasi baru untuk kombinasi template perusahaan dan tahun yang belum ada.

- **Method**: `POST`
- **Endpoint**: `/wapi/profit-loss-report/{company_id}/year`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

*(Bisa mengirim field konfigurasi di level root ataupun dibungkus di dalam objek `config`)*

```json
{
  "year": 2026,
  "tax": 11,
  "revenue_account_ids": {
    "january": [12, 15],
    "february": [12]
  },
  "cogs_account_ids": {
    "january": [20, 21]
  },
  "opex_account_ids": {
    "january": [30]
  },
  "non_opex_account_ids": {
    "january": [40]
  }
}
```

> **Catatan**: Bulan yang tidak disertakan akan otomatis dibentuk menjadi array kosong `[]` secara default.

#### Response Sukses (201 Created):
```json
{
  "status": true,
  "message": "Profit & Loss template year created successfully",
  "errors": null,
  "data": {
    "id": 1,
    "profit_template_id": 1,
    "year": 2026,
    "config": {
      "revenue_account_ids": {
        "january": [12, 15],
        "february": [12],
        "march": [],
        "april": [],
        "may": [],
        "june": [],
        "july": [],
        "august": [],
        "september": [],
        "october": [],
        "november": [],
        "december": []
      },
      "cogs_account_ids": {
        "january": [20, 21],
        "february": [],
        "march": [],
        "april": [],
        "may": [],
        "june": [],
        "july": [],
        "august": [],
        "september": [],
        "october": [],
        "november": [],
        "december": []
      },
      "opex_account_ids": {
        "january": [30],
        "february": [],
        "march": [],
        "april": [],
        "may": [],
        "june": [],
        "july": [],
        "august": [],
        "september": [],
        "october": [],
        "november": [],
        "december": []
      },
      "non_opex_account_ids": {
        "january": [40],
        "february": [],
        "march": [],
        "april": [],
        "may": [],
        "june": [],
        "july": [],
        "august": [],
        "september": [],
        "october": [],
        "november": [],
        "december": []
      },
      "tax": 11
    },
    "created_at": "2026-10-12T10:00:00.000000Z",
    "updated_at": "2026-10-12T10:00:00.000000Z"
  }
}
```

#### Response Error Jika Tahun Sudah Ada (422):
```json
{
  "status": false,
  "message": "Configuration for year 2026 already exists for this template",
  "errors": null,
  "data": null
}
```

---

### 4.5. Perbarui Konfigurasi Tahun
Memperbarui konfigurasi akun dan pajak untuk tahun tertentu.

- **Method**: `PUT`
- **Endpoint**: `/wapi/profit-loss-report/{company_id}/year/{year}`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "tax": 12,
  "revenue_account_ids": {
    "january": [12, 15, 18],
    "february": [12, 18]
  }
}
```

#### Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Profit & Loss template year updated successfully",
  "errors": null,
  "data": {
    "id": 1,
    "profit_template_id": 1,
    "year": 2026,
    "config": {
      "revenue_account_ids": {
        "january": [12, 15, 18],
        "february": [12, 18],
        "march": [],
        ...
      },
      ...
      "tax": 12
    },
    "updated_at": "2026-10-12T10:15:00.000000Z"
  }
}
```

---

### 4.6. Hapus Konfigurasi Tahun
Menghapus konfigurasi tahun tertentu dari template perusahaan.

- **Method**: `DELETE`
- **Endpoint**: `/wapi/profit-loss-report/{company_id}/year/{year}`

#### Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Profit & Loss template year deleted successfully",
  "errors": null,
  "data": null
}
```

---

### 4.7. Update Kompatibilitas Template
Endpoint ini disediakan untuk menjaga kompatibilitas dengan frontend yang memanggil rute template lama.

- **Method**: `PUT`
- **Endpoint**: `/wapi/profit-loss-report/{company_id}/template`
- **Request Body**:
```json
{
  "year": 2026,
  "tax": 11,
  "revenue_account_ids": {
    "january": [12, 15]
  }
}
```
*(Jika field `year` tidak dikirim, otomatis menargetkan tahun berjalan `YYYY`)*.

---

### 4.8. Export Laporan Laba Rugi ke Excel
Mengunduh file `.xlsx` laporan laba rugi sesuai filter tahun dan bulan.

- **Method**: `GET`
- **Endpoint**: `/wapi/profit-loss-report/{company_id}/export`
- **Query Parameters**:
  - `year`: Tahun laporan (contoh: `2026`)
  - `month`: Bulan laporan (contoh: `january` atau `1`)
  - `category`: Filter kategori (`revenue`, `cogs`, `gross_profit`, `opex`, `noix`)
  - `start_date` / `end_date`: Filter tanggal transaksi

---

## 5. Tips Integrasi Frontend

1. **Pemilihan Akun per Bulan**: UI dapat menyediakan dropdown/tab pemilihan bulan (Januari–Desember) di dalam form konfigurasi tahun.
2. **Validasi Akun**: Setiap ID akun yang dikirimkan wajib bertipe integer dan milik perusahaan terkait (`company_id`). Backend memvalidasi hal ini menggunakan `RightAccountRule`.
3. **Persentase Pajak**: Input `tax` dapat diisi angka `0`–`100` (atau desimal seperti `11.5`) atau `null` jika tidak ada pajak.
4. **Tahun Baru**: Sebelum menambahkan tahun baru, frontend dapat mengecek daftar tahun yang sudah terdaftar melalui endpoint `GET /wapi/profit-loss-report/{company_id}/template`.
