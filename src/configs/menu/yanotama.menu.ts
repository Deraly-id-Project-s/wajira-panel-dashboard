import { LayoutDashboard, Database, FileText, Settings, DollarSign, Warehouse, ScrollText } from 'lucide-react';
import { MenuItem } from '@/types/menu.types';

export const getYanotamaMenus = (slug: string): MenuItem[] => {
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
                {
                    label: 'Grup Akun',
                    href: base('/master/account-group'),
                },
                {
                    label: 'Dealer',
                    href: base('/master/dealer'),
                },
                {
                    label: 'Wilayah',
                    href: base('/master/wilayah'),
                },
                {
                    label: 'Material',
                    href: base('/master/material'),
                },
                {
                    label: 'Vendor',
                    href: base('/master/vendor'),
                },
                {
                    label: 'Aset',
                    href: base('/master/asset'),
                },
                {
                    label: 'BBN',
                    href: base('/master/bbn'),
                },
                {
                    label: 'Perlengkapan',
                    href: base('/master/vehicle-equipment'),
                }
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
                    label: 'Data Kendaraan',
                    href: base('/data-kendaraan'),
                },
                // {
                //     label: 'Pembelian Material',
                //     href: base('/pembelian-material'),
                // },
                // {
                //     label: 'Penjualan Material',
                //     href: base('/penjualan-material'),
                // },
                {
                    label: 'Input STNK/BPKB',
                    href: base('/stnk-bpkb'),
                },
                {
                    label: 'Tagihan BBN',
                    href: base('/tagihan-bbn'),
                },
                // {
                //     label: 'DO Pembelian Material',
                //     href: base('/do-pembelian-material'),
                // },
                // {
                //     label: 'Stok Material',
                //     href: base('/stok-material'),
                // },
                {
                    label: 'Bukti Potong',
                    href: base('/administrasi/bukti-potong'),
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
                    label: 'Aset',
                    href: base('/finance/asset'),
                },
            ],
        },
        {
            label: 'Warehouse',
            icon: Warehouse,
            children: [
                {
                    label: 'Stock Material',
                    href: base('/warehouse/stock-perlengkapan'),
                },
                {
                    label: 'Penerimaan Material',
                    href: base('/warehouse/penerimaan-material'),
                },
                {
                    label: 'Pengeluaran Material',
                    href: base('/warehouse/pengeluaran-material'),
                },
            ],
        },
        {
            label: 'Laporan',
            icon: ScrollText,
            children: [
                {
                    label: 'LP Jumlah Daftar',
                    href: base('/laporan/lp-jumlah-daftar'),
                },
                {
                    label: 'LP Jumlah Terima',
                    href: base('/laporan/lp-jumlah-terima'),
                },
                {
                    label: 'LP Jumlah Penyerahan',
                    href: base('/laporan/lp-jumlah-penyerahan'),
                },
                {
                    label: 'LP Jumlah Outstanding',
                    href: base('/laporan/lp-jumlah-outstanding'),
                },
                {
                    label: 'Laporan Stock Material',
                    href: base('/laporan/laporan-stock-material'),
                },
                {
                    label: 'Laporan Aset',
                    href: base('/laporan/laporan-aset'),
                },
                {
                    label: 'Laporan Akuntansi',
                    href: base('/laporan/laporan-akuntansi'),
                },
                {
                    label: 'Laporan Bukti Potong',
                    href: base('/laporan/laporan-bukti-potong'),
                },
            ],
        },
        {
            label: 'Manajemen Pengguna',
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
