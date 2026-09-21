# File Instruction

Dokumen ini wajib dibaca terlebih dahulu oleh AI MVC sebelum menerapkan fitur baru, komponen baru, atau perubahan UI baru pada project ini. Tujuannya agar implementasi berikutnya memakai komponen reusable yang sudah tersedia, menjaga konsistensi tampilan, dan menghindari duplikasi komponen.

## Aturan Umum

> [!CAUTION]
> **DILARANG KERAS MENJALANKAN PERINTAH TERMINAL APAPUN!**
> AI/Agent **SANGAT DILARANG** mengeksekusi atau menjalankan perintah apapun di terminal (seperti `npm run`, `npx`, `npm test`, `git`, dsb). Hal yang **PALING TERLARANG** adalah menjalankan testing atau script dalam bentuk apapun (seperti `npm run test`, `npm run dev`, `npm run build`, `npx ...`, dll). Pengerjaan HANYA BERFOKUS pada inspeksi dan edit file secara langsung tanpa eksekusi terminal!

- **DILARANG KERAS EKSEKUSI TERMINAL / TESTING**: Tidak boleh menjalankan command terminal apapun (`npm`, `npx`, shell script, dsb).
- Cek kebutuhan fitur terhadap struktur folder yang sudah ada sebelum membuat file baru.
- Gunakan komponen reusable dari `src/components/ui` dan `src/components/common` sebelum membuat komponen baru.
- Komponen utama per fitur ditempatkan di `src/components/features/<nama-fitur>`.
- Layout halaman dan shell aplikasi memakai komponen dari `src/components/layout`.
- Sebelum membuat utility class, spacing pattern, warna tema, atau style global baru, cek `src/styles/globals.css`.
- Jika fitur baru membutuhkan style yang dipakai berulang, buat utility class di `src/styles/globals.css` agar perubahan desain dapat dilakukan cukup dari satu baris dan berdampak ke semua komponen yang memakai class tersebut.
- Hindari hardcode style berulang di banyak komponen jika bisa dijadikan utility class global atau prop reusable pada komponen UI.

## Struktur Folder

| Folder | Fungsi | Catatan |
| --- | --- | --- |
| `src/components/ui` | Komponen dasar reusable | Prioritas pertama untuk input, button, table, dialog, form, select, badge, dan elemen UI umum. |
| `src/components/common` | Komponen reusable lintas halaman yang lebih spesifik | Gunakan untuk header halaman, section wrapper, halaman print, dan pola umum lain. |
| `src/components/features` | Komponen utama per domain fitur | Buat folder berdasarkan fitur, misalnya `do-ekspedisi`, `driver`, `customer`, dan sejenisnya. |
| `src/components/layout` | Layout aplikasi | Gunakan untuk dashboard shell, sidebar, topbar, dan container halaman. |
| `src/styles/globals.css` | Token tema, base style, dan utility class global | Cek sebelum menambah class berulang atau aturan visual lintas komponen. |

## Komponen UI Reusable

| Kebutuhan | Komponen/File | Panduan Pakai |
| --- | --- | --- |
| Tabel data | `src/components/ui/base-table.tsx` | Gunakan untuk tabel fitur. Mendukung kolom, sorting, search, pagination, checkbox, sticky column, row marker, header action, dan date range. |
| Tabel primitive | `src/components/ui/table.tsx` | Gunakan sebagai building block ketika `BaseTable` tidak sesuai. |
| Header halaman | `src/components/ui/page-header.tsx` | Gunakan untuk semua header halaman (daftar, form create/edit, detail). Mendukung breadcrumbs, tombol onBack, title, subtitle (deskripsi / badge status), actions button group, dan auto hideOnPrint. |
| Input teks | `src/components/ui/input.tsx` | Gunakan untuk semua input text/number/date native sebelum membuat input custom. |
| Input nominal | `src/components/ui/money-input.tsx` | Gunakan untuk nilai uang agar format dan parsing konsisten. |
| Input angka terbatas | `src/components/ui/clamped-numeric-input.tsx` | Gunakan untuk numeric input dengan batas min/max. |
| Upload file | `src/components/ui/file-input.tsx` | Gunakan untuk upload file. Set `name`, `accept`, `helperText`, dan validasi ukuran/tipe pada komponen fitur bila aturan API berbeda. |
| Textarea | `src/components/ui/textarea.tsx` | Gunakan untuk input multi-line. |
| Label | `src/components/ui/label.tsx` | Gunakan sebagai label form. Jaga spacing label dan input konsisten, umumnya wrapper `space-y-2`. |
| Form dengan react-hook-form | `src/components/ui/form.tsx` | Gunakan untuk form kompleks yang membutuhkan validation state dan `FormMessage`. |
| Modal form | `src/components/ui/form-dialog.tsx` | Gunakan untuk dialog create/edit sederhana dengan submit/cancel standar. |
| Dialog primitive | `src/components/ui/dialog.tsx` | Gunakan jika layout dialog butuh kontrol khusus. |
| Dialog print template | `src/components/ui/report-template-print-dialog.tsx` | Gunakan untuk modal dialog pemilihan template dokumen cetak pada laporan atau dokumen transaksi. |
| Alert dialog | `src/components/ui/alert-dialog.tsx` | Gunakan untuk konfirmasi aksi penting seperti hapus atau destructive action. |
| Button | `src/components/ui/button.tsx` | Gunakan untuk semua action button. Ikuti variant dan size yang tersedia. |
| Badge/status | `src/components/ui/badge.tsx` | Gunakan untuk status, label kecil, atau kategori. |
| Select | `src/components/ui/select.tsx` | Gunakan untuk single option selection. |
| Multi select | `src/components/ui/multi-select.tsx` | Gunakan untuk pemilihan lebih dari satu opsi. |
| Checkbox | `src/components/ui/checkbox.tsx` | Gunakan untuk boolean atau multi-row selection. |
| Switch | `src/components/ui/switch.tsx` | Gunakan untuk toggle boolean. |
| Date picker | `src/components/ui/date-picker.tsx` | Gunakan untuk tanggal tunggal. |
| Date range picker | `src/components/ui/date-range-picker.tsx` | Gunakan untuk filter rentang tanggal. |
| Date time picker | `src/components/ui/date-time-picker.tsx` | Gunakan untuk input tanggal dan jam. |
| Dropdown menu | `src/components/ui/dropdown-menu.tsx` | Gunakan untuk menu aksi per row atau action group. |
| Tabs | `src/components/ui/tabs.tsx` | Gunakan untuk memisahkan view dalam satu halaman/fitur. |
| Popover | `src/components/ui/popover.tsx` | Gunakan untuk panel kecil seperti picker, filter, atau command. |
| Tooltip | `src/components/ui/tooltip.tsx` | Gunakan untuk icon button atau informasi singkat. |
| Command | `src/components/ui/command.tsx` | Gunakan untuk command palette atau searchable selection. |
| Loading state | `src/components/ui/loading-state.tsx` | Gunakan untuk state loading konsisten. |
| Skeleton | `src/components/ui/skeleton.tsx` | Gunakan untuk placeholder loading. |
| Progress | `src/components/ui/progress.tsx` | Gunakan untuk progress bar. |
| Separator | `src/components/ui/separator.tsx` | Gunakan untuk pemisah visual. |
| Card | `src/components/ui/card.tsx` | Gunakan hanya jika perlu framing item/panel sesuai pola existing. |
| Copy box | `src/components/ui/copy-box.tsx` | Gunakan untuk teks yang perlu disalin. |
| Input koordinat Leaflet | `src/components/ui/leaflet-coordinate-input.tsx` | Gunakan untuk memilih koordinat opsional melalui teks, klik peta, atau geolokasi perangkat. Value dan payload memakai format `latitude,longitude`; nilai kosong dikirim sebagai `null`/string kosong pada `FormData`. |
| Tampilan peta Leaflet | `src/components/ui/show-map-leaflet.tsx` | Gunakan untuk menampilkan lokasi dari koordinat. Prop `onCoordinateChange` bersifat opsional; jika diberikan, peta dapat dipakai memilih titik. Import Leaflet dilakukan client-only agar aman pada SSR Next.js. |
| Text truncate | `src/components/ui/text-truncate.tsx` | Gunakan untuk memotong teks panjang secara konsisten. |
| Image preview | `src/components/ui/image-preview.tsx` | Gunakan untuk preview gambar. |
| Parsed image | `src/components/ui/parsed-image.tsx` | Gunakan untuk render image dari value yang perlu diparse. |
| Storage image | `src/components/ui/storage-image.tsx` | Gunakan untuk gambar dari storage/backend. |
| Reference link | `src/components/ui/reference-link.tsx` | Gunakan untuk link referensi. |
| Required mark | `src/components/ui/required-mark.tsx` | Gunakan bila tersedia untuk tanda wajib pada label. |
| Toast provider | `src/components/ui/sonner.tsx` | Gunakan pola toast yang sudah ada melalui `sonner`. |

## Komponen Common

| Kebutuhan | Komponen/File | Panduan Pakai |
| --- | --- | --- |
| Header halaman umum (legacy) | `src/components/common/PageHeader.tsx` | Versi legacy minimal. Untuk halaman baru atau refactor, selalu gunakan `src/components/ui/page-header.tsx`. |
| Section wrapper | `src/components/common/SectionCard.tsx` | Gunakan untuk section konten yang membutuhkan card wrapper sederhana. |
| Halaman surat/print | `src/components/common/PrintLetterPage.tsx` | Gunakan untuk tampilan print dokumen atau surat. |
| Hook print template | `src/hooks/useReportTemplatePrint.ts` | Hook standar untuk mengelola flow cetak laporan, pemilihan template dokumen, preloading kop/tanda tangan, dan trigger window print. |
| Helper kop surat & PT | `src/lib/print-letterhead.ts` | Helper untuk resolusi ID perusahaan (`resolveCompanyId`), kop surat fallback (`getLetterheadByCompanyId`), dan nama perusahaan (`getCompanyName`). |

## Komponen Layout

| Kebutuhan | Komponen/File | Panduan Pakai |
| --- | --- | --- |
| Shell dashboard | `src/components/layout/DashboardLayout.tsx` | Gunakan sebagai layout dashboard utama. |
| Container dashboard | `src/components/layout/DashboardContainer.tsx` | Gunakan untuk pembungkus konten dashboard. |
| Sidebar | `src/components/layout/Sidebar.tsx` | Gunakan untuk navigasi samping. |
| Topbar | `src/components/layout/Topbar.tsx` | Gunakan untuk header aplikasi. |

## Panduan Fitur Baru

1. Tentukan domain fitur dan cek folder di `src/components/features`.
2. Reuse komponen dari `src/components/ui` untuk elemen dasar.
3. Reuse komponen dari `src/components/common` untuk pola lintas halaman.
4. Cek `src/styles/globals.css` sebelum menulis class berulang.
5. Tambahkan utility class di `src/styles/globals.css` untuk pola visual yang akan dipakai banyak komponen.
6. Buat komponen fitur hanya untuk logic atau komposisi yang memang spesifik pada fitur tersebut.
7. Pastikan spacing form konsisten: label dan control umumnya memakai wrapper `space-y-2`, sedangkan antar field mengikuti container form/modal.
8. Untuk upload file, gunakan `FileInput` dan sesuaikan `name`, `accept`, `helperText`, validasi ukuran, dan validasi tipe file berdasarkan kebutuhan API.
9. Untuk header setiap halaman (daftar, form, atau detail), gunakan `PageHeader` dari `src/components/ui/page-header.tsx` mengikuti panduan pada bagian [Panduan Komponen PageHeader (Header Halaman)](#panduan-komponen-pageheader-header-halaman).
10. Untuk fitur cetak laporan atau dokumen transaksi, wajib mengikuti panduan arsitektur print terstandarisasi pada bagian [Panduan Fitur Print Laporan & Dokumen](#panduan-fitur-print-laporan--dokumen).
11. Untuk field lokasi customer/driver, simpan koordinat pada request key `map_coordinat` (nullable), terpisah dari `map_link`. Gunakan `LeafletCoordinateInput`; jangan membuat ulang parsing atau instance Leaflet di form fitur.

## Panduan Komponen Koordinat Leaflet

- Library runtime menggunakan `leaflet` dan stylesheet global diimpor dari `src/styles/globals.css`.
- `LeafletCoordinateInput` adalah komponen form controlled dengan kontrak `value?: string | null` dan `onChange(value: string | null)`. Kontrol utamanya adalah input nama tempat, tombol icon lokasi perangkat, dan tombol X untuk membersihkan seluruh data map dalam satu baris. Pencarian Nominatim OpenStreetMap dimulai saat pointer berada di input setelah minimal 3 karakter (dengan debounce), sedangkan koordinat dapat dipilih dari hasil pencarian atau klik peta. Tombol X mengosongkan nama/hasil pencarian, mengirim nilai `null`, menghapus marker, dan mengembalikan peta ke posisi awal. Nama hasil pencarian hanya membantu memilih titik dan tidak mengubah kontrak payload `map_coordinat`.
- `ShowMapLeaflet` menerima string `latitude,longitude`, object `{ lat, lng }`, JSON koordinat, atau `null`. Gunakan tanpa `onCoordinateChange` untuk mode tampilan; berikan callback tersebut untuk mode pemilihan titik.
- Pada halaman detail, validasi koordinat dengan `parseMapCoordinate` sebelum merender `ShowMapLeaflet`. Jika koordinat kosong/tidak valid, tampilkan empty state dan jangan menampilkan pusat peta default agar tidak disalahartikan sebagai lokasi data.
- Format penyimpanan standar adalah `latitude,longitude` dengan maksimal tujuh angka desimal. Latitude harus berada pada rentang -90 sampai 90, longitude -180 sampai 180.
- Leaflet hanya di-import secara dinamis di client karena project memakai Next.js Pages Router dan proses SSR tidak memiliki object `window`.
- Saat request memakai `FormData`, key `map_coordinat` tetap harus dikirim dengan string kosong ketika pengguna menghapus titik agar backend dapat mengubah nilai sebelumnya menjadi `null`.
- Tombol geolokasi memerlukan header `Permissions-Policy` dengan `geolocation=(self)`. Jangan memperluas izin ke origin atau iframe pihak ketiga tanpa kebutuhan eksplisit.

## Panduan Komponen PageHeader (Header Halaman)

Komponen `PageHeader` (`src/components/ui/page-header.tsx`) adalah standar tunggal untuk menyusun area header di semua halaman panel (halaman indeks/daftar, formulir tambah/edit, maupun halaman detail transaksi). Komponen ini menjamin keseragaman visual, navigasi breadcrumbs responsif, tombol kembali terstandarisasi, penataan badge metadata, serta isolasi cetak (`print:hidden`).

Referensi implementasi utama: `src/pages/dashboard/[slug]/kas-bon/[id].tsx`.

### 1. Spesifikasi Props (`PageHeaderProps`)

| Prop | Tipe | Default | Penjelasan & Perilaku |
| --- | --- | --- | --- |
| `title` | `React.ReactNode` | *(Wajib)* | Judul utama halaman. Responsif (`text-xl sm:text-2xl`) dengan word breaking otomatis. |
| `subtitle?` | `React.ReactNode` | `undefined` | Keterangan di bawah judul. Dapat berupa string teks biasa ataupun elemen JSX komposit (misal: kode dokumen, tanggal, dan deretan status `Badge`). |
| `breadcrumbs?` | `BreadcrumbItem[]` | `undefined` | Array navigasi hierarkis `[{ label: string; onClick?: () => void }]`. Elemen terakhir diperlakukan sebagai halaman aktif (`aria-current="page"`, tanpa `onClick`). Level tengah disembunyikan otomatis pada viewport mobile. |
| `onBack?` | `() => void` | `undefined` | Handler klik tombol kembali. Jika diisi, tombol ber-ikon `ArrowLeft` muncul di samping judul. Jika tidak diisi (misal di halaman list), tombol kembali otomatis disembunyikan. |
| `actions?` | `React.ReactNode` | `undefined` | Slot tombol aksi di sisi kanan. Otomatis full-width bertumpuk di mobile (`[&>*]:w-full`) dan horizontal rapi di desktop (`sm:flex-row sm:[&>*]:w-auto`). |
| `hideOnPrint?` | `boolean` | `true` | Otomatis menambahkan kelas `print:hidden` sehingga header tidak akan mengotori lembar cetak dokumen fisik. |
| `className?` | `string` | `''` | Class kustom Tailwind tambahan untuk wrapper terluar jika diperlukan. |

---

### 2. Tiga Pola Penggunaan Standar

#### A. Pola Halaman Detail Transaksi (Referensi: `kas-bon/[id].tsx`)
Digunakan untuk halaman detail dokumen/transaksi yang memiliki navigasi kembali, breadcrumbs hierarkis, informasi status multi-badge, serta beberapa tombol aksi (Print, Pembayaran, Konfirmasi).

Karakteristik:
- `breadcrumbs`: 2 level atau lebih (Daftar induk -> Halaman detail saat ini).
- `onBack`: Mengarahkan router kembali ke halaman daftar.
- `subtitle`: Menampilkan kode transaksi tebal berdampingan dengan `Badge` status semantik.
- `actions`: Kumpulan aksi dokumen (Print template, primary action button, dan action button dengan `Tooltip`).

#### B. Pola Halaman Daftar / Index / Laporan
Digunakan untuk halaman list utama (contoh: `laporan-jurnal/index.tsx`, `customer/index.tsx`).

Karakteristik:
- `title`: Nama fitur/laporan.
- `subtitle`: String penjelasan singkat tentang data yang ditampilkan di halaman.
- `onBack`: Tidak digunakan (dikosongkan).
- `actions`: Berisi tombol "Tambah Data", tombol "Export", dan/atau tombol "Print".

#### C. Pola Halaman Form (Create / Edit)
Digunakan untuk formulir input baru atau edit data existing.

Karakteristik:
- `breadcrumbs`: Daftar Induk -> Buat Baru / Edit [Nama Data].
- `onBack`: Handler kembali atau batal.
- `subtitle`: Keterangan ringkas petunjuk pengisian form.
- `actions`: Tombol aksi form (Batal dan Simpan) jika diletakkan di header, atau dikosongkan jika submit button berada di bagian bawah form.

---

### 3. Contoh Implementasi Komprehensif (Berdasarkan `kas-bon/[id].tsx`)

Berikut adalah pola implementasi lengkap pada halaman detail transaksi:

```tsx
import { useRouter } from 'next/router';
import { CheckCircle2, CreditCard, Printer } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function DetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';

  const backToList = () => void router.push(`/dashboard/${slug}/kas-bon`);

  return (
    <PageHeader
      // 1. Breadcrumbs hierarkis: item terakhir tidak memiliki onClick
      breadcrumbs={[
        { label: 'Kas Bon', onClick: backToList },
        { label: 'Detail Kas Bon' },
      ]}
      title="Detail Kas Bon"
      // 2. Subtitle komposit: kode dokumen + multi-badge status semantik
      subtitle={
        <div className="flex flex-wrap items-center gap-2">
          <span>{data.code || `KAS-BON-${data.id}`}</span>
          <Badge
            variant="outline"
            className={
              isPaid
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }
          >
            {isPaid ? 'Lunas' : 'Belum Lunas'}
          </Badge>
          <Badge
            variant="outline"
            className={
              data.isDriverRequest
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-slate-100 text-slate-700'
            }
          >
            {data.isDriverRequest ? 'Pengajuan Driver' : 'Input Kantor'}
          </Badge>
        </div>
      }
      // 3. Tombol kembali otomatis
      onBack={backToList}
      // 4. Tombol aksi responsif
      actions={
        <>
          {/* Tombol Cetak / Print */}
          <Button
            type="button"
            variant="outline"
            onClick={templatePrint.openPrintDialog}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>

          {/* Tombol Aksi Utama */}
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={!canEdit || isPaid}
            onClick={() => setPaymentOpen(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {isPaid ? 'Sudah Dibayar' : 'Bayar'}
          </Button>

          {/* Tombol Sekunder dengan Tooltip Peringatan/Konteks */}
          <Tooltip>
            <TooltipTrigger asChild>
              {/* PENTING: Bungkus span jika Button berpotensi disabled agar event hover tetap aktif */}
              <span className="inline-block">
                <Button
                  type="button"
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  disabled={!canEdit || isPaid || updateStatus.isPending}
                  onClick={() => setConfirmOpen(true)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isPaid ? 'Sudah Lunas' : 'Tandai Lunas'}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-center text-xs">
              Mengubah status menjadi lunas akan mencatat transaksi ke arus kas harian.
            </TooltipContent>
          </Tooltip>
        </>
      }
    />
  );
}
```

---

### 4. Aturan Penting & Best Practices

1. **Gunakan Path yang Tepat**: Selalu impor dari `@/components/ui/page-header`, BUKAN `@/components/common/PageHeader` (versi legacy).
2. **Aturan Breadcrumb**:
   - Hanya item parent yang memiliki `onClick`.
   - Item halaman saat ini (paling terakhir) **dilarang** diberi `onClick` agar semantik `aria-current="page"` tepat.
3. **Pewarnaan Badge Semantik pada Subtitle**:
   - Sukses / Lunas / Aktif: `border-emerald-200 bg-emerald-50 text-emerald-700`
   - Belum Lunas / Dibatalkan / Bahaya: `border-rose-200 bg-rose-50 text-rose-700`
   - Pending / Menunggu Verifikasi: `border-amber-200 bg-amber-50 text-amber-700`
   - Kategori / Sumber Data: `border-blue-200 bg-blue-50 text-blue-700` atau `border-slate-200 bg-slate-100 text-slate-700`
4. **Tombol Disabled di Dalam Tooltip**:
   Ketika tombol di dalam `actions` memiliki atribut `disabled={...}` dan dibungkus `TooltipTrigger asChild`, selalu bungkus tombol tersebut dengan elemen `<span className="inline-block">`. Tombol browser yang `disabled` tidak memancarkan pointer events, sehingga tanpa wrapper span tooltip tidak akan pernah muncul saat pengguna mengarahkan kursor ke tombol disabled tersebut.
5. **Isolasi Print Otomatis**:
   Karena prop `hideOnPrint` bernilai `true` secara default, `PageHeader` sudah memiliki kelas Tailwind `print:hidden`. Anda tidak perlu membungkus `PageHeader` secara manual dengan `<div className="no-print">` kecuali untuk membungkus komponen filter atau kontrol eksternal lain di bawahnya.

---

## Panduan Standarisasi Struktur Tabel & Kolom Aksi (BaseTable)

Komponen `BaseTable` (`src/components/ui/base-table.tsx`) adalah standar tunggal untuk menyusun tabel data pada seluruh fitur aplikasi. Format definisi kolom dan terutama kolom **Aksi** harus mengikuti pola terstandarisasi untuk menjaga keseragaman visual dan interaksi pengguna.

Referensi implementasi utama: `src/components/features/do-ekspedisi/DOEkspedisiTable.tsx`.

### 1. Aturan Kolom & Perataan Data (Alignment)

| Tipe Data | Alignment | Karakteristik / Styling |
| --- | --- | --- |
| **Nomor Urut (No)** | `'center'` | Lebar kolom tetap (`w-[60px]`), teks netral (`text-slate-400`). |
| **Teks Umum / Nama / Kode** | `'left'` (default) | Teks utama tebal (`font-medium text-slate-900`), dapat dipotong jika terlalu panjang dengan `TextTruncate`. |
| **Nominal Uang / Qty / Angka** | `'right'` | Angka tabular (`tabular-nums font-semibold`), format mata uang menggunakan `currenciesFormat('idr', ...)` atau `formatCurrency(...)`. |
| **Tanggal & Waktu** | `'center'` | Susun tanggal dan jam vertikal rapi (`flex flex-col text-xs leading-tight`). |
| **Badge Status** | `'center'` | Gunakan styling badge semantik terstandarisasi. |
| **Kolom Aksi** | `'center'` | Wajib `sticky: 'right'`, menggunakan DropdownMenu dengan trigger icon `MoreVertical`. |

---

### 2. Standarisasi Kolom Aksi (`Aksi`)

Setiap tabel dengan opsi aksi per baris wajib mengikuti spesifikasi berikut:

1. **Properti Kolom**:
   - `header: 'Aksi'`
   - `alignment: 'center'`
   - `sticky: 'right'` (agar kolom aksi tidak terpotong saat tabel discroll horizontal pada layar sempit).
2. **Trigger Button**:
   - Menggunakan komponen `DropdownMenu` + `DropdownMenuTrigger`.
   - Button berbentuk bulat kecil: `variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"`.
   - Icon trigger: `<MoreVertical className="h-4 w-4" />`.
3. **Dropdown Menu Content**:
   - `align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg"`
4. **Item Menu (DropdownMenuItem)**:
   - **Dilarang menggunakan icon di dalam menu aksi tabel** (standarisasi tampilan bersih, text-only).
   - Tombol aksi standar (Edit, Detail, Print):
     `className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"`
   - Tombol aksi destruktif (Hapus):
     `className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"`
   - Kondisi `disabled`:
     Gunakan atribut `disabled={!canModify}` dan pastikan class memuat `disabled:cursor-not-allowed` sehingga menu item tidak dapat diklik dan kursor berubah menjadi not-allowed.

---

### 3. Contoh Implementasi Kolom Aksi Terstandarisasi

```tsx
{
  header: 'Aksi',
  alignment: 'center',
  sticky: 'right',
  cell: (item) => {
    const canModify = item.status === 'draft';

    return (
      <div className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[150px] rounded-md border-slate-200 p-1.5 shadow-lg">
            <DropdownMenuItem
              disabled={!canModify}
              onClick={() => onEdit(item)}
              className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDetail(item)}
              className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer"
            >
              Detail
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canModify}
              onClick={() => onDelete(item)}
              className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer disabled:cursor-not-allowed"
            >
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
}
```

---

## Panduan Fitur Print Laporan & Dokumen

Fitur cetak laporan di project ini menggunakan pola **In-Page Hidden Print Document + Template Print Dialog + Media Print Isolation** (referensi: `src/pages/dashboard/[slug]/laporan/laporan-jurnal/index.tsx`). Pola ini memastikan dokumen cetak diformat presisi standar kertas A4, mendukung pemilihan template dokumen dinamis, mem-preload aset gambar kop & tanda tangan sebelum dialog cetak browser terbuka, serta mengisolasi tampilan cetak agar bersih dari UI web.

### 1. Komponen & Modul Kunci

| Modul / Komponen | Path | Peran |
| --- | --- | --- |
| **Print Hook** | `src/hooks/useReportTemplatePrint.ts` | Mengelola state modal cetak, daftar template dari API, selected template, preloading gambar kop surat & tanda tangan via `waitForImage()`, serta trigger `window.print()` dengan timeout aman. |
| **Print Dialog** | `src/components/ui/report-template-print-dialog.tsx` | Modal untuk memilih template dokumen cetak menggunakan `DocumentTemplateSelect` (tampilan cards), menampilkan tombol "Print Sekarang" dan state loading persiapan cetak. |
| **Letterhead Helper** | `src/lib/print-letterhead.ts` | Helper `resolveCompanyId()` (sinkronisasi slug route vs company context), `getLetterheadByCompanyId()` (kop surat fallback default perusahaan), dan `getCompanyName()` (nama resmi entitas PT). |
| **Print Document Feature** | `src/components/features/<nama-fitur>/<NamaFitur>PrintDocument.tsx` | Komponen visual dokumen cetak A4 terisolasi. Menyusun pembagian halaman (pagination), tabel data, kop surat, header info, grand total, dan tanda tangan footer. |
| **Global Print CSS** | `src/styles/globals.css` | Menyediakan utility `.accounting-print-root`, `.accounting-print-area`, `.accounting-print-content`, `.print-letterhead`, serta `.no-print`. |

---

### 2. Alur Kerja (Workflow) Fitur Print

```
[User Klik Tombol Print di PageHeader]
                   ↓
   templatePrint.openPrintDialog()
                   ↓
[Dialog ReportTemplatePrintDialog Terbuka]
                   ↓
       (User Memilih Template Dokumen)
                   ↓
[User Klik "Print Sekarang" (printWithSelectedTemplate)]
                   ↓
1. Set state `isPreparingPrint = true`
2. Update timestamp `printedAt = new Date()`
3. Preload background kop surat & tanda tangan via `waitForImage()`
4. Tutup dialog modal `isDialogOpen = false`
5. Panggil `window.print()` setelah delay 250ms
                   ↓
[@media print Aktif di Browser]
- Kontrol web (.no-print) disembunyikan
- Komponen dokumen cetak (.accounting-print-root) ditampilkan penuh per halaman A4
```

---

### 3. Langkah Implementasi pada Halaman View (`index.tsx`)

Ikuti struktur dari `src/pages/dashboard/[slug]/laporan/laporan-jurnal/index.tsx`:

#### Step 1: Import Modul Print
```tsx
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportTemplatePrintDialog } from '@/components/ui/report-template-print-dialog';
import { useReportTemplatePrint } from '@/hooks/useReportTemplatePrint';
import { useCompany } from '@/contexts/CompanyContext';
import { getLetterheadByCompanyId, resolveCompanyId, getCompanyName } from '@/lib/print-letterhead';
import { LaporanFiturPrintDocument } from '@/components/features/<nama-fitur>/LaporanFiturPrintDocument';
```

#### Step 2: Inisialisasi Hook & Resolusi Perusahaan
```tsx
const router = useRouter();
const { companyId } = useCompany();

// Resolusi company ID dari slug URL atau context
const resolvedCompanyId = resolveCompanyId(router.query.slug, companyId) || 1;
const selectedPrintBackground = getLetterheadByCompanyId(resolvedCompanyId);
const templatePrint = useReportTemplatePrint(selectedPrintBackground);
```

#### Step 3: Pasang Tombol Print di Header
Sematkan tombol Print di dalam prop `actions` pada `PageHeader`. Pastikan `PageHeader` atau container kontrol dibungkus class `no-print`:
```tsx
<div className="no-print">
  <PageHeader
    title="Nama Laporan"
    subtitle="Deskripsi laporan..."
    actions={
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {/* Tombol export / aksi lain */}
        <Button onClick={templatePrint.openPrintDialog} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
    }
  />
</div>
```

#### Step 4: Letakkan Komponen Dokumen Cetak & Dialog di Akhir Halaman
Tempatkan di bawah konten tabel/pagination:
```tsx
{/* Dokumen cetak (hanya tampil saat @media print) */}
<LaporanFiturPrintDocument
  data={data}
  template={templatePrint.selectedTemplate}
  fallbackBackground={selectedPrintBackground}
  companyName={getCompanyName(resolvedCompanyId)}
  periodLabel={periodLabel}
  filterLabel={filterLabel}
  reportPage={page}
  reportTotal={pagination.total}
  printedAt={templatePrint.printedAt}
/>

{/* Dialog modal pemilihan template print */}
<ReportTemplatePrintDialog
  open={templatePrint.isDialogOpen}
  onOpenChange={templatePrint.setIsDialogOpen}
  selectedTemplateId={templatePrint.selectedTemplateId}
  onTemplateChange={templatePrint.setSelectedTemplateId}
  onPrint={templatePrint.printWithSelectedTemplate}
  isPreparingPrint={templatePrint.isPreparingPrint}
  reportName="laporan nama-fitur"
/>
```

---

### 4. Standar Anatomi Komponen Dokumen Cetak (`PrintDocument.tsx`)

Komponen dokumen cetak (contoh: `LaporanJurnalPrintDocument.tsx`) harus memenuhi standar berikut:

#### A. Pagination Lembar Cetak Manual (Chunking A4)
Browser tidak dapat memprediksi pemotongan baris tabel secara akurat pada layout ber-kop surat. Karena itu, data **wajib dipecah ke dalam array halaman** menggunakan batas baris tetap:
```tsx
const ROWS_PER_PRINT_PAGE = 24; // Sesuaikan antara 18 - 25 baris tergantung jumlah kolom

const pages = useMemo(() => {
  if (data.length === 0) return [[]];
  return Array.from({ length: Math.ceil(data.length / ROWS_PER_PRINT_PAGE) }, (_, index) =>
    data.slice(index * ROWS_PER_PRINT_PAGE, (index + 1) * ROWS_PER_PRINT_PAGE),
  );
}, [data]);
```

#### B. Sanitasi Template Rich Text (Anti-XSS)
`headerInformation` dan `footerInformation` dari template dokumen berpotensi mengandung HTML dari rich text editor. **Wajib dikonversi ke plain text** dan dirender dengan `whitespace-pre-line`. **Dilarang keras menggunakan `dangerouslySetInnerHTML`**:
```tsx
const htmlToPlainText = (value?: string | null) =>
  (value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
```

#### C. Struktur JSX Lembar Cetak A4
Gunakan kelas CSS global yang sudah ada di `src/styles/globals.css`:
```tsx
if (!template) return null;

const backgroundUrl = template.documentTemplate
  ? getObjectStorageUrl(template.documentTemplate)
  : fallbackBackground;
const signatureUrl = getObjectStorageUrl(template.personSignature);
const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';
const headerInformation = htmlToPlainText(template.headerInformation);
const footerInformation = htmlToPlainText(template.footerInformation);

return (
  <div className="accounting-print-root nama-fitur-print-root" aria-hidden="true">
    {pages.map((rows, pageIndex) => {
      const isLastPage = pageIndex === pages.length - 1;

      return (
        <section
          key={pageIndex}
          className="print-letter-page accounting-print-area nama-fitur-print-area"
          aria-label={`Halaman ${pageIndex + 1}`}
        >
          {/* 1. Background Kop Surat */}
          {backgroundUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={backgroundUrl} alt="" className="print-letterhead" />
          )}

          {/* 2. Konten Dokumen (dengan padding aman kop surat: 42mm atas, 38mm bawah) */}
          <div className="accounting-print-content nama-fitur-print-content">
            {/* Header Laporan */}
            <header className="border-b-2 pb-2 text-slate-950" style={{ borderColor: tableColor }}>
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[7pt] font-semibold uppercase tracking-[0.16em] text-slate-500">Laporan Akuntansi / Operasional</p>
                  <h1 className="mt-0.5 text-[13pt] font-bold uppercase tracking-[0.08em]">Nama Laporan</h1>
                  <p className="mt-0.5 text-[8pt] font-semibold uppercase text-slate-700">{companyName}</p>
                </div>
                <dl className="grid min-w-[60mm] grid-cols-[20mm_1fr] gap-x-2 gap-y-0.5 text-[7pt] leading-tight">
                  <dt className="text-slate-500">Periode</dt>
                  <dd className="font-medium">: {periodLabel}</dd>
                  <dt className="text-slate-500">Dicetak</dt>
                  <dd>: {formatCompactDate(printedAt)}</dd>
                </dl>
              </div>
              {headerInformation && (
                <p className="mt-2 max-w-[175mm] whitespace-pre-line text-[7pt] leading-snug text-slate-600">
                  {headerInformation}
                </p>
              )}
            </header>

            {/* Tabel Data dengan Colgroup Persentase & Theme Color */}
            <div className="mt-3 overflow-hidden border border-slate-400">
              <table className="w-full table-fixed border-collapse text-[6pt] leading-tight text-slate-900">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[25%]" />
                  <col className="w-[45%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead>
                  <tr className="text-white" style={{ backgroundColor: tableColor }}>
                    <th className="border border-white/30 px-1.5 py-1.5 text-left font-semibold uppercase">No</th>
                    <th className="border border-white/30 px-1.5 py-1.5 text-left font-semibold uppercase">Kode</th>
                    <th className="border border-white/30 px-1.5 py-1.5 text-left font-semibold uppercase">Deskripsi</th>
                    <th className="border border-white/30 px-1.5 py-1.5 text-right font-semibold uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item, rowIndex) => (
                    <tr key={item.id ?? rowIndex} className={rowIndex % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}>
                      <td className="border border-slate-300 px-1.5 py-1.5">{rowIndex + 1}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 font-mono">{item.code}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5">{item.description}</td>
                      <td className="border border-slate-300 px-1.5 py-1.5 text-right font-medium tabular-nums">{currenciesFormat('idr', item.amount)}</td>
                    </tr>
                  ))}
                  {/* Grand Total hanya di halaman terakhir */}
                  {isLastPage && data.length > 0 && (
                    <tr className="font-bold" style={{ backgroundColor: `${tableColor}14` }}>
                      <td colSpan={3} className="border border-slate-400 px-1.5 py-2 text-right uppercase">Grand Total</td>
                      <td className="border border-slate-400 px-1.5 py-2 text-right tabular-nums">{currenciesFormat('idr', grandTotal)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Laporan: Tanda Tangan (Hanya Halaman Terakhir) + Nomor Halaman */}
            <footer className="mt-auto pt-3 text-[7pt] text-slate-600">
              {isLastPage && (
                <div className="mb-[24mm] flex items-end justify-between gap-8">
                  <p className="max-w-[115mm] whitespace-pre-line leading-snug">{footerInformation}</p>
                  <div className="min-w-[45mm] text-center text-slate-800">
                    <p>Mengetahui,</p>
                    <div className="flex h-[16mm] items-center justify-center">
                      {signatureUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={signatureUrl} alt="" className="max-h-[16mm] max-w-[38mm] object-contain" />
                      )}
                    </div>
                    <p className="border-t border-slate-700 pt-1 font-semibold">{template.personSigner || '-'}</p>
                  </div>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-1.5 text-[6.5pt]">
                <span>Data halaman aplikasi {reportPage} · {reportTotal} total data</span>
                <span>Halaman {pageIndex + 1} dari {pages.length}</span>
              </div>
            </footer>
          </div>
        </section>
      );
    })}
  </div>
);
```

---

### 5. Aturan CSS & Layout Standar A4

1. **Ukuran Lembar A4 Fisik**:
   `.accounting-print-area` diatur ke ukuran tetap `width: 210mm; height: 296mm; max-height: 296.5mm; overflow: hidden !important; break-after: page; page-break-after: always;`.
2. **Padding Konten Terhadap Kop Surat**:
   `.accounting-print-content` memiliki padding `42mm 12mm 38mm !important;`. Margin atas 42mm dan bawah 38mm menjaga teks tidak menabrak header & footer kop surat fisik perusahaan.
3. **Penyembunyian Halaman Terakhir**:
   Selector `.accounting-print-area:last-child` secara otomatis menerapkan `break-after: avoid !important;` agar browser tidak menambahkan lembar putih kosong di akhir cetakan.
4. **Isolasi Elemen Web**:
   Selalu pastikan elemen web interaktif (sidebar, topbar, filter box, pagination, action button) tidak tercetak dengan menyematkan utility class `no-print`.

---

### 6. Checklist Verifikasi Implementasi Print

Sebelum menyelesaikan implementasi fitur print, pastikan seluruh poin berikut telah terpenuhi:
- [ ] Tombol cetak menggunakan icon `<Printer className="mr-2 h-4 w-4" />` dan memanggil `templatePrint.openPrintDialog`.
- [ ] `useReportTemplatePrint(selectedPrintBackground)` dipasang dengan fallback kop surat dari `getLetterheadByCompanyId(resolvedCompanyId)`.
- [ ] Komponen dialog `ReportTemplatePrintDialog` dipasang dengan state terikat ke hook `templatePrint`.
- [ ] Data dicetak dibagi ke dalam lembar halaman (`pages`) menggunakan chunking `ROWS_PER_PRINT_PAGE` (20-25 baris).
- [ ] Rich text template (`headerInformation`, `footerInformation`) disanitasi dengan `htmlToPlainText`, tanpa `dangerouslySetInnerHTML`.
- [ ] Warna tabel (`tableColor`) mengambil dari `template.tableColor` yang divalidasi regex hex, dengan fallback `#1f4163`.
- [ ] Tanda tangan (`personSignature`), penandatangan (`personSigner`), dan `footerInformation` hanya muncul di halaman terakhir (`isLastPage`).
- [ ] Grand total hanya muncul di halaman terakhir jika data tidak kosong.
- [ ] Nomor halaman ditampilkan di footer setiap lembar (`Halaman {pageIndex + 1} dari {pages.length}`).
- [ ] Dokumen cetak dibungkus class `.accounting-print-root` (tersembunyi saat di browser web biasa).
- [ ] Header, filter, tombol, dan komponen UI non-cetak dibungkus class `.no-print`.
