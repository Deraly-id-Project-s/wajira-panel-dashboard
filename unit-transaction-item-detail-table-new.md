# Unit Transaction Item Detail — API Update Summary

Dokumen ringkasan pembaruan API endpoint rincian tipe unit transaksi (`getUnitTypeDetails`) pada modul **Unit Transaction**.

---

## 1. Informasi Endpoint

| Item | Deskripsi |
|---|---|
| **Route Name** | `transaction.unit-transaction.get-unit-type-details` |
| **Endpoint** | `GET /wapi/unit-transaction/{id}/get-unit-type-details` |
| **Controller** | `App\Http\Controllers\Transaction\UnitTransactionController` |
| **Method** | `getUnitTypeDetails(Request $request, string $id)` |
| **Model Terkait** | `App\Models\UnitTransaction`, `App\Models\UnitTransactionItemDetail`, `App\Models\Person` |
| **Middleware** | `api`, `auth:api`, `feature:unit-transaction` |

---

## 2. Latar Belakang & Tujuan Perubahan

1. **Pemisahan Entitas Supplier dan Customer**:
   - Model `Person` pada tabel `persons` menyimpan data rekanan bisnis (customer, supplier, dealer, vendor, driver) yang dibedakan oleh kolom `type`.
   - Model `UnitTransactionItemDetail` memiliki relasi terpisah:
     - `supplier_id` ➔ relasi `supplier` ke model `Person` (dengan `type = 'supplier'`).
     - `customer_id` ➔ relasi `customer` ke model `Person` (dengan `type = 'customer'`).

2. **Menghapus Objek `person` dan Boilerplate**:
   - Sebelumnya, data `person` di-inject secara manual via loop transform PHP (`$item->person = $personData`) menggunakan data person dari transaksi header (`$unitTransaction->person`).
   - Pendekatan sebelumnya menimbulkan boilerplate dan data duplikasi yang kurang akurat untuk tingkat item detail.
   - Sekarang, objek `person` dihapus dan digantikan langsung oleh relasi Eloquent `supplier` dan `customer` pada masing-masing item detail.

3. **Efisiensi Proyeksi Kolom**:
   - Sesuai spesifikasi, pemuatan data dari model `Person` dibatasi hanya memproyeksikan kolom: `id`, `name`, dan `type`.

---

## 3. Detail Perubahan Kode

### 3.1 Controller: `UnitTransactionController@getUnitTypeDetails`

1. **Header Transaction Query**:
   - Tidak lagi melakukan eager-loading `person:id,uuid,code,type,name` maupun memilih `person_id`.
   - Menggunakan query minimalis:
     ```php
     $unitTransaction = UnitTransaction::select(['id', 'type'])
         ->findOrFail((int) $id);
     $unitTransaction->setAppends([]);
     ```

2. **Eager Loading Relasi Item Detail**:
   - Menambahkan relasi `supplier` dan `customer` dengan proyeksi kolom `id,name,type`:
     ```php
     $detailsQuery->with([
         'unitTransactionItem:id,unit_transaction_id,unit_type_id',
         'unitTransactionItem.unitType:id,code,name,unit_type,unit_model',
         'unitTransactionItem.unitType.unitTypePriceVersions',
         'warehouseSubBlock:id,name',
         'supplier:id,name,type',
         'customer:id,name,type',
     ]);
     ```

3. **Transform Collection**:
   - Menghilangkan variabel `$personData` dan penugasan manual `$item->person = $personData`.
   - Menyederhanakan penanganan koleksi (reusable code & bebas boilerplate):
     ```php
     $data->getCollection()->transform(function ($item) {
         if ($item->unitTransactionItem?->unitType) {
             $item->unitTransactionItem->unitType->makeHidden('unitTypePriceVersions');
         }

         return $item;
     });
     ```

---

## 4. Struktur Request & Response

### 4.1 Query Parameters

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `search` | `string` | Tidak | Pencarian berdasarkan `color`, `chassis_number`, atau `machine_number`. |
| `status` | `string` | Tidak | Filter berdasarkan status item (misal: `pending`, `available`, `sold`, dll). |
| `stock_state` | `string` | Tidak | Filter kondisi fisik unit (`good`, `repaired`, `bad`). |
| `in_stock` | `boolean` | Tidak | Filter ketersediaan unit dalam stok gudang (`true`/`false`). |
| `per_page` | `integer` | Tidak | Jumlah data per halaman (default: `10`). |
| `page` | `integer` | Tidak | Nomor halaman pagination (default: `1`). |

---

### 4.2 Perbandingan Payload Item Detail (Sebelum vs Sesudah)

#### Sebelum:
```json
{
  "id": 105,
  "uuid": "4f54d743-4bf5-4b14-9b5b-21da782f9c5a",
  "unit_transaction_item_id": 42,
  "warehouse_sub_block_id": 2,
  "color": "Hitam Glossy",
  "machine_number": "MH1JM111XP001",
  "chassis_number": "JM11E10001",
  "in_stock": true,
  "is_forecast": false,
  "status": "available",
  "stock_state": "good",
  "is_sold_unit": false,
  "is_reserved": false,
  "customer_id": null,
  "supplier_id": 12,
  "unit_transaction_item": {
    "id": 42,
    "unit_transaction_id": 15,
    "unit_type_id": 3,
    "unit_type": {
      "id": 3,
      "code": "VARIO-160",
      "name": "Honda Vario 160 CBS",
      "unit_type": "matic",
      "unit_model": "Vario"
    }
  },
  "warehouse_sub_block": {
    "id": 2,
    "name": "Sub Blok A1"
  },
  "person": {
    "id": 12,
    "uuid": "7a3536fa-6979-4bc7-99e2-875f560e9a5c",
    "code": "SPL-WJM/0012",
    "type": "supplier",
    "name": "PT Astra Honda Motor"
  }
}
```

#### Sesudah:
```json
{
  "id": 105,
  "uuid": "4f54d743-4bf5-4b14-9b5b-21da782f9c5a",
  "unit_transaction_item_id": 42,
  "warehouse_sub_block_id": 2,
  "color": "Hitam Glossy",
  "machine_number": "MH1JM111XP001",
  "chassis_number": "JM11E10001",
  "in_stock": true,
  "is_forecast": false,
  "status": "available",
  "stock_state": "good",
  "is_sold_unit": false,
  "is_reserved": false,
  "customer_id": 8,
  "supplier_id": 12,
  "unit_transaction_item": {
    "id": 42,
    "unit_transaction_id": 15,
    "unit_type_id": 3,
    "unit_type": {
      "id": 3,
      "code": "VARIO-160",
      "name": "Honda Vario 160 CBS",
      "unit_type": "matic",
      "unit_model": "Vario"
    }
  },
  "warehouse_sub_block": {
    "id": 2,
    "name": "Sub Blok A1"
  },
  "supplier": {
    "id": 12,
    "name": "PT Astra Honda Motor",
    "type": "supplier"
  },
  "customer": {
    "id": 8,
    "name": "PT Wahana Makmur Sejati",
    "type": "customer"
  }
}
```

> [!NOTE]
> Jika salah satu relasi tidak terhubung (misal pada transaksi pembelian di mana `customer_id` bernilai `null`), atribut relasi yang bersangkutan akan bernilai `null`.
