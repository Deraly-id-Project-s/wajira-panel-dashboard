import { LayoutDashboard, Database, FileText, Warehouse, DollarSign, ScrollText, Shield } from 'lucide-react';

/**
 * Navigation Item Configuration
 * Supports hierarchical menu structure dengan parent-child relationships
 */
export interface NavItemConfig {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItemConfig[];
  exact?: boolean;
}

/**
 * Sidebar Navigation Items
 * Struktur sesuai dengan Figma design - semua item top-level dengan expandable capability
 * Updated to support dynamic slug routing
 */
export const getNavItems = (slug: string): NavItemConfig[] => {
  // Helper to format path with/without slug
  const base = (path: string) => (slug ? `/dashboard/${slug}${path}` : path);
  const master = (sub: string) => (slug ? `/dashboard/${slug}/master${sub}` : `/master-data${sub}`);
  const settings = (sub: string) => (slug ? `/dashboard/${slug}/settings${sub}` : `/settings${sub}`);

  return [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      children: [
        {
          label: 'Overview',
          href: slug ? `/dashboard/${slug}` : '/dashboard',
          exact: true,
        },
      ],
    },
    {
      label: 'Master Data',
      icon: Database,
      children: [
        {
          label: 'Akun',
          href: master('/account'),
        },
        {
          label: 'Supplier',
          href: master('/supplier'),
        },
        {
          label: 'Customer',
          href: master('/customer'),
        },
        {
          label: 'Tipe Unit',
          href: master('/type-unit'),
        },
        {
          label: 'Sparepart',
          href: master('/sparepart'),
        },
        {
          label: 'Kas',
          href: master('/kas'),
        },
        {
          label: 'User',
          href: master('/user'),
        },
        {
          label: 'Perlengkapan',
          href: master('/vehicle-equipment'),
        },
      ],
    },
    {
      label: 'Administrasi',
      icon: FileText,
      children: [
        {
          label: 'Arus Transaksi',
          href: base('/transaksi/arus-transaksi'),
        },
        {
          label: 'Pembelian Unit',
          href: base('/transaksi/pembelian-unit'),
        },
        {
          label: 'Penjualan Unit',
          href: base('/transaksi/penjualan-unit'),
        },
      ],
    },
    {
      label: 'Warehouse',
      icon: Warehouse,
      children: [
        {
          label: 'Stok Unit',
          href: base('/warehouse/stock-unit'),
        },
        {
          label: 'Penerimaan Unit',
          href: base('/warehouse/penerimaan-unit'),
        },
        {
          label: 'Pengeluaran Unit',
          href: base('/warehouse/pengeluaran-unit'),
        },
        {
          label: 'Perlengkapan Masuk',
          href: base('/warehouse/perlengkapan-masuk'),
        },
        {
          label: 'Penerimaan Material',
          href: base('/warehouse/penerimaan-material'),
        },
        {
          label: 'Pengeluaran Material',
          href: base('/warehouse/pengeluaran-material'),
        },
        {
          label: 'Perlengkapan Keluar',
          href: base('/warehouse/perlengkapan-keluar'),
        },
        {
          label: 'Stock Perlengkapan',
          href: base('/warehouse/stock-perlengkapan'),
        },
      ], // Siap untuk di-expand dengan sub-items
    },
    {
      label: 'Finance',
      icon: DollarSign,
      children: [
        {
          label: 'Transaksi Kas Harian',
          href: base('/finance/transaksi-kas-harian'),
        },
        {
          label: 'Data PPN Pembelian',
          href: base('/finance/data-ppn-pembelian'),
        },
        {
          label: 'Data PPN Penjualan',
          href: base('/finance/data-ppn-penjualan'),
        },
        {
          label: 'Data Refund Pembelian',
          href: base('/finance/refund-beli'),
        },
        {
          label: 'Data Refund Penjualan',
          href: base('/finance/refund-jual'),
        },
        {
          label: 'Data Hutang',
          href: base('/finance/data-hutang'),
        },
        {
          label: 'Data Pembayaran Hutang',
          href: base('/finance/data-pembayaran-hutang'),
        },
        {
          label: 'Data Piutang',
          href: base('/finance/data-piutang'),
        },
        {
          label: 'Data Pembayaran Piutang',
          href: base('/finance/data-penerimaan-piutang'),
        },
      ], // Siap untuk di-expand dengan sub-items
    },
    {
      label: 'Laporan',
      icon: ScrollText,
      children: [
        {
          label: 'Laporan Transaksi Kas',
          href: base('/laporan/laporan-transaksi-kas'),
        },
        {
          label: 'Laporan Jurnal',
          href: base('/laporan/laporan-jurnal'),
        },
        {
          label: 'Laporan Buku Besar',
          href: base('/laporan/laporan-buku-besar'),
        },
        {
          label: 'Laporan Laba Rugi',
          href: base('/laporan/laporan-laba-rugi'),
        },
        {
          label: 'Laporan Pembelian',
          href: base('/laporan/laporan-pembelian'),
        },
        {
          label: 'Laporan Penjualan',
          href: base('/laporan/laporan-penjualan'),
        },
        {
          label: 'Laporan Pengeluaran',
          href: base('/laporan/laporan-pengeluaran'),
        },
        {
          label: 'Laporan Stock',
          href: base('/laporan/laporan-stock'),
        },
      ], // Siap untuk di-expand dengan sub-items
    },
    {
      label: 'Manajemen Pengguna',
      icon: Shield,
      children: [
        {
          label: 'Roles',
          href: settings('/roles'),
        },
        {
          label: 'Permissions',
          href: settings('/permissions'),
        },
      ],
    },
    {
      label: 'Security',
      icon: Shield,
      children: [
        {
          label: 'Roles',
          href: settings('/roles'),
        },
        {
          label: 'Permissions',
          href: settings('/permissions'),
        },
      ],
    },
  ];
};

// Keep backward compatibility for static pages if any (fallback)
export const NAV_ITEMS = getNavItems('');
