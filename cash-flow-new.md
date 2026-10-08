# Dokumentasi Perubahan Struktur API & Tampilan Cash Flow (Kas Harian)

Dokumen ini mencatat penyesuaian arsitektur frontend, tipe data, service layer, serta tampilan UI (tabel dan detail) terkait pembaharuan struktur API Cash Flow pada modul Transaksi Kas Harian.

---

## 1. Ringkasan Perubahan

Perubahan struktur API Cash Flow mencakup 2 area utama:
1. **Tabel Arus Transaksi Kas Harian (`KasHarianTable`)**:
   - Mapping nilai debet & kredit (IDR & USD) bersumber dari object `cash_position`.
   - Penambahan informasi sisa pembayaran (*remaining payment*) untuk mata uang IDR dan USD.
2. **Halaman Detail Transaksi Kas Harian (`KasHarianDetailPage`)**:
   - Pemetaan `SummaryCard` berbasis data master kas (`/wapi/master-data/cash?company_id=...`).
   - Pengakumulasian biaya USD (`unit_transaction_usd_costs`) khusus untuk kategori tipe `other`.
   - Pengelompokan (*grouping*) Ringkasan Pembayaran antara Rupiah (IDR) dan Dollar (USD).

---

## 2. Perubahan Tipe Data (`src/@types/kas-harian.types.ts`)

Perubahan struktur respon API diakomodasi melalui interface baru dan update pada tipe data utama:

```typescript
// Position ringkasan debet & kredit
export interface KasHarianCashPosition {
  debet_idr_total: number;
  credit_idr_total: number;
  debet_usd_total: number;
  credit_usd_total: number;
}

// Summary ringkasan per akun kas
export interface KasHarianCashSummary {
  cash_id: number;
  cash?: (KasHarianCash & { currency_type?: string; cash_name?: string; company_id?: number }) | null;
  debet_total: number;
  credit_total: number;
  debet_usd_total: number;
  credit_usd_total: number;
}

// Transaksi kas detail
export interface KasHarianCashFlowCash {
  id: number;
  cash_flow_id: number;
  cash_id: number;
  amount: number;
  amount_original: number;
  type: string;
  created_at?: string;
  updated_at?: string;
  cash?: {
    id: number;
    uuid?: string;
    company_id?: number;
    currency_type?: string;
    cash_name?: string;
    type?: string;
    code?: string;
  } | null;
}

// Biaya USD Unit Transaksi
export interface KasHarianUnitTransactionUsdCost {
  id: number;
  unit_transaction_item_id?: number;
  cost_type: string; // 'freight' | 'box_packing' | 'admin_cost' | 'ckd_processing_cost' | 'bill_of_lading_switch_cost' | 'customs_clearance_cost' | 'other'
  amount: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}
```

---

## 3. Service & Normalisasi Data (`src/services/cashFlowService.ts`)

Fungsi `normalizeCashFlow` telah diperbarui untuk memastikan seluruh field baru terparsing secara konsisten:
- `cash_position`: Memetakan `debet_idr_total`, `credit_idr_total`, `debet_usd_total`, `credit_usd_total`.
- `cash_summaries` & `cash_flow_cashes`: Memetakan array kas dan summary transaksi.
- `grand_total_usd`: Preservasi nilai grand total transaksi USD.
- `unit_transaction_billing.unit_transaction.unit_transaction_usd_costs`: Mengonversi array biaya USD ke tipe `KasHarianUnitTransactionUsdCost[]`.

---

## 4. Pemetaan Tabel Cash Flow (`KasHarianTable.tsx` & `index.tsx`)

### A. Mapping Kolom
Setiap item pada baris tabel dipetakan dengan aturan berikut:

| Kolom Tabel | Field Respon API | Fallback / Default |
| --- | --- | --- |
| **DEBET IDR** | `item.cash_position.debet_idr_total` | `item.debet` |
| **KREDIT IDR** | `item.cash_position.credit_idr_total` | `item.credit` |
| **DEBET USD** | `item.cash_position.debet_usd_total` | `item.debet_usd` |
| **KREDIT USD** | `item.cash_position.credit_usd_total` | `item.credit_usd` |
| **KURANG BAYAR IDR** | `item.remaining_payment` | `0` |
| **KURANG BAYAR USD** | `item.remaining_payment_usd` | `0` |

---

## 5. Penyesuaian Halaman Detail (`[id].tsx`)

### A. SummaryCard Berdasarkan Master Data Kas
- `SummaryCard` tidak lagi memakai 4 kartu statis Debet/Kredit IDR & USD.
- Mengambil daftar master kas dari API `{{url}}/wapi/master-data/cash?company_id=...` via hook `useKas(companyId)`.
- Memetakan setiap kas secara dinamis dengan mencocokkan `cash_id` pada `cash_summaries` atau `cash_flow_cashes`.

### B. Biaya USD Unit Transaksi (`unit_transaction_usd_costs`)
- Seluruh biaya USD diproses sebelum dirender.
- **Aturan khusus**: Item dengan `cost_type === 'other'` yang berjumlah lebih dari satu **diakumulasikan/dijumlahkan** nominalnya ke dalam 1 kategori "Biaya Lainnya (USD)".
- Menampilkan rincian biaya seperti `Ongkos Angkut (Freight)`, `Box & Packing`, `Biaya Admin`, `Processing CKD`, `Switch B/L`, `Bea Cukai (Customs)`, dan `Biaya Lainnya (USD)`.

### C. Grouping Ringkasan Pembayaran (IDR & USD)
Ringkasan Pembayaran dibagi menjadi 2 panel terpisah:
1. **Ringkasan Pembayaran (IDR)**:
   - **Grand Total (IDR)**: `cashFlowDetail.grand_total`
   - **Total Terbayar (IDR)**: Total dari `finance_billings` akun kas IDR
   - **Sisa Pembayaran (IDR)**: `cashFlowDetail.remaining_payment`
2. **Ringkasan Pembayaran (USD)**:
   - **Grand Total (USD)**: `cashFlowDetail.grand_total_usd`
   - **Total Terbayar (USD)**: Total dari `finance_billings` akun kas USD
   - **Sisa Pembayaran (USD)**: `cashFlowDetail.remaining_payment_usd`

---

## 6. Lokasi File Terkait

- [src/@types/kas-harian.types.ts](file:///home/popo/Documents/project/project-wajira/finance-fe/src/@types/kas-harian.types.ts)
- [src/services/cashFlowService.ts](file:///home/popo/Documents/project/project-wajira/finance-fe/src/services/cashFlowService.ts)
- [src/components/features/kas-harian/KasHarianTable.tsx](file:///home/popo/Documents/project/project-wajira/finance-fe/src/components/features/kas-harian/KasHarianTable.tsx)
- [src/pages/dashboard/[slug]/finance/transaksi-kas-harian/index.tsx](file:///home/popo/Documents/project/project-wajira/finance-fe/src/pages/dashboard/%5Bslug%5D/finance/transaksi-kas-harian/index.tsx)
- [src/pages/dashboard/[slug]/finance/transaksi-kas-harian/[id].tsx](file:///home/popo/Documents/project/project-wajira/finance-fe/src/pages/dashboard/%5Bslug%5D/finance/transaksi-kas-harian/%5Bid%5D.tsx)
