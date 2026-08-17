import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { MenuItem } from '@/types/menu.types';
import { Company } from '@/services/company.service';
import { AuthService, SidebarModuleItem } from '@/features/auth/services/auth.service';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Archive, 
  Warehouse, 
  Landmark, 
  ListChecks, 
  Shield 
} from 'lucide-react';

const FEATURE_MAP: Record<string, { path: string; label?: string; group?: string }> = {
  // Dashboard
  'dashboard-stat': { path: '', label: 'Overview' },

  // Master Data
  'group-accounts': { path: '/master/account-group', label: 'Grup Akun' },
  'accounts': { path: '/master/account', label: 'Akun' },
  'suppliers': { path: '/master/supplier', label: 'Supplier' },
  'customers': { path: '/master/customer', label: 'Customer' },
  'unit-types': { path: '/master/type-unit', label: 'Tipe Unit' },
  'spare-parts': { path: '/master/sparepart', label: 'Sparepart' },
  'cash-accounts': { path: '/master/kas', label: 'Kas' },
  'dealers': { path: '/master/dealer', label: 'Dealer' },
  'tariffs': { path: '/master/tarif', label: 'Tarif' },
  'drivers': { path: '/master/driver', label: 'Driver' },
  'vehicles': { path: '/master/armada', label: 'Armada' },
  'asset': { path: '/master/asset', label: 'Aset' },
  'tax': { path: '/master/tax', label: 'Pajak' },
  'warehouse-block': { path: '/master/warehouse-block', label: 'Blok Gudang' },
  'wilayah': { path: '/master/wilayah', label: 'Wilayah' },
  'material': { path: '/master/material', label: 'Material' },
  'vendor': { path: '/master/vendor', label: 'Vendor' },
  'bbn': { path: '/master/bbn', label: 'BBN' },
  'vehicle-equipment': { path: '/master/vehicle-equipment', label: 'Perlengkapan' },

  // Administrasi / Transaction
  'transaction-flow': { path: '/arus-transaksi', label: 'Arus Transaksi' },
  'transaction-journal': { path: '/transaksi/jurnal-transaksi', label: 'Jurnal Transaksi' },
  'unit-purchases': { path: '/transaksi/pembelian-unit', label: 'Pembelian Unit', group: 'Transaksi Unit Tipe' },
  'unit-sales': { path: '/transaksi/penjualan-unit', label: 'Penjualan Unit', group: 'Transaksi Unit Tipe' },
  'sparepart-purchases': { path: '/transaksi/pembelian-sparepart', label: 'Pembelian Sparepart', group: 'Transaksi Sparepart' },
  'sparepart-sales': { path: '/transaksi/penjualan-sparepart', label: 'Penjualan Sparepart', group: 'Transaksi Sparepart' },
  'sparepart-refunds': { path: '/transaksi/refund-sparepart', label: 'Refund Sparepart', group: 'Transaksi Sparepart' },
  'invoices': { path: '/transaksi/faktur', label: 'Faktur' },
  'expedition-delivery-orders': { path: '/do-ekspedisi', label: 'DO Ekspedisi' },
  'witholding-tax': { path: '/administrasi/bukti-potong', label: 'Bukti Potong' },
  'order-list': { path: '/administrasi/order-list', label: 'Order List' },
  'create-invoice': { path: '/administrasi/create-invoice', label: 'Create Invoice' },
  'data-kendaraan': { path: '/data-kendaraan', label: 'Data Kendaraan' },
  'stnk-bpkb': { path: '/stnk-bpkb', label: 'Input STNK/BPKB' },
  'tagihan-bbn': { path: '/tagihan-bbn', label: 'Tagihan BBN' },

  // Warehouse
  'unit-inventory': { path: '/warehouse/stock-unit', label: 'Stok Unit', group: 'Unit Tipe' },
  'unit-receipts': { path: '/warehouse/penerimaan-unit', label: 'Penerimaan Unit', group: 'Unit Tipe' },
  'unit-dispatches': { path: '/warehouse/pengeluaran-unit', label: 'Pengeluaran Unit', group: 'Unit Tipe' },
  'sparepart-receipts': { path: '/warehouse/penerimaan-sparepart', label: 'Penerimaan Sparepart', group: 'Sparepart' },
  'sparepart-dispatches': { path: '/warehouse/pengeluaran-sparepart', label: 'Pengeluaran Sparepart', group: 'Sparepart' },
  
  'perlengkapan-inventory': { path: '/warehouse/stock-perlengkapan', label: 'Stok Perlengkapan', group: 'Perlengkapan' },
  'perlengkapan-receipts': { path: '/warehouse/perlengkapan-masuk', label: 'Perlengkapan Masuk', group: 'Perlengkapan' },
  'perlengkapan-dispatches': { path: '/warehouse/pengeluaran-perlengkapan', label: 'Pengeluaran Perlengkapan', group: 'Perlengkapan' },
  'maintenance-armada': { path: '/warehouse/maintenance', label: 'Maintenance Armada' },
  'penerimaan-material': { path: '/warehouse/penerimaan-material', label: 'Penerimaan Material', group: 'Warehouse Material' },
  'pengeluaran-material': { path: '/warehouse/pengeluaran-material', label: 'Pengeluaran Material', group: 'Warehouse Material' },

  // Finance
  'daily-cash-transactions': { path: '/finance/transaksi-kas-harian', label: 'Kas Harian' },
  'purchase-vat-records': { path: '/finance/data-ppn-pembelian', label: 'Data PPN Pembelian' },
  'sales-vat-records': { path: '/finance/data-ppn-penjualan', label: 'Data PPN Penjualan' },
  'purchase-refunds': { path: '/finance/refund-beli', label: 'Data Refund Pembelian' },
  'sales-refunds': { path: '/finance/refund-jual', label: 'Data Refund Penjualan' },
  'accounts-payable': { path: '/finance/data-hutang', label: 'Data Hutang' },
  'payable-payments': { path: '/finance/data-pembayaran-hutang', label: 'Data Pembayaran Hutang' },
  'accounts-receivable': { path: '/finance/data-piutang', label: 'Data Piutang' },
  'receivable-collections': { path: '/finance/data-penerimaan-piutang', label: 'Data Terima Piutang' },
  'finance-assets': { path: '/finance/asset', label: 'Aset' },
  'uj-driver': { path: '/finance/uj-driver', label: 'Linimasa Driver' },
  'finance-invoice': { path: '/finance/invoice', label: 'Invoice' },

  // Laporan / Report
  'cash-transaction-reports': { path: '/laporan/laporan-transaksi-kas', label: 'Laporan Transaksi Kas' },
  'accounting-reports': { path: '/laporan/laporan-akuntansi', label: 'Laporan Akuntansi' },
  'purchase-reports': { path: '/laporan/laporan-pembelian', label: 'Laporan Pembelian' },
  'sales-reports': { path: '/laporan/laporan-penjualan', label: 'Laporan Penjualan' },
  'receipt-reports': { path: '/laporan/laporan-penerimaan', label: 'Laporan Penerimaan' },
  'dispatch-reports': { path: '/laporan/laporan-pengiriman', label: 'Laporan Pengiriman' },
  'inventory-reports': { path: '/laporan/laporan-stock', label: 'Laporan Warehouse' },
  'expedition-reports': { path: '/laporan/laporan-surat-jalan', label: 'Laporan Surat Jalan' },
  'invoice-reports': { path: '/laporan/laporan-invoice', label: 'Laporan Invoice' },
  'maintenance-reports': { path: '/laporan/laporan-ritase-armada', label: 'Laporan Ritase Armada/Maintenance' },
  'perlengkapan-reports': { path: '/laporan/laporan-stock-perlengkapan', label: 'Laporan Persediaan Barang' },
  'asset-reports': { path: '/laporan/laporan-aset', label: 'Laporan Aset' },
  'witholding-tax-reports': { path: '/laporan/laporan-bukti-potong', label: 'Laporan Bukti Potong' },
  'lp-jumlah-daftar': { path: '/laporan/lp-jumlah-daftar', label: 'LP Jumlah Daftar' },
  'lp-jumlah-terima': { path: '/laporan/lp-jumlah-terima', label: 'LP Jumlah Terima' },
  'lp-jumlah-penyerahan': { path: '/laporan/lp-jumlah-penyerahan', label: 'LP Jumlah Penyerahan' },
  'lp-jumlah-outstanding': { path: '/laporan/lp-jumlah-outstanding', label: 'LP Jumlah Outstanding' },
  'laporan-stock-material': { path: '/laporan/laporan-stock-material', label: 'Laporan Stock Material' },

  // User
  'users': { path: '/master/user', label: 'Pengguna' },
  'roles': { path: '/settings/roles', label: 'Hak Akses' },
  'permissions': { path: '/settings/permissions', label: 'Izin Akses' },
};

const resolvePath = (path: string, slug: string) => {
  if (path.startsWith('/master/')) {
    const sub = path.substring(7);
    return slug ? `/dashboard/${slug}/master${sub}` : `/master-data${sub}`;
  }
  if (path.startsWith('/settings/')) {
    const sub = path.substring(9);
    return slug ? `/dashboard/${slug}/settings${sub}` : `/settings${sub}`;
  }
  return slug ? `/dashboard/${slug}${path}` : path;
};

export function buildDynamicMenus(sidebarData: SidebarModuleItem[], permissions: string[], slug: string): MenuItem[] {
  const menus: MenuItem[] = [];
  const permissionSet = new Set(permissions);

  for (const item of sidebarData) {
    const moduleSlug = item.module.slug;
    if (moduleSlug !== 'dashboard' && !permissionSet.has(`${moduleSlug}:list`)) continue;
    let label = item.module.name;
    let icon = ClipboardList;

    if (moduleSlug === 'dashboard') {
      label = 'Dashboard';
      icon = LayoutDashboard;
    } else if (moduleSlug === 'master-data') {
      label = 'Master Data';
      icon = ClipboardList;
    } else if (moduleSlug === 'transaction') {
      label = 'Administrasi';
      icon = Archive;
    } else if (moduleSlug === 'warehouse') {
      label = 'Warehouse';
      icon = Warehouse;
    } else if (moduleSlug === 'finance') {
      label = 'Finance';
      icon = Landmark;
    } else if (moduleSlug === 'report') {
      label = 'Laporan';
      icon = ListChecks;
    } else if (moduleSlug === 'user') {
      label = 'Manajemen Pengguna';
      icon = Shield;
    }

    const children: MenuItem[] = [];
    const groupMap: Record<string, MenuItem> = {};

    for (const feature of item.features) {
      const mapping = FEATURE_MAP[feature.slug];
      if (!mapping) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[useCompanyMenu] No route mapping found for sidebar feature: ${feature.slug}`);
        }
        continue;
      }

      const menuItem: MenuItem = {
        label: mapping.label || feature.name.replace(/^Master\s+/, ''),
        href: resolvePath(mapping.path, slug),
        exact: feature.slug === 'dashboard-stat' ? true : undefined,
      };

      if (mapping.group) {
        if (!groupMap[mapping.group]) {
          groupMap[mapping.group] = {
            label: mapping.group,
            children: [],
          };
          children.push(groupMap[mapping.group]);
        }
        groupMap[mapping.group].children!.push(menuItem);
      } else {
        children.push(menuItem);
      }
    }

    if (children.length > 0) {
      menus.push({
        label,
        icon,
        children,
      });
    }
  }

  return menus;
}

export function useCompanyMenu(_companies: Company[]): { menus: MenuItem[], isLoading: boolean } {
  const router = useRouter();
  const slugQuery = router.query.slug;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';

  const { companyId } = useCompany();
  const { data: permissions = [], isLoading: isLoadingPermissions } = useQuery<string[]>({
    queryKey: ['auth', 'permissions', companyId],
    queryFn: () => AuthService.getPermissions(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const { data: sidebarData = [], isLoading: isLoadingSidebar } = useQuery<SidebarModuleItem[]>({
    queryKey: ['auth', 'sidebar', companyId],
    queryFn: () => AuthService.getSidebar(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const menus = useMemo(
    () => buildDynamicMenus(sidebarData, permissions, slug),
    [sidebarData, permissions, slug],
  );

  return { menus, isLoading: isLoadingPermissions || isLoadingSidebar };
}
