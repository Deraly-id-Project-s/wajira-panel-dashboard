import { LayoutDashboard, ClipboardList, Archive, Warehouse, Landmark, ListChecks, Shield, Settings, SlidersHorizontal } from 'lucide-react';
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
      icon: ClipboardList,
      children: [
        {
          label: 'Grup Akun',
          href: master('/account-group'),
        },
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
        {
          label: 'Pajak',
          href: master('/tax'),
        },
        {
          label: 'Blok Gudang',
          href: master('/warehouse-block'),
        },
        {
          label: 'Dokumen Template',
          href: master('/document-template'),
        },
      ],
    },
    {
      label: 'Administrasi',
      icon: Archive,
      children: [
        {
          label: 'Arus Transaksi',
          href: base('/transaksi/arus-transaksi'),
        },
        {
          label: 'Transaksi Unit Tipe',
          children: [
            {
              label: 'Pembelian Unit',
              href: base('/transaksi/pembelian-unit'),
            },
            {
              label: 'Penjualan Unit',
              href: base('/transaksi/penjualan-unit'),
            },
          ]
        },
        {
          label: 'Transaksi Sparepart',
          children: [
            {
              label: 'Pembelian Sparepart',
              href: base('/transaksi/pembelian-sparepart'),
            },
            {
              label: 'Penjualan Sparepart',
              href: base('/transaksi/penjualan-sparepart'),
            },
            {
              label: 'Refund Sparepart',
              href: base('/transaksi/refund-sparepart'),
            },
          ]
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
          label: 'Unit Tipe',
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
          ]
        },
        {
          label: 'Sparepart',
          children: [
            {
              label: 'Stok Sparepart',
              href: base('/warehouse/stock-sparepart'),
            },
            {
              label: 'Penerimaan Sparepart',
              href: base('/warehouse/penerimaan-sparepart'),
            },
            {
              label: 'Pengeluaran Sparepart',
              href: base('/warehouse/pengeluaran-sparepart'),
            },
          ]
        },
        {
          label: 'Perlengkapan',
          children: [
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
          ]
        },
      ],
    },
    {
      label: 'Finance',
      icon: Landmark,
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
      icon: ListChecks,
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
          label: 'Laporan Neraca Lajur',
          href: base('/laporan/laporan-neraca-lajur'),
        },
        {
          label: 'Laporan Laba Rugi',
          href: base('/laporan/laporan-laba-rugi'),
        },
        {
          label: 'Ballance Report',
          href: base('/laporan/ballance-report'),
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
      label: 'Manajemen Admin',
      icon: Shield,
      children: [
        {
          label: 'Pengguna',
          href: master('/user'),
        },
      ],
    },
    {
      label: 'Pengaturan',
      icon: Settings,
      children: [
        {
          label: 'Hak Akses',
          href: settings('/roles'),
        },
        {
          label: 'Izin Akses',
          href: settings('/permissions'),
        },
        {
          label: 'Preferensi',
          href: settings('/preference'),
          icon: SlidersHorizontal,
        },
      ],
    },
  ];
};
