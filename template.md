# Template Acuan Standardisasi Desain Halaman

Berikut adalah acuan visual premium (margin, alignment, header, filter, controls, table, dan buttons) yang **wajib** dipatuhi di seluruh halaman modul.

> Referensi utama: `AccountListPage.tsx` dan `AccountGroupListPage.tsx`

---

## 1. Root Container Page (Menghindari Double Padding)

**Aturan**: Halaman anak yang dibungkus `DashboardLayout` tidak boleh mendefinisikan padding internal ganda (`p-6`, `grid grid-cols-1`, `bg-white min-h-screen`, dll).

```tsx
return (
  <DashboardLayout>
    <Head>...</Head>
    <div className="space-y-6">
      {/* Konten Halaman */}
    </div>
  </DashboardLayout>
)
```

---

## 2. Typography & Alignment Header Halaman

**Aturan**: Gunakan flex container `items-center justify-between`. H1 dan subheader berada dalam `<div>` tersendiri di kiri.

- **H1**: `text-2xl font-semibold` (tanpa color override — pakai default)
- **Subheader `<p>`**: `text-sm text-muted-foreground`

```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold">Judul Halaman</h1>
    <p className="text-sm text-muted-foreground">Deskripsi singkat halaman</p>
  </div>
  {/* Tombol Aksi di Kanan (jika ada) */}
</div>
```

---

## 2.1 Standarisasi Header Halaman (PageHeader)

**Aturan**: Untuk seluruh halaman **Detail, Create, Edit, dan Payment** (terutama di dalam modul Transaksi/Administrasi), **WAJIB** menggunakan komponen `PageHeader` (`src/components/ui/page-header.tsx`) menggantikan struktur HTML manual. Komponen ini sudah mengatur layout flex, spacing, dan styling responsif secara seragam.

**Komponen `PageHeader` memiliki properti berikut:**
- `breadcrumbs`: Array navigasi (opsional). Elemen terakhir akan dirender sebagai teks tebal.
- `onBack`: Fungsi tombol kembali. Jika diisi, tombol `ArrowLeft` akan muncul otomatis.
- `title`: Judul utama halaman (string atau ReactNode).
- `subtitle`: Subjudul atau Metadata khusus (contoh: Kode Unik Transaksi, Badge Status).
- `actions`: Kumpulan komponen tombol (seperti Bayar, Edit, Print) diletakkan di sisi kanan.

**Contoh Penggunaan:**
```tsx
import { PageHeader } from '@/components/ui/page-header';

<PageHeader
  breadcrumbs={[
    { label: 'Pembelian Unit', onClick: () => router.push('/...') },
    { label: 'Detail Pembelian' }
  ]}
  onBack={() => router.push('/...')}
  title="Data Pembelian"
  subtitle={
    <>
      <span>Kode Beli:</span>
      <span className="text-blue-600 font-semibold">PBL-001</span>
      <Badge variant="outline">Lunas</Badge>
    </>
  }
  actions={
    <>
      <Button variant="outline">Print</Button>
      <Button>Terima Barang</Button>
    </>
  }
/>
```

---

## 3. Tombol Kembali Halaman Detail (Back Button)

**Aturan**: Gunakan komponen `<Button>` variant ghost, size icon, `rounded-md`, border `border-slate-200`, ikon `ArrowLeft` dari `lucide-react`.

```tsx
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

<Button
  variant="ghost"
  size="icon"
  onClick={handleBack}
  className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
>
  <ArrowLeft className="h-5 w-5 text-slate-700" />
</Button>
```

---

## 4. Layout Toolbar & Table (Wrapper `space-y-4`)

**Aturan**: Toolbar filter dan tabel dibungkus dalam satu `<div className="space-y-4">`. Ini menghasilkan margin **16px** antara toolbar dan tabel — sesuai standar Master Data.

```tsx
<div className="space-y-4">
  {/* Toolbar Filter */}
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
    ...
  </div>

  {/* Data Table */}
  <div className="rounded-md border border-gray-200 bg-white overflow-hidden shadow-none">
    ...
  </div>
</div>
```

> ⚠️ **JANGAN** bungkus toolbar dalam Card dengan `bg-white p-4 border`. Toolbar harus transparan — hanya input/button yang punya background & border.

---

## 5. Toolbar Filter Layout

**Aturan Urutan Cascading Filters (Kiri)**:
1. **Search Bar**: Selalu diletakkan paling awal (sebelah kiri).
2. **Filter Dropdowns / Combobox / DatePicker**: Filter tambahan seperti Kategori, Tipe, Wilayah, Supplier, atau Tanggal diletakkan setelah Search Bar.
3. **Dropdown Pagination (`Show per Page`)**: Selalu diletakkan di bagian paling akhir dari grup filter sebelah kiri.

**Aturan Margin & Spacing Buttons**:
- Gunakan flex container dengan `gap-2` untuk menata tombol aksi (Export, Import, Tambah, Print, dll.) agar memiliki margin yang konsisten dan rapi.
- Gunakan kelas `w-full sm:w-auto` pada tombol aksi agar responsif.

```tsx
<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
  {/* KIRI: Search + Show */}
  <div className="flex items-center gap-4 w-full sm:w-auto">
    {/* Search Input */}
    <div className="relative w-full sm:w-[300px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search here"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-9 bg-white"
      />
    </div>

    {/* Show per Page */}
    <div className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
      <span>Show</span>
      <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
        <SelectTrigger className="w-[70px] bg-white">
          <SelectValue placeholder="25" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="25">25</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
      <span>Page</span>
    </div>
  </div>

  {/* KANAN: Action Buttons */}
  <div className="flex flex-wrap items-center gap-2">
    <Button variant="outline" className="w-full sm:w-auto">
      <Upload className="h-4 w-4 mr-2" />
      Export
    </Button>
    <Button className="button-theme-1!">
      <Plus className="h-4 w-4 mr-2" />
      Tambah
    </Button>
  </div>
</div>
```

---

## 6. Input & Control Elements

> ⚠️ **CATATAN**: Jangan gunakan `rounded-md` pada Search Input, SelectTrigger pagination, dan DatePickerWithRange. `rounded-md` hanya untuk *action buttons* dan back button.

### Search Input
```tsx
<div className="relative w-full sm:w-[300px]">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
  <Input
    placeholder="Search here"
    className="pl-9 bg-white"
  />
</div>
```

### Select Trigger (pagination)
```tsx
<SelectTrigger className="w-[70px] bg-white">
  <SelectValue />
</SelectTrigger>
```

### DatePickerWithRange
```tsx
<DatePickerWithRange
  className="w-[240px]"
  date={dateRange}
  onChange={...}
/>
```

---

## 7. Data Table Wrapper

**Aturan**: Tabel dibungkus dalam `<div>` dengan `rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none`.

```tsx
<div className="rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none">
  <Table>
    <TableHeader className="bg-[#f8f9fa] border-b border-gray-200">
      <TableRow className="hover:bg-[#f8f9fa]">
        <TableHead className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-500">
          NAMA KOLOM
        </TableHead>
        {/* ... */}
        <TableHead className="w-[80px] px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase">
          ACTION
        </TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      <TableRow className="hover:bg-gray-50 transition-colors">
        <TableCell className="px-4 py-4 text-sm text-gray-900">
          {/* data */}
        </TableCell>
        {/* ... */}
        <TableCell className="px-4 py-4 text-center sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]">
          {/* Action dropdown */}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

**Standar padding cell**: `px-4 py-4` di semua `TableHead` dan `TableCell`.

### Standar Perataan Sel Tabel (Cell Alignment)

- **Rata Tengah (`text-center` / `'center'`)**:
  - **Angka Format Uang / Nominal**: Semua kolom mata uang/nominal (Bruto, HPP, DPP, PPN, Total Beli, Total Jual, Biaya BBN, Biaya Ekspedisi, Biaya Lain, dll.).
  - **Kuantitas / Qty**: Kolom jumlah unit/barang (Qty, Qty Beli, Qty Terima, Qty Kirim, Kurang, dll.).
  - **Tanggal**: Semua kolom tanggal (Tgl Jual, Tgl Beli, Tgl Terima, Tgl Kirim, dll.).
  - **Status / Billing**: Label status pembayaran (Lunas, Belum Lunas, Refund, dll.) dan badge status unit.
  - **Aksi / Action**: Kolom tombol aksi/dropdown action.

- **Rata Kiri (`text-left` / `'left'`)**:
  - **Kode Transaksi**: Kolom kode unik (No Penjualan, No Pembelian, No Penerimaan, No Pengiriman, dll.).
  - **Nama Entitas**: Nama Customer, Nama Supplier, PIC, dll.
  - **Deskripsi / Keterangan**: Tipe Unit, Nama Barang, Alamat, Keterangan Kas, dll.

### Standarisasi Kolom Aksi (Sticky Fixed)

Untuk memastikan tombol aksi selalu terlihat di berbagai ukuran layar (terutama responsif), **wajib** menerapkan pola *sticky* pada kolom "Action" (selalu di kanan) dengan ketentuan:

1. **Table Container**: Kontainer pembungkus tabel wajib menggunakan `overflow-x-auto` (bukan `overflow-hidden`) agar dapat digeser horizontal tanpa memotong efek *sticky*.
2. **Table Head (Th)**: Kolom header action wajib menggunakan class: 
   `sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]`
3. **Table Cell (Td)**: Kolom cell action wajib menggunakan class:
   `sticky right-0 bg-white z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]`

---

## 8. Action Dropdown Menu

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
    <DropdownMenuItem className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
      <Eye className="mr-2 h-4 w-4" /> Detail
    </DropdownMenuItem>
    <DropdownMenuItem className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
      <Pencil className="mr-2 h-4 w-4" /> Edit
    </DropdownMenuItem>
    <DropdownMenuItem className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
      <Trash2 className="mr-2 h-4 w-4" /> Hapus
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 9. Pagination

**Aturan**: Pagination berada di bawah tabel, dalam wrapper `space-y-4` yang sama. Layout flex column → row di breakpoint `lg`.

**Standar Show Table Row / Per Page**:
- Semua tabel wajib menggunakan opsi show per page: 25, 50, dan 100.
- Default show per page adalah 25.
- Tidak boleh menggunakan opsi lain di luar 25, 50, dan 100.
- Perubahan show per page harus melakukan fetch ulang data tabel.
- Pagination wajib tetap konsisten setelah perubahan show per page.

```tsx
<div className="flex flex-col gap-4 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
  <p>Showing {start}-{end} of {total} data</p>

  <div className="flex flex-wrap items-center justify-end gap-1 text-slate-800">
    {/* Previous */}
    <Button
      variant="ghost" size="sm"
      className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
      disabled={page <= 1}
      onClick={() => onPageChange(page - 1)}
    >
      Previous
    </Button>

    {/* Page Numbers */}
    {visiblePages.map((pageNumber) => (
      <Button
        key={pageNumber}
        variant="ghost" size="sm"
        className={cn(
          'h-9 min-w-9 rounded-md border px-3 text-sm font-medium shadow-none',
          pageNumber === page
            ? 'border-slate-200 bg-white text-slate-950 shadow-sm'
            : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white',
        )}
        onClick={() => onPageChange(pageNumber)}
      >
        {pageNumber}
      </Button>
    ))}

    {/* Next */}
    <Button
      variant="ghost" size="sm"
      className="h-9 rounded-md px-2 text-sm font-medium hover:bg-transparent disabled:text-slate-300"
      disabled={page >= totalPages}
      onClick={() => onPageChange(page + 1)}
    >
      Next
    </Button>
  </div>
</div>
```

---

## 10. Action Buttons (Tambah, Simpan, Export, Import)

**Aturan**: Seluruh tombol aksi utama (Primary Action) wajib menggunakan class terpadu `button-theme-1!` untuk standardisasi tema warna. Class ini secara bawaan sudah mencakup responsivitas `w-full sm:w-auto`, teks putih, font-medium, dan shadow, sehingga atribut-atribut redundant tersebut tidak perlu ditulis manual lagi.

```tsx
{/* Aksi Utama (Tambah, Simpan, dsb) */}
<Button className="button-theme-1!">
  <Plus className="h-4 w-4 mr-2" />
  Tambah
</Button>

{/* Export / Import / Download / Print */}
<Button variant="outline" className="w-full sm:w-auto">
  <Upload className="h-4 w-4 mr-2" />
  Export
</Button>

<Button variant="outline" className="w-full sm:w-auto">
  <Download className="h-4 w-4 mr-2" />
  Download
</Button>

<Button variant="outline" className="w-full sm:w-auto">
  <Printer className="h-4 w-4 mr-2" />
  Print
</Button>
```

---

## 11. Format Tanggal

**Standar Format Tanggal**:
- Semua tampilan tanggal pada UI wajib menggunakan format: `DD Nama Bulan YYYY`.
- Contoh format tanggal: `03 Juli 2026`.
- Nama bulan wajib menggunakan Bahasa Indonesia.
- Format untuk payload API boleh mengikuti kebutuhan backend, misalnya `YYYY-MM-DD`.
- Format mentah dari API tidak boleh langsung ditampilkan ke user.
- Gunakan helper / utility date formatter (`formatDateUI` dari `src/lib/utils/date.ts`) agar format tanggal konsisten di seluruh aplikasi.

**Bug Fix Notes**:
- `DatePickerWithRange` mendukung prop `placeholder` opsional. Default: `"Pilih rentang tanggal"`.
- `DatePicker` default placeholder: `"Pilih tanggal"`.
- **Jangan** gunakan placeholder bahasa Inggris: `"Pick a date"`, `"Select date"`, `"Pick a date range"`.

---

## 12. Tabs Component Standard (Premium Pill Style)

**Aturan**: Gunakan flex container untuk membungkus `TabsList`. Triggers menggunakan visual pill dengan latar belakang abu-abu tipis dan status aktif berlatar belakang putih bersih dengan bayangan halus.

```tsx
<Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
  {/* Tab triggers wrapped to look like pills */}
  <div className="flex no-print">
    <TabsList className="flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md">
      <TabsTrigger 
        value="per-nota" 
        className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
      >
        Laporan Pembelian Per Nota
      </TabsTrigger>
      <TabsTrigger 
        value="per-tipe" 
        className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
      >
        Laporan Pembelian Per Tipe
      </TabsTrigger>
      <TabsTrigger 
        value="per-supplier" 
        className="rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
      >
        Laporan Pembelian Per Supplier
      </TabsTrigger>
    </TabsList>
  </div>

  <TabsContent value="per-nota" className="mt-0">
    {/* Konten Tab */}
  </TabsContent>
</Tabs>
```

---

## Ringkasan Kelas Kunci

| Elemen | Kelas |
|--------|-------|
| Root wrapper | `space-y-6` |
| Toolbar ↔ Table gap | `space-y-4` (wrapper) |
| H1 | `text-2xl font-semibold` |
| Subheader | `text-sm text-muted-foreground` |
| TabsList (Pills) | `flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md` |
| TabsTrigger (Pills) | `rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm` |
| Search Input | `pl-9 bg-white` |
| Select pagination | `w-[70px] bg-white` |
| Table wrapper | `rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none` |
| TableHeader | `bg-[#f8f9fa] border-b border-gray-200` |
| TableHead / Cell | `px-4 py-4` |
| Sticky Action Head | `sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]` |
| Sticky Action Cell | `sticky right-0 bg-white z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]` |
| TableRow hover | `hover:bg-gray-50 transition-colors` |
| Pagination btn | `h-9 rounded-md` |
| Pagination active | `border-slate-200 bg-white text-slate-950 shadow-sm` |
| Action trigger | `h-8 w-8 rounded-full` |
| DropdownMenuContent | `rounded-md border-slate-200 p-1.5 shadow-lg` |
| DropdownMenuItem | `rounded-lg px-3 py-2` |
---
| Tambah button | `button-theme-1!` |

---

## 13. Standarisasi Layout Print A4 (Letterhead & Single Page)

**Aturan**: Untuk halaman cetak surat/nota resmi (A4 dengan background kop surat), ikuti spesifikasi berikut agar layout presisi 1 halaman dan tidak menghasilkan halaman kosong tambahan:

1. **Gunakan Class `.print-letter-page`**: Tempelkan class `.print-letter-page` pada div halaman A4 utama agar terintegrasi dengan visibilitas global dan pemotongan halaman (`overflow: hidden`).
2. **Kop Surat (Background Image)**: Render background image kop surat menggunakan tag `<img>` absolut tanpa class `.print-letterhead` agar kop surat tetap terlihat baik di layar web (screen preview) maupun saat dicetak (print layout).
3. **Konfigurasi Ref**: Pastikan `printRef` dipasang langsung di elemen kertas utama (lebar `210mm` dan tinggi minimal `297mm`), bukan di wrapper luarnya.
4. **Perataan Sel Tabel (Cell Alignment) dan Tata Letak (Layouting)**:
   - Kolom Nominal/Uang (Harga, DPP, PPN, Total): wajib Rata Tengah (`text-center` / `align: 'center'`).
   - Tabel responsif (e.g. `BaseTable`) cenderung memiliki lebar `w-max` yang dapat merusak batasan kertas saat dicetak. Wajib menempelkan `print:w-full print:table-fixed` pada elemen `<Table>`.
5. **Navigasi Tombol Aksi Print**: Tombol aksi print pada baris tabel (Action Dropdown) wajib membuka halaman print khusus di tab baru menggunakan `window.open` ke path `/dashboard/[slug]/[modul]/print/[id]`.

### Contoh Dropdown Action Print:

```tsx
<DropdownMenuItem 
  onClick={() => window.open(`/dashboard/${slug}/transaksi/pembelian-unit/print/${item.id}`, '_blank')}
>
  Print
</DropdownMenuItem>
```

### Struktur Kode Contoh:

```tsx
// Di Halaman Page (Trigger)
const printRef = React.useRef<HTMLDivElement>(null);
const handlePrint = useReactToPrint({
  contentRef: printRef,
  documentTitle: 'PurchaseOrder',
  pageStyle: `
    @page { size: A4; margin: 0; }
    @media print {
      html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  `,
});

// Render Component Dokumen Utama
<div 
  ref={printRef} 
  className="relative mx-auto overflow-hidden bg-white shadow-md border print-letter-page"
  style={{ width: '210mm', minHeight: '297mm' }}
>
  {/* Kop Surat */}
  <img src={letterheadUrl} className="absolute inset-0 h-full w-full object-cover" />
  
  {/* Konten Halaman */}
  <div className="relative min-h-[297mm] px-[20mm] pt-[42mm] pb-[42mm]">
    {/* Tabel Rata Tengah untuk Nominal */}
    <table className="w-full text-[8.5pt]">
      <thead>
        <tr className="bg-[#1f4163] text-white">
          <th className="text-center">NO</th>
          <th className="text-left">DESKRIPSI</th>
          <th className="text-center">HARGA</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="text-center">1</td>
          <td className="text-left">Tipe Unit A</td>
          <td className="text-center">Rp17.000.000</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## 14. Standar Search Data

- Semua fitur search pada tabel wajib menggunakan placeholder yang jelas sesuai konteks data yang dapat dicari.
- Search harus mencari data berdasarkan field yang relevan dengan kebutuhan user, bukan hanya berdasarkan satu field default.
- Jika halaman memiliki kebutuhan search spesifik, seperti pencarian berdasarkan No. Rangka atau No. Mesin, maka logic search wajib mendukung field tersebut.
- Search tidak boleh hanya menggunakan field yang tidak sesuai dengan kebutuhan user, misalnya hanya mencari berdasarkan Warehouse ketika user membutuhkan pencarian berdasarkan Detail Unit.
- Search wajib tetap kompatibel dengan pagination, show table row / per page, filter, sorting, dan refresh data.
- Ketika keyword search dikosongkan, tabel wajib kembali menampilkan data default.
- Jika data tidak ditemukan, tampilkan empty state yang jelas dan mudah dipahami user.
- Jika terjadi error saat search, tampilkan pesan error yang ramah dan tidak teknis.
- Gunakan komponen search yang konsisten sesuai Pattern UI Style aplikasi.

---

## 15. Standar Penampilan Kolom Biaya Ekspedisi pada Tabel Transaksi

- Jika endpoint sudah menyediakan field biaya ekspedisi, maka data tersebut harus dapat ditampilkan pada tabel utama agar user tidak selalu perlu masuk ke halaman detail.
- Pada halaman Pembelian Unit, kolom Biaya Ekspedisi wajib menggunakan field `expedition_fee_total`.
- Kolom Biaya Ekspedisi harus ditampilkan dengan format currency / Rupiah yang konsisten.
- Jika nilai biaya ekspedisi kosong, null, atau undefined, gunakan fallback tampilan yang rapi sesuai standar project.
- Penambahan kolom baru tidak boleh membuat data kolom lain tertukar.
- Penambahan kolom baru harus tetap menjaga konsistensi layout tabel, responsiveness, pagination, filter, search, dan action table.
- Setiap penambahan kolom pada tabel transaksi wajib mengikuti Pattern UI Style yang tercantum di `template.md`.

---

## 16. Standar Card Pembelian dan Penjualan Unit

### Card Detail Transaksi (Pembelian / Penjualan)

Card Detail Transaksi digunakan untuk menampilkan ringkasan nilai transaksi unit berdasarkan total DPP, total PPN, total HPP, total biaya, dan total transaksi (pembelian/penjualan).

Urutan data wajib:
1. Total DPP
2. Total PPN
3. Total HPP
4. Total Biaya
5. TOTAL PEMBELIAN / TOTAL PENJUALAN

Ketentuan:
- Total HPP ditampilkan dengan font lebih tebal.
- TOTAL PEMBELIAN / TOTAL PENJUALAN ditampilkan menggunakan huruf kapital dan nominal tebal.
- Gunakan divider untuk memisahkan bagian perhitungan utama.
- Seluruh nominal wajib menggunakan format Rupiah.
- Data tidak boleh hardcode dan harus berasal dari endpoint API real.
- Jika field total belum tersedia dari API, frontend boleh melakukan kalkulasi berdasarkan data detail transaksi.

### Card Rincian Nilai

Card Rincian Nilai digunakan untuk menampilkan rincian nilai DPP, PPN, total transaksi, dan kurang bayar.

Urutan data wajib:
1. DPP
2. PPN
3. TOTAL PEMBELIAN / TOTAL PENJUALAN
4. KURANG BAYAR

Ketentuan:
- TOTAL PEMBELIAN / TOTAL PENJUALAN ditampilkan menggunakan huruf kapital dan nominal tebal.
- KURANG BAYAR wajib menggunakan warna merah dan nominal tebal.
- Seluruh nominal wajib menggunakan format Rupiah.
- Data tidak boleh hardcode dan harus berasal dari endpoint API real.
- Jika field total belum tersedia dari API, frontend boleh melakukan kalkulasi berdasarkan data detail transaksi.

### Ketentuan Styling Card

- Font, ukuran teks, ketebalan teks, warna, spacing, padding, border radius, icon, divider, dan layout card wajib mengikuti Pattern UI Style pada `template.md`.
- Card harus konsisten dengan card transaksi lain pada sistem.

---

## Ringkasan Kelas Kunci

| Elemen | Kelas |
|--------|-------|
| Root wrapper | `space-y-6` |
| Toolbar ↔ Table gap | `space-y-4` (wrapper) |
| H1 | `text-2xl font-semibold` |
| Subheader | `text-sm text-muted-foreground` |
| TabsList (Pills) | `flex h-auto p-1 bg-gray-50 border border-gray-100 rounded-md` |
| TabsTrigger (Pills) | `rounded-lg px-6 py-2.5 text-[14px] font-medium data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm` |
| Search Input | `pl-9 bg-white` |
| Select pagination | `w-[70px] bg-white` |
| Table wrapper | `rounded-md border border-gray-200 bg-white overflow-x-auto shadow-none` |
| TableHeader | `bg-[#f8f9fa] border-b border-gray-200` |
| TableHead / Cell | `px-4 py-4` |
| Sticky Action Head | `sticky right-0 bg-[#f8f9fa] z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]` |
| Sticky Action Cell | `sticky right-0 bg-white z-10 border-l border-slate-200 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.05)]` |
| TableRow hover | `hover:bg-gray-50 transition-colors` |
| Pagination btn | `h-9 rounded-md` |
| Pagination active | `border-slate-200 bg-white text-slate-950 shadow-sm` |
| Action trigger | `h-8 w-8 rounded-full` |
| DropdownMenuContent | `rounded-md border-slate-200 p-1.5 shadow-lg` |
| DropdownMenuItem | `rounded-lg px-3 py-2` |
| Back button | `h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50` |
| Tambah button | `button-theme-1!` |
| Container Cetak A4 | `print-letter-page` |
| Background Kop Surat | `print-letterhead` |

---

## Standar Form Pembelian Unit

Form Pembelian Unit digunakan untuk menginput data transaksi pembelian unit, termasuk biaya, harga satuan, dan total harga.

### Sub Form Biaya

Urutan field wajib:
1. Biaya BBN
2. Biaya Ekspedisi
3. Biaya Lain

Ketentuan:
- Field biaya ditampilkan dalam satu baris dengan layout tiga kolom jika ruang layar mencukupi.
- Semua field biaya wajib menggunakan format currency / Rupiah.
- Field biaya harus berada di bawah bagian input QTY dan Harga sesuai struktur form transaksi.
- Mapping data tidak boleh tertukar antara Biaya BBN, Biaya Ekspedisi, dan Biaya Lain.

### Sub Form Harga

Urutan field wajib:
1. HPP Satuan
2. DPP Satuan
3. PPN Satuan

Ketentuan:
- Semua field harga satuan wajib menggunakan format currency / Rupiah.
- Field harga satuan harus tetap mengikuti mapping data transaksi pembelian unit.
- Jika nilai dihitung otomatis, pastikan hasil kalkulasi tetap tampil rapi.

### Sub Form Total Harga

Urutan field wajib:
1. HPP Total
2. DPP Total
3. PPN Total

Ketentuan:
- Semua field total harga wajib menggunakan format currency / Rupiah.
- Nilai total tidak boleh menampilkan NaN, undefined, atau format kosong yang tidak rapi.
- Jika data belum tersedia, gunakan fallback sesuai standar project.

### Ketentuan Styling Form

- Font, ukuran teks, ketebalan teks, warna, spacing, padding, border radius, input, label, divider, dan layout wajib mengikuti Pattern UI Style pada `template.md`.
- Struktur Form Pembelian Unit ini dapat dijadikan acuan untuk implementasi Form Penjualan Unit agar tampilan antar fitur transaksi tetap konsisten.

---

## 17. Standar Copy to Clipboard pada Tabel (Kode / Nomor Transaksi)

Semua nomor unik (contoh: KODE BELI, NO INVOICE, NO BUKTI POTONG, NOTA REFF, dsb) yang panjang dan sering disalin oleh *user* **wajib** menggunakan komponen `<CopyBox>` agar menyediakan fitur penyalinanotomatis (*Copy to Clipboard*) ketika di-klik.

Ketentuan:
- Gunakan komponen `@/components/ui/copy-box`.
- Komponen ini tidak perlu dibungkus warna atau background yang mencolok; ia sudah memiliki *styling* transparan yang memukau (tersedia ikon copy & animasinya pada hover).
- Apabila data tidak ada (`null` atau empty string), berikan *fallback* misal `'-'`.
- **Mode Cetak (Print View)**: Karena teks kode/invoice sangat panjang dan tidak berspasi, komponen ini wajib dikonfigurasi dengan kelas agresif (`print:block print:w-full print:whitespace-normal` pada kontainer, dan `print:break-all print:whitespace-pre-wrap print:p-0 print:border-none print:bg-transparent` pada isi teks, serta `print:hidden` pada tombol copy). Ini memastikan teks terlipat rapi dan tidak tumpang tindih ke kolom lain ketika halaman dicetak di ukuran A4.

```tsx
import { CopyBox } from '@/components/ui/copy-box';

// Contoh Implementasi pada TableCell
<td className="px-4 py-4 text-left text-sm font-medium text-slate-900">
  <CopyBox text={item.invoice_number || '-'} />
</td>
```

---

## 18. Standarisasi Indikator Loading (Loading State)

Untuk menyeragamkan tampilan UI/UX saat proses pengambilan data (fetching/loading), **wajib** menggunakan komponen `<LoadingState />` (`src/components/ui/loading-state.tsx`) di seluruh aplikasi (Halaman, Tabel, Form, Button).

**Tujuan**:
- Menghindari kode *boilerplate* merender `<Loader2>` secara manual berulang kali.
- Menjaga konsistensi jarak (*padding*, *margin*, dan *alignment*) dan transisi *layout* di seluruh menu aplikasi Wajira.
- Memberikan fleksibilitas pada berbagai konteks loading (Halaman Penuh, Bagian Kecil, atau Teks Searah).

> 🚫 **PERINGATAN KERAS**: 
> **DILARANG KERAS** menggunakan custom string loading secara manual seperti: 
> `<div className="text-center">Loading...</div>` atau `<div className="p-10">Memuat data...</div>`. 
> Segala bentuk aktivitas *loading state* (baik itu table, page, atau button) **WAJIB** menggunakan `<LoadingState />` yang telah disediakan, tanpa terkecuali, agar UI tidak terlihat "belang" dan tetap terstandarisasi.

**Aturan Penggunaan Variant:**

1. **`variant="page"` (Default)**
   Digunakan sebagai pengganti loading saat memuat keseluruhan *page* (misalnya di halaman index atau halaman detail). Variant ini mengamankan tinggi minimum (`50vh`) agar footer/layout tidak lompat (*layout shift*).
   ```tsx
   import { LoadingState } from '@/components/ui/loading-state';

   if (isLoading) {
     return (
       <DashboardLayout>
         <LoadingState variant="page" />
       </DashboardLayout>
     );
   }
   ```

2. **`variant="section"`**
   Digunakan untuk memuat bagian tertentu dari halaman yang berukuran kecil atau menengah, misalnya saat memuat isi Card, daftar dropdown, atau modal. Variant ini memiliki padding vertikal moderat (`py-10`).
   ```tsx
   <Card>
     <CardContent>
       {isDataLoading ? <LoadingState variant="section" /> : <DataTampil />}
     </CardContent>
   </Card>
   ```

3. **`variant="inline"`**
   Digunakan untuk loading berukuran kecil yang letaknya berdampingan dengan teks atau aksi (*inline flex*). Cocok untuk tombol aksi atau label indikator asinkron.
   ```tsx
   <Button disabled={isSubmitting}>
     {isSubmitting ? <LoadingState variant="inline" text="Menyimpan..." iconClassName="text-white" /> : "Simpan"}
   </Button>
   ```

4. **`variant="fullscreen"`**
   Digunakan apabila terdapat aksi krusial berdurasi lama (misal: Submit Laporan Besar, Upload File) yang mewajibkan seluruh layar terkunci dengan *backdrop blur*.

**Catatan Kustomisasi:**
- Teks default adalah `"Memuat data..."`. Anda dapat menggantinya menggunakan props `text="Sedang sinkronisasi..."`.
- Jika Anda tidak menginginkan teks sama sekali, cukup lewatkan prop `text={null}`.
- Prop `iconClassName` berguna jika Anda ingin mengubah warna loading indicator pada background gelap (contoh: `text-white`).

---

## 19. Standar Frontend Logic & React Query (Data Fetching, Search, Sort, Export)

Selain standar UI visual, wajib mematuhi panduan implementasi fungsional berikut agar performa dan pengalaman pengguna *(User Experience)* seragam.

### A. Live Search (Debouncing)
Pencarian list data tidak boleh me-request API di setiap ketikan keyboard *(keystroke)* agar tidak *spamming* server. Gunakan `setTimeout` debounce standard **400ms**.

```tsx
const [searchInput, setSearchInput] = useState(''); // Untuk binding Input UI
const [searchValue, setSearchValue] = useState(''); // Untuk parameter API (trigger fetch)

useEffect(() => {
  const timeout = window.setTimeout(() => {
    setSearchValue(searchInput.trim());
    setPage(1); // Reset paginasi ke awal saat mengubah keyword
  }, 400);
  return () => window.clearTimeout(timeout);
}, [searchInput]);
```

### B. Indikator Loading pada Sorting & Paginasi (isFetching)
*React Query* memertahankan data lama *(placeholder)* ketika parameter (page/sort) berubah sehingga variabel `isLoading` bernilai `false`. Agar Loader UI tabel tetap berkedip/muncul merespon klik pengguna, selalu gunakan atau gabungkan dengan flag `isFetching`.

```tsx
const { data, isLoading: isInitialLoading, isFetching } = useResource({ page, order_by });

// Gabungkan untuk memunculkan tabel Loading UI secara konsisten:
const isLoading = isInitialLoading || isFetching;

<TableComponent isLoading={isLoading} />
```

### C. Client-Side Export Data Transaksi (CSV)
Setiap halaman CRUD/Laporan yang menampilkan tabel berfitur *Export* standar ke bentuk `.csv` (Jika *backend* tidak menyediakan endpoint export khusus), dapat menggunakan fitur eksport *Blob* di browser.

```tsx
const handleExport = () => {
  const tableData = data?.data;
  if (!tableData || tableData.length === 0) {
    toast.error('Tidak ada data untuk diexport');
    return;
  }

  // Definisikan header dan urutan map datanya
  const headers = ['No Invoice', 'Nominal', 'Tanggal Dibuat'];
  const rows = tableData.map((item) => [
    item.no_invoice || '-',
    item.amount || '0',
    item.created_at || '-'
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `data-laporan-page-${page}.csv`;
  link.click();
  window.URL.revokeObjectURL(url); // Hapus memori buffer
};
```

### D. Paginasi & Show Per Page (Race Condition Prevention)
Ketika mengubah *limit* data (*Show Per Page*) menggunakan `setPerPage` dari custom hook (misal: `useQueryParamsTable`), **JANGAN** memanggil `setPage(1)` secara berurutan.

Hook `useQueryParamsTable` sudah mengatur ulang parameter `page: 1` secara otomatis saat `setPerPage` dipanggil. Karena router Next.js beroperasi secara asinkron, memanggil `setPage(1)` tepat setelah `setPerPage(val)` akan menghasilkan **race condition** di mana limit per halaman batal berubah (karena ditimpa).

**❌ SALAH:**
```tsx
<Select onValueChange={(val) => { 
  setPerPage(Number(val)); 
  setPage(1); // Memicu race condition!
}}>
```

**✅ BENAR:**
```tsx
<Select onValueChange={(val) => setPerPage(Number(val))}>
```

---

## 19. Standarisasi Tabel Multi-Tab dengan BaseTable (Dynamic Columns)

**Aturan**: Ketika sebuah halaman laporan atau modul memiliki beberapa tab yang menampilkan jenis data serupa tetapi dengan beberapa kolom spesifik yang berbeda (misal: Tab BPKB, STNK, TNKB), **JANGAN** membuat elemen `<Table>` (atau `BaseTable`) terpisah secara manual untuk setiap tab, karena hal ini menghasilkan kode markup yang sangat berlebihan (bloat) dan rentan terhadap inkonsistensi layout (khususnya padding, sorting, dan aksi).

Sebagai gantinya, gunakan **Satu instance `BaseTable`** dengan pola **Dynamic Columns** di mana kita memanfaatkan *spread operator* `...` dan `conditional statement` berdasarkan `activeTab` di dalam array konfigurasi kolom.

### Contoh Pola Dynamic Columns:

```tsx
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

// State Tab yang Sedang Aktif
const [activeTab, setActiveTab] = useState<'bpkb' | 'stnk'>('bpkb');

// Konfigurasi Kolom Dinamis (Merespon perubahan activeTab)
const columns: ColumnDef<any>[] = [
  {
    header: 'NO',
    id: 'no',
    alignment: 'center',
    cell: (_, idx) => <span className="font-medium text-slate-500">{idx + 1 + (page - 1) * perPage}</span>,
  },
  {
    header: `NAMA ${activeTab.toUpperCase()}`,
    accessorKey: 'nama',
    sortable: true,
    cell: (item) => <span className="font-semibold text-gray-900 whitespace-nowrap">{item.nama || '-'}</span>,
  },
  // Kolom hanya muncul saat Tab BPKB
  ...(activeTab === 'bpkb' ? [{
    header: 'NOMOR BPKB',
    accessorKey: 'bpkb_number',
    sortable: true,
    cell: (item: any) => <span className="font-medium text-gray-900 whitespace-nowrap">{item.bpkb_number || '-'}</span>,
  }] : []),
  // Kolom hanya muncul saat Tab STNK
  ...(activeTab === 'stnk' ? [{
    header: 'NOMOR STNK',
    accessorKey: 'stnk_number',
    sortable: true,
    cell: (item: any) => <span className="font-medium text-gray-900 whitespace-nowrap">{item.stnk_number || '-'}</span>,
  }] : []),
  {
    header: 'WILAYAH',
    accessorKey: 'region',
    sortable: true,
    cell: (item) => <span className="text-slate-600 whitespace-nowrap">{item.region || '-'}</span>,
  },
];

// Implementasi Render
return (
  <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)}>
    {/* Tab Triggers ... */}
    
    <div className="mt-4">
      <BaseTable
        data={data}
        columns={columns}
        loading={isLoading}
        meta={{
          currentPage: page,
          perPage: perPage,
          lastPage: pagination.lastPage,
          total: pagination.total
        }}
        onPageChange={setPage}
        sortBy={sortBy}
        sortDirection={sortOrder}
        onSortChange={(key, dir) => {
          setSortBy(key);
          setSortOrder(dir);
          setPage(1); // Reset page saat merubah sort
        }}
      />
    </div>
  </Tabs>
);
```

**Kelebihan pola ini**:
1. Menghilangkan redundansi >500 baris kode jika dibandingkan dengan menyusun `<Table>` satu persatu.
2. Semua fitur (No Data *empty state*, UI Loading Spinner berkedip, UI Server Error, Paginasi seragam) otomatis di-handle secara konsisten oleh satu pembungkus `BaseTable`.
3. Sorting logic terintegrasi dengan mulus pada property `onSortChange`.

---

## 20. Standarisasi Validasi Maksimal Checkbox (Data Selection)

**Aturan**: Ketika sebuah tabel atau *list* menyediakan fungsionalitas pemilihan baris via Checkbox (misal: Alokasi Unit, Penagihan Parsial) yang memiliki **kuantitas maksimal yang diizinkan (`requiredQty`)**, *frontend* **wajib** melakukan validasi ketat langsung pada UI sebelum memperbarui *state*.

**Larangan Keras**:
- **Dilarang** membiarkan *user* men-ceklis item melebihi kuota lalu baru memunculkan error pada saat tombol "Submit/Simpan" diklik.
- **Dilarang** mengandalkan logika validasi *backend* saja. Jika *user* melakukan *bypass* pada *disabled state* dari tombol Submit, *frontend* harus tetap menggagalkan pengiriman jika kuota terlampaui.

**Standar Implementasi `toggleOne` (Single Checkbox)**:
Jika *user* mencoba men-ceklis baris baru saat kuota sudah penuh, tolak perubahan *state* secara eksplisit dan munculkan pesan `toast.error`.

```tsx
const toggleOne = (stockId: number, checked: boolean) => {
  if (checked && selectedIds.size >= requiredQty) {
    toast.error(`Maksimal ${requiredQty} unit yang dapat dipilih`);
    return;
  }
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (checked) next.add(stockId);
    else next.delete(stockId);
    return next;
  });
};
```

**Standar Implementasi `toggleAllPage` (Bulk Checkbox / Select All)**:
Saat *user* menekan tombol "Pilih Semua", sistem harus berhitung sisa kuota (`requiredQty - selectedIds.size`). Sistem **hanya boleh** men-ceklis baris hingga sisa kuota tersebut habis, dan mengabaikan baris sisanya secara otomatis. Munculkan pesan sukses interaktif atau *error* penolakan yang komunikatif.

```tsx
const toggleAllPage = (checked: boolean) => {
  if (checked && selectedIds.size >= requiredQty) {
    toast.error(`Maksimal ${requiredQty} unit yang dapat dipilih`);
    return;
  }
  setSelectedIds((prev) => {
    const next = new Set(prev);
    const pageRows = // ... data baris pada halaman saat ini ...

    if (checked) {
      let remaining = requiredQty - next.size;
      pageRows.forEach((item) => {
        if (!next.has(item.id) && remaining > 0) {
          next.add(item.id);
          remaining--;
        }
      });
      // (Opsional) Beri notifikasi UI jika berhasil men-ceklis maksimal
      if (remaining === 0 && pageRows.length > 0 && next.size === requiredQty) {
        toast.success(`Berhasil memilih ${requiredQty} unit (maksimal)`);
      }
    } else {
      pageRows.forEach((item) => next.delete(item.id));
    }

    return next;
  });
};
```

---

## 21. Standarisasi Modal Konfirmasi Aksi Kritis

**Aturan**: Setiap tombol aksi yang memicu perubahan status signifikan pada transaksi atau data kritis (misal: "Tandai Lunas", "Terima Barang", "Kirim Barang", "Unit Terjual") **wajib** menggunakan Modal Konfirmasi (`Dialog`) sebelum aksi tersebut dieksekusi, tidak boleh memanggil fungsi API secara langsung dari tombol.

**Standar Komponen Modal Konfirmasi**:
1. Gunakan komponen `Dialog` dari `@/components/ui/dialog`.
2. Sertakan kotak informasi bergaya peringatan yang konsisten dengan ikon `Info` dari `lucide-react` di dalam `DialogHeader`.
3. Modal harus tertutup otomatis (*state* diubah menjadi `false`) setelah proses API sukses, maupun saat gagal atau terhenti di validasi *frontend*.

**Contoh Implementasi**:

```tsx
<Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Konfirmasi Kirim Barang</DialogTitle>
      <DialogDescription className="pt-2">
        Apakah Anda yakin ingin mengirim barang ini?
      </DialogDescription>
      {/* Kotak Informasi Wajib */}
      <div className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-md p-2 text-justify">
        <div className="flex gap-2">
          <span>
            <Info />
          </span>
          <span>
            Dengan klik kirim barang maka akan mengurangi stock <b>Warehouse</b> dan barang akan dikirim ke pembeli.
          </span>
        </div>
      </div>
    </DialogHeader>
    <DialogFooter className="mt-4 flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsConfirmDialogOpen(false)}
        disabled={isPending}
      >
        Batal
      </Button>
      <Button
        type="button"
        className="bg-blue-600 hover:bg-blue-700 text-white" // Sesuaikan warna, misal: emerald-600 untuk aksi positif
        onClick={handleExecuteAction}
        disabled={isPending}
      >
        {isPending ? 'Memproses...' : 'Ya, Kirim Barang'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 22. Standarisasi Tautan ke Data Master (ReferenceLink)

Ketika menata **Tabel Data** (terutama laporan atau transaksi) yang memiliki referensi ke entitas master (contoh: Nama Supplier, Tipe Unit, Customer), pastikan nama entitas tersebut dirupakan ke dalam tautan (link) agar interaktif dan mudah dinavigasi oleh pengguna untuk melihat detail rekaman utamanya.

**Aturan Penggunaan Komponen `<ReferenceLink>`**:
1. Gunakan komponen `@/components/ui/reference-link`. Komponen ini diformat agar terlihat eksklusif dengan warna biru (`text-blue-600`), ketebalan bold, *hover effect*, dan dibekali ikon panah/external.
2. Karena tabel biasanya berada di dalam konteks bisnis dengan variabel `slug`, URL `href` wajib merujuk ke Master Data yang bersesuaian, seringkali dengan menambahkan *query params* pelencong (misalkan `?search=`).

**Contoh Implementasi Standar pada Definisi Kolom Tabel (ColumnDef)**:

```tsx
import { ReferenceLink } from '@/components/ui/reference-link';
import { useRouter } from 'next/router';

// Di dalam fungsi komponen utama
const router = useRouter();
const slug = router.query.slug as string;

// ...
{
  header: 'SUPPLIER',
  accessorKey: 'person_name',
  sortable: true,
  alignment: 'left',
  cell: (item) => (
    <ReferenceLink href={`/dashboard/${slug}/master/supplier?search=${encodeURIComponent(item.person_name || '')}`}>
      {item.person_name || '-'}
    </ReferenceLink>
  ),
},
```

---

## 23. Standarisasi Filter (Pencarian & Tanggal) pada Modul Laporan

**Aturan**: Ketika membangun modul atau halaman **Laporan** (seperti Laporan Penjualan, Laporan Pembelian, Laporan Penerimaan) yang menggunakan _backend custom query/flattened response_ (contoh endpoint: `/wapi/report/...`), fitur penyaringan (Filter) **wajib** menggunakan strategi *Client-Side Text Matching* dan *Client-Side Date Matching* daripada mengirim ID relasional ke backend. Hal ini untuk mencegah kemungkinan Error 500 dari backend, serta menghindari masalah inkonsistensi skema bila API laporan tidak mengembalikan ID referensi (seperti `person_id` atau `unit_type_id`) melainkan mengembalikan string langsung (seperti `person_name` dan `unit_name`).

**Standar Evaluasi Filter di tingkat Hook (mis. `useLaporanPenjualan.ts`)**:
1. Komponen antarmuka pencarian (seperti Combobox) **tidak boleh** melempar ID referensi (misalnya melempar `supplierId = 22`). Balikkan nilai teks murni sesuai hasil ketikan pengguna (melempar `search = 'Customer 22'`).
2. Tangkap seluruh hasil `data` dari backend, lalu eksekusi filter secara lokal di *frontend* dengan membandingkan teks murni atau memecah tanggal.

**Contoh Implementasi pada Custom Hook**:

```ts
// 1. Eksekusi API secara normal TANPA membawa parameter spesifik yang rentan rusak:
// (Catatan: Anda tetap dapat menyertakan parameter Pagination dasar)
const result = await getLaporan(params);
let filteredData = Array.isArray(result.data) ? result.data : [];

// 2. Client-Side Date Matching (Contoh: receipt_date / transaction_date)
if (startDate && endDate) {
  filteredData = filteredData.filter(item => {
    if (!item?.transaction_date) return true;
    try {
      const dateOnly = String(item.transaction_date).split(/[T ]/)[0];
      return dateOnly >= startDate && dateOnly <= endDate;
    } catch {
      return true;
    }
  });
}

// 3. Client-Side Text Matching (Contoh: combobox unit_name atau person_name)
if (currentSearch) {
  const q = String(currentSearch).toLowerCase();
  filteredData = filteredData.filter(item => {
    const uName = String(item.unit_name || '').toLowerCase();
    const pName = String(item.person_name || '').toLowerCase();
    // Cukup gunakan includes untuk memastikan pencarian toleran terhadap variasi penulisan.
    return uName.includes(q) || pName.includes(q); 
  });
}

setData(filteredData);
```

---

## 24. Standarisasi Pencarian & Paginasi Client-Side pada Master Data (Fallback)

**Aturan**: Seringkali terdeteksi *bug* di mana Endpoint API Backend untuk Master Data mengabaikan parameter `search` atau tidak mendukung *pagination* dan *search* secara bersamaan (misal, backend hanya memfilter *search* di 10 data yang tampil di halaman 1).

Untuk mengatasi isu pencarian tidak berfungsi akibat *unstable backend search parameters*, **wajib** mengubah format *request* dengan meminta ditarik semua data, lalu melimpahkan logika pencarian dan paginasi (pemotongan keseluruhan array) murni ke algoritma sisi klien (*client-side*).

**Standar Solusi Implementasi pada *Service Layer***:
1. Buang penggunaan parameter `buildLaravelPaginationQuery(params)` dari opsi `apiClient.get`.
2. Khusus injeksikan payload limit tanpa batas: `per_page: 9999` (sebagai paksaan jika backend membatasi maksimal *limit array*).
3. Setelah menerima keseluruhan respon dari *server*, lakukan filter `params.search` secara lokal menggunakan deret `.filter()`.
4. Implementasikan `params.page` dan `params.perPage` dengan metode `.slice(start, start + perPage)`.
5. Rakit kembali array yang sudah terpotong dengan metadata statis buatan melalui pembungkus `toPaginatedResult`.

**Contoh Implementasi pada fungsi *service* (mis. `account-group.service.ts`)**:

```typescript
export const getMasterDataList = async (params: PaginationParams & { company_id?: string | number }) => {
  // 1. Tarik semua data dari backend tanpa limit paginasi standar
  const response = await apiClient.get<PaginatedResponse>(basePath, {
    params: {
      company_id: params.company_id,
      per_page: 9999, // Fallback untuk memastikan backend selalu mereturn semua
    },
  });

  const data = ensureSuccess(response.data);
  const isDirectArray = Array.isArray(data);
  const items: ApiModel[] = isDirectArray ? data : ((data as any).data ?? []);

  // 2. Terapkan scope company jika diberlakukan
  const scopedData = params.company_id
    ? items.filter((item) => String(item.company_id) === String(params.company_id))
    : items;

  let filteredData = scopedData;

  // 3. Client-Side Search Matching (Cari di semua field relevan)
  if (params.search && params.search.trim() !== '') {
    const keyword = params.search.toLowerCase().trim();
    filteredData = filteredData.filter((item) => {
      const code = (item.code ?? '').toLowerCase();
      const name = (item.name ?? '').toLowerCase();
      return code.includes(keyword) || name.includes(keyword);
    });
  }

  // 4. Client-Side Pagination (Slicing Array)
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;
  const start = (page - 1) * perPage;
  const paginatedData = filteredData.slice(start, start + perPage);

  // 5. Kembalikan array terpotong beserta manipulasi meta pagination
  return toPaginatedResult(
    {
      data: paginatedData,
      current_page: page,
      per_page: perPage,
      total: filteredData.length,
      last_page: Math.max(1, Math.ceil(filteredData.length / perPage)),
    },
  );
};
```

---

## 25. Standarisasi Input Nominal (Currency Input: IDR & USD)

**Aturan**: Seluruh field input yang berkaitan dengan nominal uang, harga, biaya, atau transaksi (kas) **wajib** menggunakan komponen `MoneyInput` (dari `@/components/ui/money-input.tsx`). 
Format tampilan mata uang sudah diatur secara dinamis dengan prefix `"Rp. "` untuk Rupiah dan `"$ "` untuk mata uang asing, ditambah penanganan *decimal point* (titik desimal) secara otomatis pada USD.

**Dilarang Keras**:
1. Menambahkan tulisan teks statis (teks absolut/span) "Rp" atau "$" yang difloating di atas atau di sebelah field input. 
2. Menambahkan *padding left* (`pl-7`, `pl-9`) secara manual pada input untuk memberikan ruang buat tulisan "Rp" / "$". 
3. Membuat fungsionalitas parsing / stripping karakter non-angka secara manual berulang-ulang dengan Regex di setiap `onChange` (kecuali di dalam berkas helper utility).

**Standar Komponen `MoneyInput`**:
- Untuk input bertipe **Rupiah (IDR)**, cukup panggil `<MoneyInput />` secara rutin (secara logis defaultnya `'IDR'`).
- Untuk input bertipe **Dolar (USD)**, sertakan properti `currency="USD"`.

**Contoh Implementasi**:

```tsx
import { MoneyInput } from '@/components/ui/money-input';

// 1. Untuk Transaksi Rupiah (Otomatis mendapatkan prefix "Rp. ")
<FormField
  control={form.control}
  name="paymentIdr"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Pembayaran IDR</FormLabel>
      <FormControl>
        <MoneyInput 
          value={field.value ?? 0} 
          onChangeValue={field.onChange} 
          placeholder="0" 
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// 2. Untuk Transaksi USD (Otomatis mendapatkan prefix "$ " dan properti desimal)
<FormField
  control={form.control}
  name="paymentUsd"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Pembayaran USD</FormLabel>
      <FormControl>
        <MoneyInput 
          currency="USD" 
          value={field.value ?? 0} 
          onChangeValue={field.onChange} 
          placeholder="0.00" 
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## 26. Penanganan Konflik HTTP Status Code & Penjagaan Toleransi Akses Menu (CORS / Redirect Loop)

### Latar Belakang & Gejala Bug
Pengguna dengan izin terbatas (misal, staf gudang yang hanya memiliki akses menu `Warehouse`) mengalami kegagalan saat masuk ke Dashboard, ditandai dengan pesan error:
`Failed to fetch permissions test: Error: Failed to fetch permissions`
Dan konsol peramban menampilkan error parse string kosong (`SyntaxError: JSON.parse: unexpected end of data`) serta respon status `0`.

Hal ini disebabkan oleh dua faktor utama:
1. **Inversi Status Kode HTTP di Backend**:
   - Backend (Laravel Exception Handler) mengembalikan status **`401 Unauthorized`** ketika pengguna ditolak hak aksesnya oleh Spatie (`UnauthorizedException`), dan mengembalikan status **`403 Forbidden`** ketika pengguna unauthenticated (token hilang/invalid). Hal ini terbalik secara standar RESTful API.
2. **Auto-Logout / Redirect Interceptor di Frontend**:
   - Axios response interceptor di frontend mendeteksi status `401` lalu menghapus token JWT dan mengalihkan halaman ke `/login`.
   - Karena pengguna warehouse ditolak memuat beberapa statistik halaman dashboard (seperti `/stats/billing-stats` yang memerlukan izin finansial), request tersebut menghasilkan error `401` (yang aslinya adalah penolakan izin `403`), memicu penghapusan token secara sepihak dan pembatalan (*abort*) seluruh request aktif (status `0`), termasuk pengambilan izin menu `/wapi/auth/has-permissions`.

---

### Solusi Standar & Pencegahan

#### 1. Perbaikan Kode Status di Laravel Handler (`app/Exceptions/Handler.php`)
Pastikan *Exceptions* terpetakan dengan kode status RESTful yang benar:
- **`401 Unauthorized` (Unauthenticated)**: Digunakan saat token tidak sah, kedaluwarsa, atau tidak terkirim.
  ```php
  if ($exception instanceof \Illuminate\Auth\AuthenticationException || 
      $exception instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException || 
      $exception instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException || 
      $exception instanceof \Tymon\JWTAuth\Exceptions\JWTException ||
      $exception instanceof \Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException) {
      return $this->responseError(null, 'Unauthenticated. Your session has expired or is invalid.', 401);
  }
  ```
- **`403 Forbidden` (Unauthorized / No Permission)**: Digunakan saat pengguna terverifikasi namun tidak memiliki hak akses/izin (*role/permission*) Spatie.
  ```php
  if ($exception instanceof \Spatie\Permission\Exceptions\UnauthorizedException || 
      $exception instanceof \Illuminate\Auth\AccessDeniedException || 
      $exception instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
      return $this->responseError(null, 'You do not have the required permissions to access this resource.', 403);
  }
  ```

#### 2. Toleransi Pemuatan Data Dashboard / Multi-API (`dashboard.service.ts`)
Agar halaman utama/dashboard aman diakses oleh semua level pengguna:
- **Jangan gunakan Promise.all mentah** yang langsung terputus (*fail-fast*) jika salah satu request API melempar error status `403`.
- Bungkus panggilan API individual dengan penanganan *catch* lokal (`safeGet`) untuk mereturn objek *fallback* kosong secara elegan sehingga UI tidak kolaps.
  ```typescript
  const safeGet = async <T>(url: string, config: any, fallback: T): Promise<T> => {
    try {
      const response = await apiClient.get<{ status: boolean; data: T }>(url, config);
      return response.data.data;
    } catch (err) {
      console.warn(`[DashboardService] Failed to fetch from ${url}, using fallback:`, err);
      return fallback;
    }
  };
  ```
#### 3. Pencegahan Reload/Refresh pada Halaman Login (`client.ts`)
Agar info error login salah atau status tidak aktif tidak menghilang akibat halaman ter-refresh secara otomatis oleh interceptor:
- **Kondisi Interceptor**: Jangan lakukan pembersihan token dan pemaksaan pengalihan `window.location.href = '/login'` apabila request berasal dari endpoint login (`/auth/login`) atau peramban memang sudah berada di halaman `/login`.
  ```typescript
  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiError>) => {
      if (error.response?.status === 401) {
        const isLoginRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('login');
        const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

        if (!isLoginRequest && !isLoginPage) {
          if (typeof window !== 'undefined') {
            removeAccessToken();
            clearStoredCompanyId();
            clearStoredPermissions();
            window.location.href = '/login';
          }
        }
      }
      // ...
    }
  );
  ```

---

## Standarisasi Searchable Select (Combobox) untuk Form

**Aturan**: Untuk field/dropdown opsi yang memiliki banyak item (Gudang, Supplier, Sparepart), letakkan komponen navigasi menggunakan **Popover + Command** dari Shadcn UI. Elemen untuk trigger drop-down *wajib* disisipkan dengan *native* `<button type="button">` dan dilekatkan di dalam blok `<FormControl>`. Penggunaan `<Button>` atau `<FormControl>` tanpa membungkus `PopoverTrigger` tidak direkomendasikan karena dapat merusak *ref forwarding* dan malah mengirimkan status *form submit*.

**Hierarki yang Tepat:**
```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

<FormField control={form.control} name="item_id" render={({ field }) => (
  <FormItem>
    <FormLabel>Pilih Item</FormLabel>
    <Popover open={open} onOpenChange={setOpen}>
      {/* ⚠️ PENTING: letakkan target asChild popover secara hierarki di dalam FormControl, dan gunakan tag HTML <button type="button"> */}
      <FormControl>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn("flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50", !field.value && "text-muted-foreground")}
          >
            <span className="truncate">
              {field.value ? options?.find((w) => String(w.id) === String(field.value))?.name : "Pilih..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
      </FormControl>
      
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari opsi..." />
          <CommandList>
            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {options?.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={`${opt.name} ${opt.id}`} // value gabungan memudahkan pencarian berdasarkan kode & nama
                  onSelect={() => {
                    form.setValue("item_id", opt.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", String(field.value) === String(opt.id) ? "opacity-100" : "opacity-0")} />
                  {opt.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <FormMessage />
  </FormItem>
)} />
```
