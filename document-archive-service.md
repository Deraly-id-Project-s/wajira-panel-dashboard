# Dokumentasi API: Document Archive & Document Code

Dokumentasi teknis untuk integrasi modul **Document Archive (Arsip Dokumen)** dan **Document Code (Referensi Kode Dokumen)** pada backend Wajira (Laravel 11). Didesain agar mudah dipahami oleh developer maupun AI agent pada frontend Next.js saat membangun fitur arsip dokumen, export laporan, revisi berkas, dan penomoran otomatis.

---

## 1. Arsitektur & Komponen Utama

### 1.1 Struktur Berkas Backend
- **Service Arsip**: `app/Services/DocumentArchiveService.php`
- **Controller Arsip**: `app/Http/Controllers/Other/DocumentArchiveController.php`
- **Model Arsip**: `app/Models/DocumentArchive.php`
- **Controller Kode Dokumen**: `app/Http/Controllers/Other/DocumentCodeController.php`
- **Model Kode Dokumen**: `app/Models/DocumentCode.php`
- **Enum Tipe Dokumen**: `app/Enums/DocumentArchiveTypeEnum.php`
- **Seeder Kode Dokumen**: `database/seeders/DocumentCodeSeeder.php`
- **Storage Driver**: `rfs` (RustFS S3-Compatible via `App\Traits\RFSTrait`), folder: `document_archives`

### 1.2 Aturan Kunci Backend (PENTING untuk Frontend)
1. **Kolom Penyimpanan Berkas adalah `file`**: Istilah `file_path` telah dihapus. Parameter form data upload berkas fisik maupun string path hasil pre-upload menggunakan key **`file`**.
2. **Penentuan `format` Otomatis oleh Backend**: Client **tidak perlu dan tidak boleh mengirimkan `format`** pada request body `store` maupun `update`. Backend mendeteksi format secara otomatis dari ekstensi berkas (`pdf` atau `docx`).
3. **Penomoran & Kode Dokumen Otomatis**: Field `document_code` bersifat opsional. Jika input form dikosongkan (`""` atau `null`), backend otomatis mengambil prefix dari model `DocumentCode` berdasarkan `type` ([DocumentArchiveTypeEnum](file:///home/popo/Documents/project/project-wajira/finance-be/app/Enums/DocumentArchiveTypeEnum.php)) dan menghasilkan kode unik terurut.

### 1.3 Referensi Tipe Dokumen (`DocumentArchiveTypeEnum`)
| Value (`type`) | Label | Default Prefix (`code`) | Kegunaan |
|---|---|---|---|
| `invoice_purchase` | Invoice Purchase | `INV` | Faktur tagihan, invoice pembelian unit/sparepart |
| `report` | Report | `RPT` | Arsip laporan keuangan (Arus Kas, Neraca, Laba Rugi), operasional |
| `letter` | Letter | `LTR` | Surat jalan, surat perjanjian, surat dinas |
| `other` | Other | `DOC` | Dokumen pendukung umum lainnya |

---

## 2. Referensi Endpoint REST API

Semua request wajib menyertakan autentikasi Bearer JWT:
```http
Authorization: Bearer <TOKEN>
Accept: application/json
```

Prefix URL dapat diakses melalui `/wapi/other/...` maupun direct alias `/wapi/...`.

---

### 2.1 Modul Referensi Kode Dokumen (`DocumentCode`)

Digunakan untuk mengambil daftar referensi kode/prefix dokumen dan memperbarui kode format yang digunakan oleh sistem.

#### A. Daftar Kode Dokumen (`index`)
- **Method**: `GET`
- **URL**: `/wapi/other/document-code` (atau `/wapi/document-code`)
- **Query Params**:
  - `search` *(opsional)*: Cari nama, kode, atau deskripsi
  - `type` *(opsional)*: Filter tipe enum (`invoice_purchase`, `report`, `letter`, `other`)
  - `per_page` *(opsional)*: Jumlah per halaman (default: `10`)
  - `sort_by` *(opsional)*: `id`, `name`, `code`, `type`, `created_at`
  - `sort_order` *(opsional)*: `asc` | `desc`

##### Contoh Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Document Code list retrieved successfully",
  "errors": null,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "name": "Invoice Purchase",
        "code": "INV",
        "type": "invoice_purchase",
        "description": "Document code for invoice purchase archives",
        "created_at": "2026-11-12T22:00:00.000000Z",
        "updated_at": "2026-11-12T22:00:00.000000Z"
      },
      {
        "id": 2,
        "name": "Report",
        "code": "RPT",
        "type": "report",
        "description": "Document code for report archives",
        "created_at": "2026-11-12T22:00:00.000000Z",
        "updated_at": "2026-11-12T22:00:00.000000Z"
      }
    ],
    "total": 4
  }
}
```

#### B. Update Referensi Kode Dokumen (`update`)
- **Method**: `PUT` / `PATCH`
- **URL**: `/wapi/other/document-code/{id}`
- **Request Body (JSON)**:
```json
{
  "code": "LAP",
  "description": "Prefix custom untuk laporan keuangan bulanan"
}
```

---

### 2.2 Modul Arsip Dokumen (`DocumentArchive`)

#### A. Ambil Nomor Terakhir & Saran Kode Dokumen (`latest-number`)
Sangat berguna untuk tombol **"Ambil Kode"** pada UI Frontend Next.js.
- **Method**: `GET`
- **URL**: `/wapi/other/document-archive/latest-number?type=report`

##### Response Sukses (200 OK):
```json
{
  "status": true,
  "message": "Latest document number retrieved successfully",
  "errors": null,
  "data": {
    "type": "report",
    "latest_number": 15,
    "next_number": 16,
    "suggested_code": "RPT-202611-0016"
  }
}
```

---

#### B. Upload File Mandiri (`store-file`)
Digunakan jika frontend ingin mengunggah file terlebih dahulu sebelum mengirim form utama (alur 2 langkah).
- **Method**: `POST`
- **URL**: `/wapi/other/document-archive/store-file`
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: File binary (PDF atau DOCX/DOC, Maks. 20MB)

##### Response Sukses (201 Created):
```json
{
  "status": true,
  "message": "Document archive file uploaded successfully",
  "errors": null,
  "data": {
    "file": "document_archives/1731248000_6730a1b2c3d4e.pdf",
    "file_url": "https://storage.domain.com/wajirafs/document_archives/1731248000_6730a1b2c3d4e.pdf",
    "format": "pdf",
    "original_name": "Laporan_Arus_Kas_November_2026.pdf",
    "size": 154820
  }
}
```

---

#### C. Simpan Arsip Dokumen Baru (`store`)
Menyimpan record arsip dokumen baru. Bisa langsung menyertakan file binary (`multipart/form-data`) **atau** menyertakan string path dari hasil `store-file` (`application/json`).

- **Method**: `POST`
- **URL**: `/wapi/other/document-archive`
- **Content-Type**: `multipart/form-data` ATAU `application/json`

##### Spesifikasi Request Body:
| Field | Tipe | Wajib? | Keterangan |
|---|---|---|---|
| `name` | String | **Ya** | Judul / nama arsip dokumen (Maks: 255) |
| `type` | String | **Ya** | `invoice_purchase`, `report`, `letter`, atau `other` |
| `file` | File / String | **Ya** | Berkas binary **atau** string path dari response `store-file` |
| `document_code` | String | Opsional | Jika kosong/tidak dikirim, backend otomatis men-generate dari `DocumentCode` |
| `document_number`| Integer | Opsional | Jika kosong, otomatis increment |
| `previous_document_id` | Integer | Opsional | ID dokumen sebelumnya jika dokumen ini adalah revisi |
| `is_latest` | Boolean | Opsional | Default: `true` |
| `is_active` | Boolean | Opsional | Default: `true` |
| `expired_at` | String | Opsional | Format `YYYY-MM-DD` atau `null` |
| `notes` | String | Opsional | Catatan tambahan |

> [!IMPORTANT]
> Field `format` **tidak perlu dikirim** oleh frontend. Backend secara otomatis menentukan format dokumen (`pdf` atau `docx`).

##### Contoh Payload 1 (Multipart Form-Data — Unggah Langsung):
```http
POST /wapi/other/document-archive
Content-Type: multipart/form-data

name: Laporan Arus Kas Periode November 2026
type: report
file: (binary PDF)
notes: Diekspor otomatis dari modul Laporan Arus Kas
```

##### Contoh Payload 2 (JSON — Menggunakan path dari `store-file`):
```json
{
  "name": "Laporan Arus Kas Periode November 2026",
  "type": "report",
  "file": "document_archives/1731248000_6730a1b2c3d4e.pdf",
  "document_code": "RPT-202611-0016",
  "notes": "Diekspor otomatis dari modul Laporan Arus Kas"
}
```

##### Response Sukses (201 Created):
```json
{
  "status": true,
  "message": "Document Archive created successfully",
  "errors": null,
  "data": {
    "id": 20,
    "uuid": "4c8f58b0-a39c-4976-9d32-2d93e1b73e51",
    "previous_document_id": null,
    "document_number": 16,
    "document_code": "RPT-202611-0016",
    "name": "Laporan Arus Kas Periode November 2026",
    "type": "report",
    "format": "pdf",
    "file": "document_archives/1731248000_6730a1b2c3d4e.pdf",
    "file_url": "https://storage.domain.com/wajirafs/document_archives/1731248000_6730a1b2c3d4e.pdf",
    "is_latest": true,
    "is_active": true,
    "is_expired": false,
    "expired_at": null,
    "notes": "Diekspor otomatis dari modul Laporan Arus Kas",
    "created_at": "2026-11-12T22:15:00.000000Z",
    "updated_at": "2026-11-12T22:15:00.000000Z",
    "previous_document": null,
    "revisions": []
  }
}
```

---

#### D. Daftar Arsip Dokumen (`index`)
- **Method**: `GET`
- **URL**: `/wapi/other/document-archive`
- **Query Params**:
  - `search`: Pencarian nama, kode dokumen, atau catatan
  - `type`: Filter `invoice_purchase` | `report` | `letter` | `other`
  - `format`: Filter `pdf` | `docx`
  - `is_latest`: Filter versi terbaru (`true` / `false`)
  - `is_active`: Filter dokumen aktif (`true` / `false`)
  - `is_expired`: Filter kedaluwarsa (`true` / `false`)
  - `previous_document_id`: Filter rantai revisi dokumen
  - `per_page`: Jumlah data per halaman (default `10`)
  - `sort_by`: Kolom sort (default `id`, mendukung `file`, `name`, `type`, dll.)
  - `sort_order`: `asc` | `desc`

---

#### E. Detail Arsip Dokumen (`show`)
- **Method**: `GET`
- **URL**: `/wapi/other/document-archive/{id}` (`{id}` bisa ID integer atau UUID)
- **Response**: Mengembalikan objek arsip lengkap dengan relasi `previousDocument`, `revisions`, dan `unitTransactions`.

---

#### F. Update Arsip Dokumen (`update`)
- **Method**: `PUT` / `PATCH`
- **URL**: `/wapi/other/document-archive/{id}`
- **Catatan**: Jika field `document_code` dikirim dengan string kosong `""`, backend otomatis men-generate kode baru berdasarkan `DocumentCode` dan tipe dokumen yang aktif.

---

#### G. Ganti File Dokumen Eksisting (`update-file`)
- **Method**: `POST` (atau `PUT`)
- **URL**: `/wapi/other/document-archive/{id}/update-file`
- **Content-Type**: `multipart/form-data`
- **Form Data**: `file` (berkas binary baru). Berkas fisik lama di RFS storage akan langsung dihapus dan format otomatis diperbarui.

---

#### H. Hapus Arsip Dokumen (`destroy`)
- **Method**: `DELETE`
- **URL**: `/wapi/other/document-archive/{id}`
- **Catatan**: Menggunakan soft delete. Jika dokumen yang dihapus adalah versi terbaru (`is_latest = true`) dari sebuah rantai revisi, versi sebelumnya otomatis dinaikkan kembali menjadi `is_latest = true`.

---

## 3. Panduan Integrasi Frontend Next.js (AI-Friendly Guide)

Panduan ini disiapkan agar AI Frontend Next.js dapat membuat komponen form, modal export, atau tombol aksi dengan cepat.

### 3.1 Skenario Contoh: Fitur Laporan Arus Kas (Export & Arsipkan)

Saat user mengklik **"Export & Arsipkan Laporan"**, modal UI menampilkan:
1. **Nama Dokumen**: Default terisi otomatis, misal: `"Laporan Arus Kas Periode 2026-11"`.
2. **Tipe Dokumen**: Dropdown memilih `report` (atau auto-select).
3. **Kode Dokumen**:
   - Terdapat **Button "Ambil Kode"**: Memanggil `GET /wapi/other/document-archive/latest-number?type=report`, lalu mengisikan `data.suggested_code` ke dalam input.
   - Input tetap bersifat fleksibel (bisa diedit manual oleh user). Jika dibiarkan kosong, backend tetap akan mengisinya otomatis.
4. **ID Dokumen Sebelumnya (Revisi)**:
   - Terdapat **Button "Ambil ID / Pilih Dokumen Lama"**: Menampilkan pencarian arsip lama (`GET /wapi/other/document-archive?type=report&is_latest=true`) untuk memilih dokumen yang ingin direvisi (`previous_document_id`).
5. **Aksi Export**:
   - Frontend meng-generate PDF laporan (atau menerima file blob hasil export).
   - Mengirim berkas blob tersebut bersama form metadata ke `POST /wapi/other/document-archive`.

### 3.2 TypeScript Type Definitions (Next.js)

```typescript
// Enum Tipe Dokumen
export enum DocumentArchiveType {
  INVOICE_PURCHASE = 'invoice_purchase',
  REPORT = 'report',
  LETTER = 'letter',
  OTHER = 'other',
}

// Model Referensi Kode Dokumen
export interface DocumentCode {
  id: number;
  name: string;
  code: string;
  type: DocumentArchiveType;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

// Model Data Arsip Dokumen
export interface DocumentArchive {
  id: number;
  uuid: string;
  previous_document_id?: number | null;
  document_number: number;
  document_code: string;
  is_latest: boolean;
  type: DocumentArchiveType;
  name: string;
  format: 'pdf' | 'docx';
  file: string;           // Path relatif di RFS
  file_url: string | null; // URL publik/signed untuk preview atau download
  is_active: boolean;
  is_expired: boolean;
  expired_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  previous_document?: DocumentArchive | null;
  revisions?: DocumentArchive[];
}

// Request Body untuk Simpan / Export Dokumen
export interface CreateDocumentArchivePayload {
  name: string;
  type: DocumentArchiveType;
  file: File | string; // File binary jika direct upload, atau string path jika 2-step
  document_code?: string; // Opsional: kosongkan untuk auto-generate dari DocumentCode
  document_number?: number;
  previous_document_id?: number | null;
  expired_at?: string | null;
  notes?: string | null;
}
```

### 3.3 Helper API Client di Next.js

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.wajira.domain/wapi',
});

// 1. Ambil Saran Kode Dokumen Otomatis
export async function getSuggestedDocumentCode(type: DocumentArchiveType): Promise<string> {
  const res = await api.get('/other/document-archive/latest-number', {
    params: { type },
  });
  return res.data.data.suggested_code;
}

// 2. Ambil Referensi Prefix Kode Dokumen
export async function getDocumentCodes(): Promise<DocumentCode[]> {
  const res = await api.get('/other/document-code');
  return res.data.data.data;
}

// 3. Simpan Arsip Dokumen (Direct Multipart Upload)
export async function createDocumentArchive(payload: CreateDocumentArchivePayload): Promise<DocumentArchive> {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('type', payload.type);

  if (payload.file instanceof File) {
    formData.append('file', payload.file);
  } else {
    formData.append('file', payload.file); // path hasil storeFile
  }

  if (payload.document_code) formData.append('document_code', payload.document_code);
  if (payload.document_number) formData.append('document_number', String(payload.document_number));
  if (payload.previous_document_id) formData.append('previous_document_id', String(payload.previous_document_id));
  if (payload.expired_at) formData.append('expired_at', payload.expired_at);
  if (payload.notes) formData.append('notes', payload.notes);

  const res = await api.post('/other/document-archive', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return res.data.data;
}
```

---

## 4. Contoh Penggunaan Service di PHP (Backend Internal)

Jika Anda membuat controller baru (seperti Controller Export Laporan Arus Kas) di backend dan ingin langsung menyimpan arsip secara programatik:

```php
use App\Enums\DocumentArchiveTypeEnum;
use App\Services\DocumentArchiveService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

class CashFlowReportController extends Controller
{
    protected DocumentArchiveService $archiveService;

    public function __construct(DocumentArchiveService $archiveService)
    {
        $this->archiveService = $archiveService;
    }

    public function exportAndArchive(Request $request)
    {
        // 1. Generate PDF laporan secara internal di server
        $pdfContent = $this->generateCashFlowPdf();
        
        // Simpan sementara ke temporary file untuk UploadedFile instance
        $tempPath = tempnam(sys_get_temp_dir(), 'cash_flow_');
        file_put_contents($tempPath, $pdfContent);
        $uploadedFile = new UploadedFile($tempPath, 'Laporan_Arus_Kas.pdf', 'application/pdf', null, true);

        // 2. Simpan file fisik ke RFS storage
        $storedFile = $this->archiveService->storeArchiveFile($uploadedFile);

        // 3. Simpan record DocumentArchive (Kode & Format otomatis dihandle oleh Service)
        $archive = $this->archiveService->store([
            'name' => 'Laporan Arus Kas - ' . now()->format('F Y'),
            'type' => DocumentArchiveTypeEnum::REPORT->value,
            'file' => $storedFile, // format otomatis dideteksi menjadi 'pdf'
            'notes' => 'Export otomatis oleh sistem',
            // 'document_code' sengaja dikosongkan agar otomatis menggunakan prefix dari DocumentCode ('RPT')
        ]);

        @unlink($tempPath);

        return response()->json([
          'status' => true,
          'message' => 'Laporan berhasil diexport dan diarsipkan',
          'data' => $archive,
        ]);
    }
}
```
