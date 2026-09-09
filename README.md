# 🏢 Wajira Dashboard

> **Dashboard ERP Modern untuk Manajemen Multi-Perusahaan**  
> *Sistem terintegrasi kanggo ngatur data penjualan, inventory, lan finansial perusahaan grup Wajira*

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## Daftar Isi

- [Tentang Project](#-tentang-project)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Getting Started](#-getting-started)
- [Sistem Autentikasi](#-sistem-autentikasi)
- [Company Context System](#-company-context-system)
- [Development Guide](#-development-guide)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## Tentang Project

**Wajira Dashboard** adalah aplikasi web-based ERP (Enterprise Resource Planning) yang dirancang khusus untuk mengelola operasional multi-perusahaan di grup Wajira. Dashboard ini menyediakan antarmuka yang modern, responsif, dan user-friendly untuk memantau data penjualan, inventory, keuangan, dan laporan bisnis secara real-time.

### Kenapa Dashboard Ini Dibuat?

Dashboard ini ngatasi beberapa pain points:
-  **Multi-Company Management**: Satu user bisa akses dan switch antar beberapa perusahaan
-  **Real-time Monitoring**: Data finansial dan operasional ter-update otomatis
-  **Modern UI/UX**: Interface yang apik lan gampang digunakne
-  **Role-based Access**: Sistem permission sing terstruktur kanggo keamanan data

---

##  Fitur Utama

###  Authentication & Authorization
- [x] Login page dengan split-screen modern design
- [x] Token-based authentication
- [x] Route guards untuk proteksi halaman
- [x] Auto-redirect berdasarkan auth state

### Multi-Company System
- [x] Company selection page setelah login
- [x] Dynamic company selector di sidebar
- [x] Seamless switch antar perusahaan
- [x] Company-specific data isolation

### Dashboard & Analytics
- [x] Overview keuangan (BCA, RCA, Cash, Net Worth)
- [x] Grafik tren keuangan bulanan
- [x] Chart Pemasukan dengan visualization
- [x] Responsive cards dengan animasi

###  Sales Management
- [x] Daftar penjualan dengan pagination
- [x] Detail penjualan unit
- [x] Edit penjualan (form lengkap)
- [x] Dynamic table dengan animasi hover
- [x] Bulk selection & actions

###  UI/UX Excellence
- [x] Smooth animations (fade-in, slide, hover effects)
- [x] Modern table styling à la shadcn/ui
- [x] Responsive design (mobile-first)
- [x] Dark mode ready
- [x] Accessibility support

---

## 🛠 Tech Stack

### Core Framework
- **Next.js 15.5** - React framework dengan Pages Router
- **React 19.1** - UI library
- **TypeScript 5.x** - Type-safe development

### Styling & UI
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **shadcn/ui** - Komponen UI berkualitas tinggi
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **Recharts** - Charting library untuk visualisasi data

### State Management & Data Fetching
- **React Context API** - Global state (Company, Auth)
- **TanStack Query (React Query)** - Server state management
- **Axios** - HTTP client
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Development Tools
- **Turbopack** - Next-gen bundler (faster than Webpack)
- **ESLint** - Code linting
- **PostCSS** - CSS processing

---

## 📁 Struktur Folder

```
wajira-dashboard/
├── public/
│   ├── assets/
│   │   └── auth.png          # Login page image
│   └── wajira-logo.png        # Company logo
│
├── src/
│   ├── components/
│   │   ├── ui/                # Reusable UI components (shadcn-based)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── popover.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/            # Layout components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   │
│   │   ├── features/          # Feature-specific components
│   │   │   ├── dashboard/
│   │   │   │   ├── FinanceCard.tsx
│   │   │   │   └── ...
│   │   │   ├── sales/
│   │   │   │   ├── SalesTable.tsx
│   │   │   │   ├── SalesTableRow.tsx
│   │   │   │   └── ...
│   │   │   └── navigation/
│   │   │       ├── NavItem.tsx
│   │   │       └── nav.config.ts
│   │   │
│   │   └── common/            # Common shared components
│   │       └── PageHeader.tsx
│   │
│   ├── pages/                 # Next.js Pages Router
│   │   ├── _app.tsx           # App wrapper (Providers)
│   │   ├── login.tsx          # Login page
│   │   ├── select-company.tsx # Company selection
│   │   ├── dashboard/
│   │   │   └── index.tsx      # Dashboard home
│   │   └── sales/
│   │       ├── index.tsx      # Sales list
│   │       ├── [id].tsx       # Sales detail
│   │       └── edit/
│   │           └── [itemId].tsx
│   │
│   ├── contexts/              # React Context providers
│   │   └── CompanyContext.tsx # Company state management
│   │
│   ├── services/              # API services (backend-ready)
│   │   └── company.service.ts # Company CRUD operations
│   │
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts            # Authentication helpers
│   │   └── utils.ts           # General utilities (cn, etc)
│   │
│   └── styles/
│       └── globals.css        # Global styles
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

### Penjelasan Struktur

####  `components/ui/`
Komponen UI dasar sing reusable, kebanyakan dari shadcn/ui. **Jangan dimodifikasi langsung** kecuali untuk styling spesifik.

####  `components/features/`
Komponen sing spesifik kanggo fitur tertentu (dashboard, sales, navigation). Organized by feature domain.

####  `components/layout/`
Komponen layout utama (Sidebar, Topbar, DashboardLayout) sing digunakan di semua halaman dashboard.

####  `pages/`
Halaman-halaman aplikasi (Next.js Pages Router). File structure = route structure.

####  `contexts/`
Global state management menggunakan React Context API.

####  `services/`
API service layer, **backend-ready** dengan dummy data. Gampang diganti ke real API call.

---

## 🚀 Getting Started

### Prerequisites

Pastikan sudah install:
- **Node.js** >= 18.x
- **npm** atau **yarn** atau **pnpm**
- **Git**

### Installation

```bash
# Clone repository
git clone <repository-url-ikiyoo>
cd jenenge-repo-nyo

# Install dependencies
npm install

# Run development server
npm run dev
```

Buka browser dan akses: **http://localhost:3000**

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

---

##  Sistem Autentikasi

Dashboard menggunakan **token-based authentication** dengan route guards.

### Flow Authentication

```mermaid
graph LR
    A[User] --> B[/login]
    B --> C{Valid?}
    C -->|Yes| D[Save Token]
    D --> E[/select-company]
    E --> F[Select PT]
    F --> G[Save company_id]
    G --> H[/dashboard]
    
    C -->|No| B
    
    I[Access /dashboard] --> J{Has Token?}
    J -->|No| B
    J -->|Yes| K{Has company_id?}
    K -->|No| E
    K -->|Yes| H
```

### Route Guards

Route guards diterapkan di **`DashboardLayout.tsx`**:

```typescript
// Guard 1: Check token
if (!token) {
    router.replace("/login")
    return
}

// Guard 2: Check company_id
if (!companyId) {
    router.replace("/select-company")
    return
}
```

### Storage Strategy

- **Token**: `localStorage.setItem("token", "...")`
- **Company ID**: `localStorage.setItem("company_id", "...")`

> **Note**: Untuk production, gunakan **httpOnly cookies** untuk keamanan lebih baik.

---

## 🏢 Company Context System

Dashboard menggunakan **React Context API** untuk global company state management.

### CompanyContext

```typescript
interface CompanyContextValue {
    companyId: string | null
    setCompanyId: (id: string) => void
}
```

### Cara Pakai

```typescript
import { useCompany } from "@/contexts/CompanyContext"

function MyComponent() {
    const { companyId, setCompanyId } = useCompany()
    
    // Get current company
    const currentCompany = companies.find(c => c.id === companyId)
    
    // Switch company
    setCompanyId("new-company-id")
}
```

### Features

- ✅ Otomatis load dari `localStorage` saat app mount
- ✅ Persist ke `localStorage` saat diupdate
- ✅ Diakses dari mana saja via `useCompany()`
- ✅ Trigger re-render otomatis saat berubah

---

## 💻 Development Guide

### Naming Conventions

#### Files & Folders
- **Components**: PascalCase - `SalesTable.tsx`, `NavItem.tsx`
- **Pages**: lowercase/kebab-case - `index.tsx`, `[id].tsx`
- **Utils/Services**: camelCase - `company.service.ts`, `auth.ts`
- **Config**: kebab-case - `nav.config.ts`, `sales.data.ts`

#### Code
- **Components**: PascalCase - `function SalesTable() {}`
- **Functions**: camelCase - `function handleSubmit() {}`
- **Constants**: UPPER_SNAKE_CASE - `const API_BASE_URL = "..."`
- **Interfaces/Types**: PascalCase - `interface User {}`, `type Company = {}`

### Styling Guidelines

#### Tailwind Classes
Gunakan utility classes, hindari custom CSS kecuali memang perlu:

```tsx
// ✅ Good
<div className="flex items-center justify-between px-4 py-2 bg-white rounded-md shadow-md hover:shadow-lg transition-shadow duration-300">

// ❌ Avoid
<div style={{ display: "flex", padding: "8px 16px" }}>
```

#### Component Styling Pattern
```tsx
import { cn } from "@/lib/utils"

function MyComponent({ className, ...props }) {
    return (
        <div className={cn(
            "base-classes here",
            "more base classes",
            className  // Allow override
        )} {...props}>
            ...
        </div>
    )
}
```

### Data Fetching Pattern

Gunakan **TanStack Query** untuk server state:

```typescript
import { useQuery } from "@tanstack/react-query"

function MyComponent() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["sales"],
        queryFn: () => fetchSales()
    })
    
    if (isLoading) return <Loading />
    if (error) return <Error />
    
    return <SalesTable data={data} />
}
```

### Form Handling

Gunakan **React Hook Form** + **Zod**:

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8)
})

function LoginForm() {
    const form = useForm({
        resolver: zodResolver(schema)
    })
    
    const onSubmit = (data) => {
        // Handle submit
    }
    
    return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>
}
```

### Adding New Pages

1. **Create page file** di `src/pages/`
2. **Add to navigation** di `nav.config.ts` (jika perlu)
3. **Apply layout** (gunakan `DashboardLayout` untuk authed pages)
4. **Add route guard** (sudah otomatis via DashboardLayout)

### Adding New Features

1. **Create feature folder** di `src/components/features/[feature-name]/`
2. **Create components** di folder tersebut
3. **Create data/config** files jika perlu
4. **Create service** di `src/services/` untuk API calls
5. **Add to pages** sing sesuai

---

## 🎨 UI Component Library

Dashboard menggunakan **shadcn/ui** - komponen berkualitas tinggi sing customizable.

### Available Components

```bash
# UI Components
Button, Card, Input, Table, Popover, Dropdown Menu,
Checkbox, Dialog, Select, Tabs, Toast, etc.
```

### Adding New UI Component

```bash
# Install shadcn CLI (if not installed)
npx shadcn@latest init

# Add component
npx shadcn@latest add [component-name]

# Example: Add Dialog
npx shadcn@latest add dialog
```

Komponen bakal otomatis ditambahin ke `src/components/ui/`.

---

## 🧪 Testing (Future)

> **Note**: Testing belum diimplementasikan. Rencana testing strategy:

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Visual Regression**: Chromatic / Percy

---

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Docker

```dockerfile
# Dockerfile (contoh)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables

Buat file `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.wajira.com
NEXT_PUBLIC_API_KEY=your-api-key

# Authentication
NEXT_PUBLIC_AUTH_DOMAIN=auth.wajira.com

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## 🤝 Contributing

### Branch Strategy

- `main` - Production ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Commit Convention

Gunakan **Conventional Commits**:

```
feat: add sales export feature
fix: resolve sidebar navigation bug  
docs: update README installation steps
style: format code with prettier
refactor: optimize table rendering
test: add unit tests for auth service
chore: update dependencies
```

### Pull Request Process

1. Create branch dari `develop`
2. Kerjakan fitur/bugfix
3. Test secara menyeluruh
4. Create PR ke `develop`
5. Request review dari tim
6. Merge setelah approved

### Code Review Checklist

- [ ] Code follows naming conventions
- [ ] No console.log() di production code
- [ ] Components are properly typed (TypeScript)
- [ ] Responsive design tested
- [ ] No accessibility issues
- [ ] Performance optimized (lazy loading, memoization)

---

## 📝 Notes

### Development Tips

- **Turbopack**: Development server sangat cepat, tapi masih beta. Jika ada issue, matikan dengan `next dev` (tanpa `--turbopack`)
- **Type Safety**: Manfaatkan TypeScript. Jangan pakai `any` kecuali terpaksa
- **Component Reusability**: Kalau ada pattern yang berulang, extract ke component
- **Performance**: Gunakan `React.memo()`, `useMemo()`, `useCallback()` untuk optimasi

### Known Issues

- ❗ Popover animation kadang janky di mobile Safari
- ❗ Table scrolling kurang smooth di large dataset (>1000 rows)

### Roadmap

- [ ] Implement real API integration
- [ ] Add unit tests & E2E tests
- [ ] Implement role-based access control (RBAC)
- [ ] Add notification system
- [ ] Implement WebSocket for real-time updates
- [ ] Add export to Excel/PDF feature
- [ ] Implement advanced filtering & search
- [ ] Add dark mode switcher
- [ ] Multi-language support (i18n)

---

## 📞 Contact & Support

Untuk pertanyaan atau issue:
- Email: dev@wajira.com
- Slack: #wajira-dashboard
- Issue Tracker: GitHub Issues

---

## 📄 License

Copyright © 2026 Wajira Group. All rights reserved.

---

**Built with ❤️ by Wajira Development Team**  
*Dashboard apik kanggo perusahaan sing apik* 🚀

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React Framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI Components
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Radix UI](https://www.radix-ui.com/) - Headless UI Primitives
- [Lucide](https://lucide.dev/) - Icon Library
