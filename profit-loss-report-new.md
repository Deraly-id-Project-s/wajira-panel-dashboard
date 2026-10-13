# Rangkuman Penyesuaian Laporan Laba Rugi (Profit & Loss Report)

Dokumen ini merangkum perubahan yang dilakukan pada modul **Laporan Laba Rugi (Profit & Loss Report)** pada Laravel backend (`project-wajira-backend`).

---

## 1. Penyederhanaan Filter Data (`ProfitLossController@index`)

### Sebelumnya
- Menerima banyak parameter filter query:
  - `category` (`revenue`, `cogs`, `opex`)
  - `date`, `payment_at`
  - `start_date`, `end_date`, `date_from`, `date_to`, `from_date`, `to_date`
  - `account_id`, `account_name`, `account_code`
  - `search` (pencarian teks pada catatan, nominal, saldo, dan cash flow)

### Sesudah
- **Semua filter tambahan dihapus**. Hanya menyisakan:
  - `year` (`nullable|integer|min:2000|max:3000`)
  - `month` (`nullable|string`) — menerima angka bulan `1`..`12` maupun nama bulan (`january`..`december`).
- **Nilai Default**:
  - Jika parameter `year` tidak diisi, otomatis menggunakan tahun berjalan saat ini (`now()->year`).
  - Jika parameter `month` tidak diisi, otomatis menggunakan nama bulan berjalan saat ini dalam huruf kecil (`strtolower(now()->format('F'))`).
- **Kueri Data Transaksi (`FinanceBilling`)**:
  - Difilter secara presisi berdasarkan tahun dan bulan transaksi:
    ```php
    $monthNumber = Carbon::parse("1 {$targetMonth} {$targetYear}")->month;

    $query->whereIn('account_id', $accountIds)
        ->whereYear('payment_at', $targetYear)
        ->whereMonth('payment_at', $monthNumber);
    ```

---

## 2. Implementasi Caching & Auto-Refresh

### A. Mekanisme Cache
- Menggunakan `QueryCacheTrait` (`rememberCache`) dengan masa berlaku 1 jam (3600 detik).
- **Format Cache Key**:
  ```
  profit_loss_{company_id}_{year}_{month}
  ```
- **Cache Group**:
  ```
  profit_loss_{company_id}
  ```

### B. Auto-Refresh / Invalidation Cache
Cache otomatis dibersihkan (`clearCacheGroup`) saat terjadi perubahan data:
1. **Controller Mutations (`ProfitLossController`)**:
   - `createYear`: saat menambahkan konfigurasi tahun baru.
   - `updateYear`: saat memperbarui konfigurasi akun/pajak tahunan.
   - `destroyYear`: saat menghapus konfigurasi tahun.
   - `update`: saat memperbarui konfigurasi via endpoint backward-compatible.
2. **Model Observers/Hooks (`booted` method)**:
   - `ProfitLossTemplateYear`: hook `saved` dan `deleted` membersihkan cache grup `profit_loss_{company_id}`.
   - `FinanceBilling`: hook `saved` dan `deleted` membersihkan cache grup `profit_loss_{company_id}` setiap kali ada penagihan / transaksi kas baru yang dibuat atau diubah.

---

## 3. Penyesuaian Ekspor Excel (`ProfitLossReportExport`)
- Menyelaraskan filter ekspor data laba rugi ke Excel agar konsisten dengan `ProfitLossController`:
  - Hanya menerima filter `year` dan `month`.
  - Default ke tahun dan bulan saat ini jika tidak disediakan.
  - Memfilter transaksi `FinanceBilling` dengan `whereYear` dan `whereMonth`.

---

## 4. Daftar Berkas yang Diubah

| Berkas | Deskripsi Perubahan |
|---|---|
| [`app/Http/Controllers/Report/ProfitLossController.php`](file:///home/popo/Documents/project/project-wajira/project-wajira/project-wajira-backend/app/Http/Controllers/Report/ProfitLossController.php) | Menghilangkan semua filter kecuali `year` & `month`, menyetel default ke bulan & tahun saat ini, menambahkan caching dan invalidation. |
| [`app/Exports/ProfitLossReportExport.php`](file:///home/popo/Documents/project/project-wajira/project-wajira/project-wajira-backend/app/Exports/ProfitLossReportExport.php) | Menyelaraskan filter ekspor hanya menggunakan `year` dan `month` (default tahun dan bulan saat ini). |
| [`app/Models/ProfitLossTemplateYear.php`](file:///home/popo/Documents/project/project-wajira/project-wajira/project-wajira-backend/app/Models/ProfitLossTemplateYear.php) | Menambahkan hook `saved` & `deleted` untuk membersihkan cache laporan saat template diubah. |
| [`app/Models/FinanceBilling.php`](file:///home/popo/Documents/project/project-wajira/project-wajira/project-wajira-backend/app/Models/FinanceBilling.php) | Menambahkan hook `saved` & `deleted` untuk membersihkan cache laporan saat transaksi penagihan diubah. |
