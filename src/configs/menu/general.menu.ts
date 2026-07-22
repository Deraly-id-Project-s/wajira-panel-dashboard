import { LayoutDashboard, Database, FileText, Warehouse, DollarSign, ScrollText, Shield } from 'lucide-react';
import { MenuItem } from '@/types/menu.types';

export const getGeneralMenus = (slug: string): MenuItem[] => {
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
          label: 'Grup Akun',
          href: master('/account-group'),
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
          label: 'Merk Unit Tipe',
          href: master('/brand'),
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
          label: 'Aset',
          href: master('/asset'),
        },
        // {
        //   label: 'Perlengkapan',
        //   href: master('/vehicle-equipment'),
        // },
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
        {
          label: 'Bukti Potong',
          href: base('/administrasi/bukti-potong'),
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
          label: 'Stock Perlengkapan',
          href: base('/warehouse/stock-perlengkapan'),
        },
        {
          label: 'Perlengkapan Masuk',
          href: base('/warehouse/perlengkapan-masuk'),
        },

        {
          label: 'Perlengkapan Keluar',
          href: base('/warehouse/perlengkapan-keluar'),
        },
      ],
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
          label: 'Data Terima Piutang',
          href: base('/finance/data-penerimaan-piutang'),
        },
        {
          label: 'Aset',
          href: base('/finance/asset'),
        },
      ],
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
          label: 'Laporan Akuntansi',
          href: base('/laporan/laporan-akuntansi'),
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
          label: 'Laporan Penerimaan',
          href: base('/laporan/laporan-penerimaan'),
        },
        {
          label: 'Laporan Pengiriman',
          href: base('/laporan/laporan-pengiriman'),
        },
        {
          label: 'Laporan Warehouse',
          href: base('/laporan/laporan-stock'),
        },
        {
          label: 'Laporan Aset',
          href: base('/laporan/laporan-aset'),
        },
        {
          label: 'Laporan Bukti Potong',
          href: base('/laporan/laporan-bukti-potong'),
        },
      ],
    },
    {
      label: 'Settings',
      icon: Shield, // re-using Shield or another icon
      children: [
        {
          label: 'Pajak',
          href: settings('/tax'),
        },
      ],
    },
    {
      label: 'Manajemen Pengguna',
      icon: Shield,
      children: [
        {
          label: 'Pengguna',
          href: master('/user'),
        },
        {
          label: 'Hak Akses',
          href: settings('/roles'),
        },
        {
          label: 'Izin Akses',
          href: settings('/permissions'),
        },
      ],
    },
  ];
};
