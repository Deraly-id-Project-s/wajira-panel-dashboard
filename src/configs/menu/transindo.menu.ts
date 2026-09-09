import { LayoutDashboard, Database, FileText, Settings, DollarSign, Warehouse, ScrollText } from 'lucide-react';
import { MenuItem } from '@/types/menu.types';

export const getTransindoMenus = (slug: string): MenuItem[] => {
  const base = (path: string) => (slug ? `/dashboard/${slug}${path}` : path);

  return [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      children: [
        {
          label: 'Overview',
          href: base(''),
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
          href: base('/master/account'),
        },
        // {
        //   label: 'Grup Akun',
        //   href: base('/master/account-group'),
        // },
        {
          label: 'Dealer',
          href: base('/master/dealer'),
        },
        {
          label: 'Customer',
          href: base('/master/customer'),
        },
        // {
        //   label: 'Supplier',
        //   href: base('/master/supplier'),
        // },
        {
          label: 'Tarif',
          href: base('/master/tarif'),
        },
        {
          label: 'Driver',
          href: base('/master/driver'),
        },
        {
          label: 'Armada',
          href: base('/master/armada'),
        },
        {
          label: 'Aset',
          href: base('/master/asset'),
        },
        {
          label: 'Perlengkapan',
          href: base('/master/vehicle-equipment'),
        },
      ],
    },
    {
      label: 'Administrasi',
      icon: FileText,
      children: [
        {
          label: 'Arus Transaksi',
          href: base('/arus-transaksi'),
        },
        {
          label: 'Order List',
          href: base('/administrasi/order-list'),
        },
        {
          label: 'DO Ekspedisi',
          href: base('/do-ekspedisi'),
        },
        {
          label: 'Kas Bon',
          href: base('/kas-bon'),
        },
        {
          label: 'Create Invoice',
          href: base('/administrasi/create-invoice'),
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
          label: 'Stok Perlengkapan',
          href: base('/warehouse/stock-perlengkapan'),
        },
        {
          label: 'Penerimaan Perlengkapan',
          href: base('/warehouse/perlengkapan-masuk'),
        },
        {
          label: 'Pengeluaran Perlengkapan',
          href: base('/warehouse/pengeluaran-perlengkapan'),
        },
        {
          label: 'Maintenance Armada',
          href: base('/warehouse/maintenance'),
        },
      ],
    },
    {
      label: 'Finance',
      icon: DollarSign,
      children: [
        {
          label: 'Kas Harian',
          href: base('/finance/transaksi-kas-harian'),
        },
        {
          label: 'Linimasa Driver',
          href: base('/finance/uj-driver'),
        },
        {
          label: 'Invoice',
          href: base('/finance/invoice'),
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
          label: 'Laporan Surat Jalan',
          href: base('/laporan/laporan-surat-jalan'),
        },
        {
          label: 'Laporan Invoice',
          href: base('/laporan/laporan-invoice'),
        },
        {
          label: 'Laporan Ritase Armada/Maintenance',
          href: base('/laporan/laporan-ritase-armada'),
        },
        {
          label: 'Laporan Persediaan Barang',
          href: base('/laporan/laporan-stock-perlengkapan'),
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
      label: 'Pengaturan',
      icon: Settings,
      children: [
        {
          label: 'Profil Pengguna',
          href: base('/settings/profile'),
        },
      ],
    },
  ];
};
