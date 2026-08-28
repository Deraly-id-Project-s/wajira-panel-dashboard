# File Instruction

Dokumen ini wajib dibaca terlebih dahulu oleh AI MVC sebelum menerapkan fitur baru, komponen baru, atau perubahan UI baru pada project ini. Tujuannya agar implementasi berikutnya memakai komponen reusable yang sudah tersedia, menjaga konsistensi tampilan, dan menghindari duplikasi komponen.

## Aturan Umum

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
| Input teks | `src/components/ui/input.tsx` | Gunakan untuk semua input text/number/date native sebelum membuat input custom. |
| Input nominal | `src/components/ui/money-input.tsx` | Gunakan untuk nilai uang agar format dan parsing konsisten. |
| Input angka terbatas | `src/components/ui/clamped-numeric-input.tsx` | Gunakan untuk numeric input dengan batas min/max. |
| Upload file | `src/components/ui/file-input.tsx` | Gunakan untuk upload file. Set `name`, `accept`, `helperText`, dan validasi ukuran/tipe pada komponen fitur bila aturan API berbeda. |
| Textarea | `src/components/ui/textarea.tsx` | Gunakan untuk input multi-line. |
| Label | `src/components/ui/label.tsx` | Gunakan sebagai label form. Jaga spacing label dan input konsisten, umumnya wrapper `space-y-2`. |
| Form dengan react-hook-form | `src/components/ui/form.tsx` | Gunakan untuk form kompleks yang membutuhkan validation state dan `FormMessage`. |
| Modal form | `src/components/ui/form-dialog.tsx` | Gunakan untuk dialog create/edit sederhana dengan submit/cancel standar. |
| Dialog primitive | `src/components/ui/dialog.tsx` | Gunakan jika layout dialog butuh kontrol khusus. |
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
| Header halaman umum | `src/components/common/PageHeader.tsx` | Gunakan untuk judul dan deskripsi halaman. |
| Section wrapper | `src/components/common/SectionCard.tsx` | Gunakan untuk section konten yang membutuhkan card wrapper sederhana. |
| Halaman surat/print | `src/components/common/PrintLetterPage.tsx` | Gunakan untuk tampilan print dokumen atau surat. |

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
