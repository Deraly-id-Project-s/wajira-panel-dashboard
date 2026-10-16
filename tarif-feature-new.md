# Dokumentasi API: Master Data Tarif & Multiple Routes

Dokumentasi ini ditujukan untuk tim Frontend (Next.js / TypeScript) terkait pembaruan skema pada Master Data **Tarif** dan penambahan Master Data **Route** dengan relasi Many-to-Many melalui pivot **`tarif_routes`**.

---

## 1. Ringkasan Perubahan Skema (Schema Overview)

1. **Penghapusan Kolom `loading_in` dan `loading_out`**:
   - Kolom `loading_in` dan `loading_out` pada tabel `tarifs` telah **dihapus**.
   - Sebagai gantinya, 1 Tarif kini dapat memiliki banyak titik rute (**Multiple Routes**) melalui tabel pivot `tarif_routes`.
2. **Master Data Baru: `Route` (`routes`)**:
   - Menyimpan informasi titik/lokasi rute logistik (nama pool, alamat, tautan Google Maps, catatan, dll.).
3. **Tabel Pivot: `tarif_routes`**:
   - Menghubungkan `tarifs` dengan `routes`.
   - Memiliki kolom `state_at` yang bersifat fleksibel untuk menyimpan urutan/peran titik (misal: `"origin"`, `"destination"`, `"loading_in"`, `"loading_out"`, `"stop_1"`, dsb.).
4. **Relasi Model**:
   - `Tarif` has many `routes` (via `tarif_routes` dengan pivot `id`, `state_at`).
   - `Route` has many `tarifs` (via `tarif_routes`).

---

## 2. TypeScript Definitions (Untuk Next.js)

Salin interface berikut ke project Next.js Anda (misal: `types/tarif.ts` atau `types/route.ts`):

```typescript
// Envelope respons standar API Wajira Backend
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  errors: Record<string, string[]> | string | null;
  data: T;
}

// Format pagination Laravel
export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

// Model Route
export interface RouteModel {
  id: number;
  uuid: string;
  name: string;
  address: string | null;
  link: string | null;
  other_information: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  pivot?: TarifRoutePivot;
}

// Pivot Tarif - Route
export interface TarifRoutePivot {
  id: number;
  tarif_id: number;
  route_id: number;
  order: number;
  state_at: 'loading_in' | 'loading_out';
  created_at: string;
  updated_at: string;
}

// Price Version untuk Tarif (Uang Jalan)
export interface TarifPriceVersion {
  id: number;
  uuid: string;
  tarif_id: number;
  name: string | null;
  uj_towing: number;
  uj_cdd: number;
  uj_fuso: number;
  effective_from: string | null;
  effective_until: string | null;
  is_default: boolean;
  is_lock: boolean;
  created_at: string;
  updated_at: string;
}

// Model Tarif
export interface TarifModel {
  id: number;
  uuid: string;
  distance: number;
  inv_cdd: number;
  inv_fuso: number;
  inv_towing: number;
  is_active: number | boolean;
  created_at: string;
  updated_at: string;
  // Dynamic Accessors (Uang Jalan dari version aktif)
  uj_towing: number;
  uj_cdd: number;
  uj_fuso: number;
  // Relasi
  routes?: RouteModel[];
  tarif_price_versions?: TarifPriceVersion[];
}

// Request Payload: Route
export interface CreateRoutePayload {
  name: string;
  address?: string | null;
  link?: string | null;
  other_information?: string | null;
  description?: string | null;
}

export type UpdateRoutePayload = Partial<CreateRoutePayload>;

// Item Route dalam form Tarif
export interface TarifRouteInput {
  route_id: number;
  order?: number;
  state_at: 'loading_in' | 'loading_out';
}

// Request Payload: Tarif
export interface CreateTarifPayload {
  distance: number;
  inv_cdd?: number | null;
  inv_fuso?: number | null;
  inv_towing?: number | null;
  uj_towing?: number | null;
  uj_cdd?: number | null;
  uj_fuso?: number | null;
  is_active?: boolean;
  // Mendukung array of object (dengan state_at) atau array of ID sederhana [1, 2]
  routes?: TarifRouteInput[] | number[];
}

export type UpdateTarifPayload = Partial<CreateTarifPayload>;
```

---

## 3. Endpoints Master Data Route

Prefix URL: `/wapi/master-data/route`  
Header yang diperlukan:
- `Authorization: Bearer <jwt_token>`
- `Accept: application/json`
- `Content-Type: application/json`

### 3.1. List Routes
- **Endpoint**: `GET /wapi/master-data/route`
- **Query Parameters**:
  - `search` *(string, optional)*: Pencarian berdasarkan `name`, `address`, `other_information`, `description`.
  - `per_page` *(integer, optional)*: Jumlah data per halaman (default: `10`, gunakan `-1` untuk semua data tanpa pagination).
  - `page` *(integer, optional)*: Halaman aktif.
  - `sort_by` *(string, optional)*: Kolom sorting (`id`, `name`, `address`, `created_at`). Default: `id`.
  - `sort_order` *(string, optional)*: `asc` | `desc`. Default: `desc`.

**Contoh Response (200 OK)**:
```json
{
  "status": true,
  "message": "Routes retrieved successfully",
  "errors": null,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "uuid": "4f54e12e-13c5-4a62-81e0-3949f57d6efc",
        "name": "Pool Cakung",
        "address": "Jl. Raya Cakung No. 12, Jakarta Timur",
        "link": "https://maps.google.com/?q=-6.182,106.942",
        "other_information": "Pintu gerbang timur",
        "description": "Pool pusat armada Jakarta",
        "created_at": "2026-10-15T14:00:00.000000Z",
        "updated_at": "2026-10-15T14:00:00.000000Z"
      },
      {
        "id": 2,
        "uuid": "8e31b632-6804-4c47-81bd-3453715cbebb",
        "name": "Gudang Surabaya Rungkut",
        "address": "Kawasan Industri Rungkut, Surabaya",
        "link": "https://maps.google.com/?q=-7.321,112.753",
        "other_information": "Bongkar muat dok 3",
        "description": "Area distribusi Jawa Timur",
        "created_at": "2026-10-15T14:05:00.000000Z",
        "updated_at": "2026-10-15T14:05:00.000000Z"
      }
    ],
    "first_page_url": "http://api.domain/wapi/master-data/route?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://api.domain/wapi/master-data/route?page=1",
    "links": [],
    "next_page_url": null,
    "path": "http://api.domain/wapi/master-data/route",
    "per_page": 10,
    "prev_page_url": null,
    "to": 2,
    "total": 2
  }
}
```

---

### 3.2. Detail Route
- **Endpoint**: `GET /wapi/master-data/route/{id}`
- **Parameter**: `{id}` bisa berupa ID integer (`1`) atau `uuid` (`4f54e12e-13c5-4a62-81e0-3949f57d6efc`).

**Contoh Response (200 OK)**:
```json
{
  "status": true,
  "message": "Route retrieved successfully",
  "errors": null,
  "data": {
    "id": 1,
    "uuid": "4f54e12e-13c5-4a62-81e0-3949f57d6efc",
    "name": "Pool Cakung",
    "address": "Jl. Raya Cakung No. 12, Jakarta Timur",
    "link": "https://maps.google.com/?q=-6.182,106.942",
    "other_information": "Pintu gerbang timur",
    "description": "Pool pusat armada Jakarta",
    "created_at": "2026-10-15T14:00:00.000000Z",
    "updated_at": "2026-10-15T14:00:00.000000Z",
    "tarifs": []
  }
}
```

---

### 3.3. Create Route
- **Endpoint**: `POST /wapi/master-data/route`
- **Request Body**:
```json
{
  "name": "Pool Cakung",
  "address": "Jl. Raya Cakung No. 12, Jakarta Timur",
  "link": "https://maps.google.com/?q=-6.182,106.942",
  "other_information": "Pintu timur khusus truk besar",
  "description": "Pool operasional unit Jakarta"
}
```
**Contoh Response (201 Created)**:
```json
{
  "status": true,
  "message": "Route created successfully",
  "errors": null,
  "data": {
    "id": 1,
    "uuid": "4f54e12e-13c5-4a62-81e0-3949f57d6efc",
    "name": "Pool Cakung",
    "address": "Jl. Raya Cakung No. 12, Jakarta Timur",
    "link": "https://maps.google.com/?q=-6.182,106.942",
    "other_information": "Pintu timur khusus truk besar",
    "description": "Pool operasional unit Jakarta",
    "created_at": "2026-10-15T14:10:00.000000Z",
    "updated_at": "2026-10-15T14:10:00.000000Z"
  }
}
```

---

### 3.4. Update Route
- **Endpoint**: `PUT /wapi/master-data/route/{id}`
- **Request Body**:
```json
{
  "name": "Pool Cakung Timur",
  "address": "Jl. Raya Cakung No. 14, Jakarta Timur"
}
```
**Contoh Response (200 OK)**:
```json
{
  "status": true,
  "message": "Route updated successfully",
  "errors": null,
  "data": {
    "id": 1,
    "uuid": "4f54e12e-13c5-4a62-81e0-3949f57d6efc",
    "name": "Pool Cakung Timur",
    "address": "Jl. Raya Cakung No. 14, Jakarta Timur",
    "link": "https://maps.google.com/?q=-6.182,106.942",
    "other_information": "Pintu timur khusus truk besar",
    "description": "Pool operasional unit Jakarta",
    "created_at": "2026-10-15T14:10:00.000000Z",
    "updated_at": "2026-10-15T14:15:00.000000Z"
  }
}
```

---

### 3.5. Delete Route
- **Endpoint**: `DELETE /wapi/master-data/route/{id}`
- **Catatan**: Jika route sedang digunakan dalam salah satu master tarif, API akan mengembalikan status 422 untuk menjaga integritas data.

**Contoh Response Berhasil (200 OK)**:
```json
{
  "status": true,
  "message": "Route deleted successfully",
  "errors": null,
  "data": []
}
```

**Contoh Response Gagal jika terhubung ke Tarif (422 Unprocessable Content)**:
```json
{
  "status": false,
  "message": "Cannot delete route because it is linked to one or more tariffs",
  "errors": null,
  "data": null
}
```

---

## 4. Endpoints Master Data Tarif

Prefix URL: `/wapi/master-data/tarif`

### 4.1. List Tarifs
- **Endpoint**: `GET /wapi/master-data/tarif`
- **Query Parameters**:
  - `search` *(string, optional)*: Pencarian berdasarkan nama rute atau alamat rute (`routes.name`, `routes.address`).
  - `route_id` *(integer, optional)*: Filter tarif yang memiliki rute tertentu.
  - `is_active` *(boolean / 0 / 1, optional)*: Filter tarif aktif/nonaktif.
  - `per_page` *(integer, optional)*: Jumlah item per halaman (default: `10`, `-1` untuk semua data).
  - `page` *(integer, optional)*: Nomor halaman.
  - `sort_by` *(string, optional)*: `id`, `distance`, `inv_cdd`, `inv_fuso`, `inv_towing`, `created_at`.
  - `sort_order` *(string, optional)*: `asc` | `desc`.

**Contoh Response (200 OK)**:
```json
{
  "status": true,
  "message": "Tarif list retrieved successfully",
  "errors": null,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 10,
        "uuid": "7a3089d4-63bd-4740-967a-1c7ee07c0879",
        "distance": 780,
        "inv_cdd": 3500000,
        "inv_fuso": 6000000,
        "inv_towing": 2500000,
        "is_active": 1,
        "uj_towing": 2000000,
        "uj_cdd": 3000000,
        "uj_fuso": 5000000,
        "created_at": "2026-10-15T14:20:00.000000Z",
        "updated_at": "2026-10-15T14:20:00.000000Z",
        "routes": [
          {
            "id": 1,
            "uuid": "4f54e12e-13c5-4a62-81e0-3949f57d6efc",
            "name": "Pool Cakung",
            "address": "Jl. Raya Cakung No. 12, Jakarta Timur",
            "link": "https://maps.google.com/?q=-6.182,106.942",
            "pivot": {
              "tarif_id": 10,
              "route_id": 1,
              "state_at": "origin"
            }
          },
          {
            "id": 2,
            "uuid": "8e31b632-6804-4c47-81bd-3453715cbebb",
            "name": "Gudang Surabaya Rungkut",
            "address": "Kawasan Industri Rungkut, Surabaya",
            "link": "https://maps.google.com/?q=-7.321,112.753",
            "pivot": {
              "tarif_id": 10,
              "route_id": 2,
              "state_at": "destination"
            }
          }
        ],
        "tarif_price_versions": [
          {
            "id": 10,
            "uuid": "04bf4087-2591-4cf4-b893-6a978f5a4a5d",
            "tarif_id": 10,
            "name": "Initial Price",
            "uj_towing": 2000000,
            "uj_cdd": 3000000,
            "uj_fuso": 5000000,
            "is_default": true,
            "is_lock": false
          }
        ]
      }
    ],
    "total": 1,
    "per_page": 10,
    "current_page": 1
  }
}
```

---

### 4.2. Detail Tarif
- **Endpoint**: `GET /wapi/master-data/tarif/{id}`
- **Parameter**: `{id}` bisa berupa ID integer (`10`) atau `uuid` (`7a3089d4-63bd-4740-967a-1c7ee07c0879`).

**Contoh Response (200 OK)**:
```json
{
  "status": true,
  "message": "Tarif retrieved successfully",
  "errors": null,
  "data": {
    "id": 10,
    "uuid": "7a3089d4-63bd-4740-967a-1c7ee07c0879",
    "distance": 780,
    "inv_cdd": 3500000,
    "inv_fuso": 6000000,
    "inv_towing": 2500000,
    "is_active": 1,
    "uj_towing": 2000000,
    "uj_cdd": 3000000,
    "uj_fuso": 5000000,
    "routes": [
      {
        "id": 1,
        "uuid": "4f54e12e-13c5-4a62-81e0-3949f57d6efc",
        "name": "Pool Cakung",
        "address": "Jl. Raya Cakung No. 12, Jakarta Timur",
        "pivot": {
          "tarif_id": 10,
          "route_id": 1,
          "state_at": "origin"
        }
      },
      {
        "id": 2,
        "uuid": "8e31b632-6804-4c47-81bd-3453715cbebb",
        "name": "Gudang Surabaya Rungkut",
        "address": "Kawasan Industri Rungkut, Surabaya",
        "pivot": {
          "tarif_id": 10,
          "route_id": 2,
          "state_at": "destination"
        }
      }
    ],
    "tarif_price_versions": [
      {
        "id": 10,
        "name": "Initial Price",
        "uj_towing": 2000000,
        "uj_cdd": 3000000,
        "uj_fuso": 5000000,
        "is_default": true
      }
    ]
  }
}
```

---

### 4.3. Create Tarif
- **Endpoint**: `POST /wapi/master-data/tarif`
- **Request Body (Format Lengkap Rekomendasi)**:
```json
{
  "distance": 780,
  "inv_cdd": 3500000,
  "inv_fuso": 6000000,
  "inv_towing": 2500000,
  "uj_towing": 2000000,
  "uj_cdd": 3000000,
  "uj_fuso": 5000000,
  "is_active": true,
  "routes": [
    {
      "route_id": 1,
      "order": 1,
      "state_at": "loading_in"
    },
    {
      "route_id": 2,
      "order": 2,
      "state_at": "loading_out"
    }
  ]
}
```

> **Catatan Validasi Payload `routes`:**
> 1. `routes.*.route_id`: Wajib (`required`), integer, dan harus terdaftar di tabel `routes` (`exists:routes,id`). Bisa juga mengirimkan `uuid` string dari route (sistem otomatis melakukan resolve ke integer `id`).
> 2. `routes.*.order`: Opsional (`nullable`), integer. Jika tidak diisi, otomatis diurutkan dari urutan array (`$index + 1`).
> 3. `routes.*.state_at`: Wajib (`required`), string, harus salah satu dari: `loading_in` atau `loading_out` (`in:loading_in,loading_out`).
> 4. Mendukung stringified JSON string (misal dari `FormData`): `'[{"route_id": 1, "order": 1, "state_at": "loading_in"}, {"route_id": 2, "order": 2, "state_at": "loading_out"}]'`.

**Contoh Response (201 Created)**:
```json
{
  "status": true,
  "message": "Tarif created successfully",
  "errors": null,
  "data": {
    "id": 10,
    "uuid": "7a3089d4-63bd-4740-967a-1c7ee07c0879",
    "distance": 780,
    "inv_cdd": 3500000,
    "inv_fuso": 6000000,
    "inv_towing": 2500000,
    "is_active": 1,
    "uj_towing": 2000000,
    "uj_cdd": 3000000,
    "uj_fuso": 5000000,
    "created_at": "2026-10-15T14:20:00.000000Z",
    "updated_at": "2026-10-15T14:20:00.000000Z",
    "routes": [
      {
        "id": 1,
        "name": "Pool Cakung",
        "pivot": {
          "tarif_id": 10,
          "route_id": 1,
          "state_at": "origin"
        }
      },
      {
        "id": 2,
        "name": "Gudang Surabaya Rungkut",
        "pivot": {
          "tarif_id": 10,
          "route_id": 2,
          "state_at": "destination"
        }
      }
    ],
    "tarif_price_versions": [
      {
        "id": 10,
        "name": "Initial Price",
        "uj_towing": 2000000,
        "uj_cdd": 3000000,
        "uj_fuso": 5000000,
        "is_default": true
      }
    ]
  }
}
```

---

### 4.4. Update Tarif
- **Endpoint**: `PUT /wapi/master-data/tarif/{id}`
- **Request Body**:
```json
{
  "distance": 800,
  "inv_cdd": 3700000,
  "uj_cdd": 3100000,
  "routes": [
    {
      "route_id": 1,
      "order": 1,
      "state_at": "loading_in"
    },
    {
      "route_id": 2,
      "order": 2,
      "state_at": "loading_out"
    }
  ]
}
```
**Contoh Response (200 OK)**:
```json
{
  "status": true,
  "message": "Tarif updated successfully",
  "errors": null,
  "data": {
    "id": 10,
    "uuid": "7a3089d4-63bd-4740-967a-1c7ee07c0879",
    "distance": 800,
    "inv_cdd": 3700000,
    "inv_fuso": 6000000,
    "inv_towing": 2500000,
    "is_active": 1,
    "uj_towing": 2000000,
    "uj_cdd": 3100000,
    "uj_fuso": 5000000,
    "routes": [
      { "id": 1, "name": "Pool Cakung" },
      { "id": 3, "name": "Rest Area Km 207 Cirebon" },
      { "id": 2, "name": "Gudang Surabaya Rungkut" }
    ],
    "tarif_price_versions": [...]
  }
}
```

---

### 4.5. Delete Tarif
- **Endpoint**: `DELETE /wapi/master-data/tarif/{id}`

**Contoh Response Berhasil (200 OK)**:
```json
{
  "status": true,
  "message": "Tarif deleted successfully",
  "errors": null,
  "data": []
}
```

---

### 4.6. Export & Import Tarif
- **Export**: `GET /wapi/master-data/tarif/export` (Mengunduh file Excel `wajira_tarif_data.xlsx` dengan kolom rute gabungan).
- **Import**: `POST /wapi/master-data/tarif/import` (Form-data dengan field `file` berformat `.xlsx` atau `.xls`).

---

## 5. Contoh Implementasi Next.js (Client Component / Hook)

Berikut contoh implementasi di Next.js (App Router / Pages Router) menggunakan standard `fetch`:

```typescript
// lib/api/tarif.ts
import { 
  ApiResponse, 
  PaginatedData, 
  TarifModel, 
  RouteModel, 
  CreateTarifPayload 
} from "@/types/tarif";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.yourdomain.com/wapi";

function getHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// 1. Ambil daftar route untuk dropdown/select
export async function getRoutesOptions(token: string): Promise<RouteModel[]> {
  const res = await fetch(`${API_BASE}/master-data/route?per_page=-1`, {
    headers: getHeaders(token),
  });
  const json: ApiResponse<RouteModel[]> = await res.json();
  if (!json.status) throw new Error(json.message);
  return json.data;
}

// 2. Ambil daftar tarif
export async function getTarifList(
  token: string, 
  page = 1, 
  search = ""
): Promise<PaginatedData<TarifModel>> {
  const params = new URLSearchParams({ page: String(page), search });
  const res = await fetch(`${API_BASE}/master-data/tarif?${params}`, {
    headers: getHeaders(token),
  });
  const json: ApiResponse<PaginatedData<TarifModel>> = await res.json();
  if (!json.status) throw new Error(json.message);
  return json.data;
}

// 3. Simpan tarif baru beserta multiple routes
export async function createTarif(
  token: string, 
  payload: CreateTarifPayload
): Promise<TarifModel> {
  const res = await fetch(`${API_BASE}/master-data/tarif`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  const json: ApiResponse<TarifModel> = await res.json();
  if (!json.status) {
    throw new Error(typeof json.errors === "string" ? json.errors : json.message);
  }
  return json.data;
}
```

### Contoh Form Pengisian Tarif Multi-Route di Next.js:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { getRoutesOptions, createTarif } from "@/lib/api/tarif";
import { RouteModel, TarifRouteInput } from "@/types/tarif";

export default function CreateTarifForm({ token }: { token: string }) {
  const [availableRoutes, setAvailableRoutes] = useState<RouteModel[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [invCdd, setInvCdd] = useState<number>(0);
  const [ujCdd, setUjCdd] = useState<number>(0);

  // State rute dinamis (bisa tambah titik)
  const [selectedRoutes, setSelectedRoutes] = useState<TarifRouteInput[]>([
    { route_id: 0, state_at: "origin" },
    { route_id: 0, state_at: "destination" },
  ]);

  useEffect(() => {
    getRoutesOptions(token).then(setAvailableRoutes).catch(console.error);
  }, [token]);

  const handleAddStop = () => {
    setSelectedRoutes((prev) => [
      ...prev.slice(0, -1),
      { route_id: 0, state_at: `transit_${prev.length}` },
      prev[prev.length - 1], // Tetap jaga titik terakhir
    ]);
  };

  const handleRouteChange = (index: number, routeId: number) => {
    const updated = [...selectedRoutes];
    updated[index].route_id = routeId;
    setSelectedRoutes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validRoutes = selectedRoutes.filter((r) => r.route_id > 0);
      await createTarif(token, {
        distance,
        inv_cdd: invCdd,
        uj_cdd: ujCdd,
        routes: validRoutes,
      });
      alert("Tarif berhasil dibuat!");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <h2 className="text-xl font-bold">Buat Master Tarif Baru</h2>

      <div>
        <label className="block font-medium">Jarak (KM)</label>
        <input 
          type="number" 
          value={distance} 
          onChange={(e) => setDistance(Number(e.target.value))} 
          className="border p-2 w-full rounded"
          required 
        />
      </div>

      <div>
        <label className="block font-medium">Invoice CDD (Rp)</label>
        <input 
          type="number" 
          value={invCdd} 
          onChange={(e) => setInvCdd(Number(e.target.value))} 
          className="border p-2 w-full rounded" 
        />
      </div>

      <div>
        <label className="block font-medium">Uang Jalan CDD (Rp)</label>
        <input 
          type="number" 
          value={ujCdd} 
          onChange={(e) => setUjCdd(Number(e.target.value))} 
          className="border p-2 w-full rounded" 
        />
      </div>

      <div className="border-t pt-4">
        <label className="block font-medium mb-2">Titik Rute Pengiriman</label>
        {selectedRoutes.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center mb-2">
            <span className="w-24 text-sm font-semibold capitalize text-gray-600">
              {item.state_at}:
            </span>
            <select
              value={item.route_id}
              onChange={(e) => handleRouteChange(idx, Number(e.target.value))}
              className="border p-2 rounded flex-1"
              required
            >
              <option value={0}>-- Pilih Rute --</option>
              {availableRoutes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.address || "Tanpa alamat"})
                </option>
              ))}
            </select>
          </div>
        ))}

        <button 
          type="button" 
          onClick={handleAddStop} 
          className="text-sm text-blue-600 underline mt-2"
        >
          + Tambah Titik Transit
        </button>
      </div>

      <button 
        type="submit" 
        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
      >
        Simpan Tarif
      </button>
    </form>
  );
}
```
