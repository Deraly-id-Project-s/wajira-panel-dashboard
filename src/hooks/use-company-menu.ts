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
  Shield,
  Settings
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
  'document-template': { path: '/master/document-template', label: 'Dokumen Template' },

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
  'do-expedition': { path: '/do-ekspedisi', label: 'DO Ekspedisi' },
  'witholding-tax': { path: '/administrasi/bukti-potong', label: 'Bukti Potong' },
  'order-list': { path: '/administrasi/order-list', label: 'Order List' },
  'create-invoice': { path: '/administrasi/do-invoice', label: 'DO Invoice' },
  'data-kendaraan': { path: '/data-kendaraan', label: 'Data Kendaraan' },
  'stnk-bpkb': { path: '/stnk-bpkb', label: 'Input STNK/BPKB' },
  'tagihan-bbn': { path: '/tagihan-bbn', label: 'Tagihan BBN' },
  'driver-cash-advance': { path: '/kas-bon', label: 'Kas Bon' },

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
  'journal-reports': { path: '/laporan/laporan-jurnal', label: 'Laporan Jurnal' },
  'journal-report': { path: '/laporan/laporan-jurnal', label: 'Laporan Jurnal' },
  'ledger-reports': { path: '/laporan/laporan-buku-besar', label: 'Laporan Buku Besar' },
  'ledger-report': { path: '/laporan/laporan-buku-besar', label: 'Laporan Buku Besar' },
  'balance-column-reports': { path: '/laporan/laporan-neraca-lajur', label: 'Laporan Neraca Lajur' },
  'balance-column-report': { path: '/laporan/laporan-neraca-lajur', label: 'Laporan Neraca Lajur' },
  'profit-loss-reports': { path: '/laporan/laporan-laba-rugi', label: 'Laporan Laba Rugi' },
  'profit-loss-report': { path: '/laporan/laporan-laba-rugi', label: 'Laporan Laba Rugi' },
  'balance-reports': { path: '/laporan/ballance-report', label: 'Laporan Neraca' },
  'balance-report': { path: '/laporan/ballance-report', label: 'Laporan Neraca' },
  'ballance-report': { path: '/laporan/ballance-report', label: 'Laporan Neraca' },
  'purchase-reports': { path: '/laporan/laporan-pembelian', label: 'Laporan Pembelian' },
  'sales-reports': { path: '/laporan/laporan-penjualan', label: 'Laporan Penjualan' },
  'receipt-reports': { path: '/laporan/laporan-penerimaan', label: 'Laporan Penerimaan' },
  'dispatch-reports': { path: '/laporan/laporan-pengiriman', label: 'Laporan Pengiriman' },
  'inventory-reports': { path: '/laporan/laporan-stock', label: 'Laporan Warehouse' },
  'expedition-reports': { path: '/laporan/laporan-surat-jalan', label: 'Laporan Surat Jalan' },
  'invoice-reports': { path: '/laporan/laporan-invoice', label: 'Laporan Invoice' },
  'maintenance-reports': { path: '/laporan/laporan-ritase-armada', label: 'Laporan Ritase Armada/Maintenance' },
  'vehicle-usage-reports': { path: '/laporan/laporan-ritase-armada', label: 'Laporan Pemakaian Kendaraan' },
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
  'preference': { path: '/settings/preference', label: 'Preferensi' },
  'preferences': { path: '/settings/preference', label: 'Preferensi' },
  'settings-preference': { path: '/settings/preference', label: 'Preferensi' },
};

const SETTING_FEATURE_SLUGS = new Set([
  'roles',
  'permissions',
  'preference',
  'preferences',
  'settings-preference',
]);

const SETTING_MENU_ITEMS = [
  {
    label: 'Hak Akses',
    path: '/settings/roles',
    permissions: ['settings:list', 'roles:list', 'role:list'],
  },
  {
    label: 'Izin Akses',
    path: '/settings/permissions',
    permissions: ['settings:list', 'permissions:list', 'permission:list'],
  },
  {
    label: 'Preferensi',
    path: '/settings/preference',
    permissions: ['settings:list', 'preference:list', 'preferences:list', 'settings-preference:list'],
  },
];

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

const REPORT_MENU_ORDER = [
  'Laporan Transaksi Kas',
  'Laporan Jurnal',
  'Laporan Buku Besar',
  'Laporan Neraca Lajur',
  'Laporan Laba Rugi',
  'Laporan Pembelian',
];

const sortReportMenuItems = (items: MenuItem[]) => {
  items.sort((a, b) => {
    const aIndex = REPORT_MENU_ORDER.indexOf(a.label);
    const bIndex = REPORT_MENU_ORDER.indexOf(b.label);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
};

const ensureJournalReportMenu = (items: MenuItem[], slug: string) => {
  const hasJournalReport = items.some((item) => item.href === resolvePath('/laporan/laporan-jurnal', slug));
  if (hasJournalReport) return;

  const cashReportIndex = items.findIndex((item) => item.href === resolvePath('/laporan/laporan-transaksi-kas', slug));
  const insertIndex = cashReportIndex >= 0 ? cashReportIndex + 1 : 0;
  items.splice(insertIndex, 0, {
    label: 'Laporan Jurnal',
    href: resolvePath('/laporan/laporan-jurnal', slug),
  });
};

const ensureLedgerReportMenu = (items: MenuItem[], slug: string) => {
  const ledgerHref = resolvePath('/laporan/laporan-buku-besar', slug);
  const hasLedgerReport = items.some((item) => item.href === ledgerHref);
  if (hasLedgerReport) return;

  const journalReportIndex = items.findIndex((item) => item.href === resolvePath('/laporan/laporan-jurnal', slug));
  const purchaseReportIndex = items.findIndex((item) => item.href === resolvePath('/laporan/laporan-pembelian', slug));
  const insertIndex = journalReportIndex >= 0 ? journalReportIndex + 1 : purchaseReportIndex >= 0 ? purchaseReportIndex : items.length;
  items.splice(insertIndex, 0, {
    label: 'Laporan Buku Besar',
    href: ledgerHref,
  });
};

const ensureBalanceColumnReportMenu = (items: MenuItem[], slug: string) => {
  const reportHref = resolvePath('/laporan/laporan-neraca-lajur', slug);
  const hasReport = items.some((item) => item.href === reportHref);
  if (hasReport) return;

  const ledgerIndex = items.findIndex(
    (item) => item.href === resolvePath('/laporan/laporan-buku-besar', slug),
  );
  const insertIndex = ledgerIndex >= 0 ? ledgerIndex + 1 : items.length;
  items.splice(insertIndex, 0, {
    label: 'Laporan Neraca Lajur',
    href: reportHref,
  });
};

const hasModuleAccess = (item: SidebarModuleItem, permissionSet: Set<string>) => {
  if (item.module.slug === 'dashboard') return true;
  if (permissionSet.has(`${item.module.slug}:list`)) return true;

  return item.features.some((feature) => permissionSet.has(`${feature.slug}:list`));
};

const sortSettingMenuItems = (items: MenuItem[]) => {
  items.sort((a, b) => {
    const aIndex = SETTING_MENU_ITEMS.findIndex((item) => item.label === a.label);
    const bIndex = SETTING_MENU_ITEMS.findIndex((item) => item.label === b.label);

    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
};

const ensureSettingMenu = (menus: MenuItem[], settingChildren: MenuItem[], permissionSet: Set<string>, slug: string) => {
  const existingSettingMenu = menus.find((menu) => menu.label === 'Setting');
  const children = [...(existingSettingMenu?.children ?? []), ...settingChildren];

  for (const item of SETTING_MENU_ITEMS) {
    const isAllowed = item.permissions.some((permission) => permissionSet.has(permission));
    const href = resolvePath(item.path, slug);
    const alreadyExists = children.some((child) => child.href === href);

    if (isAllowed && !alreadyExists) {
      children.push({
        label: item.label,
        href,
      });
    }
  }

  if (children.length === 0) return;

  const uniqueChildren = children.filter((child, index, source) => (
    source.findIndex((item) => item.href === child.href) === index
  ));
  sortSettingMenuItems(uniqueChildren);

  if (existingSettingMenu) {
    existingSettingMenu.children = uniqueChildren;
    return;
  }

  menus.push({
    label: 'Pengaturan',
    icon: Settings,
    children: uniqueChildren,
  });
};

export function buildDynamicMenus(sidebarData: SidebarModuleItem[], permissions: string[], slug: string): MenuItem[] {
  const menus: MenuItem[] = [];
  const settingChildren: MenuItem[] = [];
  const permissionSet = new Set(permissions);

  for (const item of sidebarData) {
    const moduleSlug = item.module.slug;
    if (!hasModuleAccess(item, permissionSet)) continue;
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
      label = 'Manajemen Admin';
      icon = Shield;
    } else if (moduleSlug === 'settings' || moduleSlug === 'setting') {
      label = 'Setting';
      icon = Settings;
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

      if (moduleSlug === 'settings' || moduleSlug === 'setting' || SETTING_FEATURE_SLUGS.has(feature.slug)) {
        const alreadyExists = settingChildren.some((child) => child.href === menuItem.href);
        if (!alreadyExists) {
          settingChildren.push(menuItem);
        }
        continue;
      }

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
      if (moduleSlug === 'report') {
        ensureJournalReportMenu(children, slug);
        ensureLedgerReportMenu(children, slug);
        ensureBalanceColumnReportMenu(children, slug);
        sortReportMenuItems(children);
      }

      menus.push({
        label,
        icon,
        children,
      });
    }
  }

  ensureSettingMenu(menus, settingChildren, permissionSet, slug);

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
