# Dokumentasi Formula Perhitungan Transaksi Unit (USD & IDR) untuk Frontend

Dokumen ini menjelaskan formula perhitungan transaksi unit (`unit_transactions`) dan itemnya (`unit_transaction_items`), serta pemetaan field response API yang digunakan oleh Frontend (`project-wajira-panel`).

---

## 1. Alur & Konsep Dasar Perhitungan

1. **Perhitungan dilakukan secara granular per item (`unit_transaction_items`)**:
   - Setiap item menghitung **Total Kotor (Gross)** miliknya sendiri.
   - Diskon dihitung dari total kotor item tersebut.
   - **Total Bersih (Netto)** item adalah total kotor dikurangi diskon.
2. **Level Transaksi Header (`data`)**:
   - Nilai di level transaksi merupakan hasil **penjumlahan (agregasi)** dari masing-masing item.

---

## 2. Formula Detail Per Item (`unit_transaction_items`)

### Transaksi USD (`is_usd_transaction: true`)

Untuk setiap item di dalam array `unit_transaction_items`:

1. **Subtotal Harga Unit Kotor**:
   $$\text{Base USD} = \text{qty\_total} \times \text{price\_per\_unit\_usd}$$
2. **Total Biaya Tambahan USD**:
   $$\text{Total USD Cost} = \sum \text{amount (dari unit\_transaction\_usd\_costs)}$$
   *(freight, box packing, admin cost, ckd processing, bill of lading, customs clearance, dll)*
3. **Total Kotor Item (Gross)**:
   $$\text{Gross Item USD} = \text{Base USD} + \text{Total USD Cost}$$
4. **Nominal Diskon Item**:
   $$\text{Discount Item USD} = \text{Gross Item USD} \times \frac{\text{price\_usd\_discount}}{100}$$
5. **Total Bersih Item Setelah Diskon (Netto)**:
   $$\text{price\_total\_usd} = \text{Gross Item USD} - \text{Discount Item USD}$$

> **Contoh Kasus (Data Nyata):**
> - `qty_total` = 3
> - `price_per_unit_usd` = $1.300
> - `total_usd_cost` = $60
> - `price_usd_discount` = 40%
>
> **Hasil Perhitungan:**
> - $\text{Base USD} = 3 \times 1.300 = 3.900$
> - $\text{Gross Item USD} = 3.900 + 60 = \mathbf{3.960}$
> - $\text{Discount Item USD} = 3.960 \times 40\% = \mathbf{1.584}$
> - $\text{price\_total\_usd} = 3.960 - 1.584 = \mathbf{2.376}$

---

## 3. Formula Agregasi di Level Transaksi Header (`data`)

Jika transaksi memiliki $N$ item:

| Field Response API | Formula / Sumber Perhitungan | Contoh Nilai |
| :--- | :--- | :--- |
| `bruto_total` / `unit_transaction_bruto_total` | $\sum \text{Gross Item USD}$ (Total kotor sebelum diskon) | **3.960** |
| `total_discount` / `transaction_discount_total` | $\sum \text{Discount Item USD}$ (Total potongan diskon) | **1.584** |
| `transaction_price_usd_total` / `unit_transaction_price_usd_total` | $\sum \text{price\_total\_usd}$ (Total bersih setelah diskon) | **2.376** |
| `total_usd_cost` / `transaction_usd_cost_total` | $\sum \text{Total USD Cost}$ seluruh item | **60** |

---

## 4. Formula Billing Summary (`data.billing_summary`)

| Field Billing Summary | Formula / Sumber Perhitungan | Contoh Nilai |
| :--- | :--- | :--- |
| `bruto_total` | Nilai kotor normal (`bruto_total` transaksi) | **3.960** |
| `grand_total` | Nilai bersih yang harus dibayar (`transaction_price_usd_total`) | **2.376** |
| `total_paid` / `total_paid_usd` | Total pembayaran yang sudah dibayarkan (Cash/BCA USD) | **0** |
| `remaining_payment` / `remaining_payment_usd` | $\max(0, \text{grand\_total} - \text{total\_paid})$ | **2.376** |
| `is_paid` | Status lunas transaksi (`true` / `false`) | `false` |

---

## 5. Panduan Tampilan UI di Frontend Panel

Saat menampilkan ringkasan transaksi di panel frontend:

```text
+--------------------------------------------------------------+
| Rincian Pembayaran Transaksi                                 |
+--------------------------------------------------------------+
| Total Bruto (Kotor)   : $ 3.960,00  (data.bruto_total)       |
| Total Diskon (40%)    : $ 1.584,00  (data.total_discount)    |
|--------------------------------------------------------------|
| Grand Total           : $ 2.376,00  (billing_summary.grand_total / transaction_price_usd_total)
| Total Terbayar        : $     0,00  (billing_summary.total_paid_usd)
| Sisa Tagihan          : $ 2.376,00  (billing_summary.remaining_payment)
+--------------------------------------------------------------+
```

### Tabel Rincian Item (`data.unit_transaction_items`):
- Kolom **Harga Satuan**: `item.price_per_unit_usd` (cth: `$1.300`)
- Kolom **Qty**: `item.qty_total` (cth: `3`)
- Kolom **Biaya Tambahan**: `item.total_usd_cost` (cth: `$60`)
- Kolom **Diskon**: `item.price_usd_discount` (cth: `40%`)
- Kolom **Total Akhir Item**: `item.price_total_usd` (cth: `$2.376`)
