import { ChevronDown, Check, Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { Company } from '@/services/company.service';
import { getPreferences, getPreferenceValue, PreferenceItem, updatePreference } from '@/services/preference.service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useCompanyMenu } from '@/hooks/use-company-menu';
import { MenuItem } from '@/types/menu.types';
import { clearCompanyScopedQueries } from '@/lib/session/query-cache';
import Image from 'next/image';
import { AuthService } from '@/features/auth/services/auth.service';

const SIDEBAR_COLLAPSED_PREFERENCE_KEY = 'sidebar_collapsed';

const parseBooleanPreference = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return fallback;
};

const readStoredSidebarCollapsed = () => {
  if (typeof window === 'undefined') return false;

  const config = localStorage.getItem('site_config');
  if (!config) return false;

  try {
    const parsed = JSON.parse(config);
    if (Array.isArray(parsed)) {
      const item = parsed.find((i: any) => i && i.key === SIDEBAR_COLLAPSED_PREFERENCE_KEY);
      return item ? parseBooleanPreference(item.value) : false;
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return parseBooleanPreference(parsed[SIDEBAR_COLLAPSED_PREFERENCE_KEY]);
    }
  } catch (e) {
    console.warn(e);
  }

  return false;
};

const writeStoredSidebarCollapsed = (collapsed: boolean) => {
  if (typeof window === 'undefined') return;

  try {
    const existing = localStorage.getItem('site_config');
    let configList: Array<{ key: string; value: any }> = [];
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          configList = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          configList = Object.entries(parsed).map(([key, value]) => ({ key, value }));
        }
      } catch (e) {
        configList = [];
      }
    }
    const existingIndex = configList.findIndex((item) => item && item.key === SIDEBAR_COLLAPSED_PREFERENCE_KEY);
    if (existingIndex > -1) {
      configList[existingIndex].value = collapsed;
    } else {
      configList.push({ key: SIDEBAR_COLLAPSED_PREFERENCE_KEY, value: collapsed });
    }
    localStorage.setItem('site_config', JSON.stringify(configList));
  } catch (err) {
    console.warn(err);
  }
};

const ensureReportFallbackSidebarMenus = (menus: MenuItem[], slug: string): MenuItem[] => {
  return menus.map((menu) => {
    if (menu.label !== 'Laporan' || !menu.children) return menu;

    const journalHref = slug ? `/dashboard/${slug}/laporan/laporan-jurnal` : '/laporan/laporan-jurnal';
    const ledgerHref = slug ? `/dashboard/${slug}/laporan/laporan-buku-besar` : '/laporan/laporan-buku-besar';
    const balanceColumnHref = slug ? `/dashboard/${slug}/laporan/laporan-neraca-lajur` : '/laporan/laporan-neraca-lajur';
    const profitLossHref = slug ? `/dashboard/${slug}/laporan/laporan-laba-rugi` : '/laporan/laporan-laba-rugi';
    const balanceReportHref = slug ? `/dashboard/${slug}/laporan/ballance-report` : '/laporan/ballance-report';
    const children = [...menu.children];
    const hasJournal = menu.children.some((child) => child.href === journalHref || child.label === 'Laporan Jurnal');
    const hasLedger = menu.children.some((child) => child.href === ledgerHref || child.label === 'Laporan Buku Besar');
    const hasBalanceColumn = menu.children.some((child) => child.href === balanceColumnHref || child.label === 'Laporan Neraca Lajur');
    const hasProfitLoss = menu.children.some((child) => child.href === profitLossHref || child.label === 'Laporan Laba Rugi');
    const hasBalanceReport = menu.children.some((child) => child.href === balanceReportHref || child.label === 'Laporan Neraca');

    if (!hasJournal) {
      const purchaseIndex = children.findIndex((child) => child.label === 'Laporan Pembelian');
      const cashIndex = children.findIndex((child) => child.label === 'Laporan Transaksi Kas');
      const insertIndex = purchaseIndex >= 0 ? purchaseIndex : cashIndex >= 0 ? cashIndex + 1 : children.length;

      children.splice(insertIndex, 0, {
        label: 'Laporan Jurnal',
        href: journalHref,
      });
    }

    if (!hasLedger) {
      const journalIndex = children.findIndex((child) => child.label === 'Laporan Jurnal');
      const purchaseIndex = children.findIndex((child) => child.label === 'Laporan Pembelian');
      const insertIndex = journalIndex >= 0 ? journalIndex + 1 : purchaseIndex >= 0 ? purchaseIndex : children.length;

      children.splice(insertIndex, 0, {
        label: 'Laporan Buku Besar',
        href: ledgerHref,
      });
    }

    if (!hasBalanceColumn) {
      const ledgerIndex = children.findIndex((child) => child.label === 'Laporan Buku Besar');
      const insertIndex = ledgerIndex >= 0 ? ledgerIndex + 1 : children.length;

      children.splice(insertIndex, 0, {
        label: 'Laporan Neraca Lajur',
        href: balanceColumnHref,
      });
    }

    if (!hasProfitLoss) {
      const balanceColumnIndex = children.findIndex((child) => child.label === 'Laporan Neraca Lajur');
      const ledgerIndex = children.findIndex((child) => child.label === 'Laporan Buku Besar');
      const purchaseIndex = children.findIndex((child) => child.label === 'Laporan Pembelian');
      const insertIndex = balanceColumnIndex >= 0
        ? balanceColumnIndex + 1
        : ledgerIndex >= 0
          ? ledgerIndex + 1
          : purchaseIndex >= 0
            ? purchaseIndex
            : children.length;

      children.splice(insertIndex, 0, {
        label: 'Laporan Laba Rugi',
        href: profitLossHref,
      });
    }

    if (!hasBalanceReport) {
      const profitLossIndex = children.findIndex((child) => child.label === 'Laporan Laba Rugi');
      const purchaseIndex = children.findIndex((child) => child.label === 'Laporan Pembelian');
      const insertIndex = profitLossIndex >= 0
        ? profitLossIndex + 1
        : purchaseIndex >= 0
          ? purchaseIndex
          : children.length;

      children.splice(insertIndex, 0, {
        label: 'Laporan Neraca',
        href: balanceReportHref,
      });
    }

    return {
      ...menu,
      children,
    };
  });
};

function CompanySelector({ companies, companyId }: { companies: Company[], companyId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCompanyId } = useCompany();
  const selectedCompany = companies.find((c) => String(c.id) === String(companyId));

  const handleSelectCompany = (company: Company) => {
    if (String(company.id) === String(companyId)) {
      setIsOpen(false);
      return;
    }

    AuthService.clearCachedCompanyAccess();
    queryClient.removeQueries({ queryKey: ['auth', 'permissions'] });
    queryClient.removeQueries({ queryKey: ['auth', 'sidebar'] });
    clearCompanyScopedQueries(queryClient);
    setCompanyId(String(company.id));
    setIsOpen(false);
    const targetSlug = company.slug || company.id;
    router.push(`/dashboard/${targetSlug}`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-md border cursor-pointer border-gray-300 bg-white px-3 py-1.5 text-left shadow-sm hover:bg-gray-50 transition-colors">
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] uppercase font-semibold text-red-400">Perusahaan</span>
            <span className="font-medium text-gray-900 truncate uppercase">{selectedCompany ? selectedCompany.name : 'Select Company'}</span>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-gray-500 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelectCompany(company)}
              className={cn('flex cursor-pointer w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-gray-100', String(company.id) === String(companyId) && 'bg-gray-100')}
            >
              <span className="uppercase">{company.name}</span>
              {String(company.id) === String(companyId) && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SidebarProps {
  isDesktopCollapsed?: boolean;
  onDesktopCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({
  isDesktopCollapsed: controlledDesktopCollapsed,
  onDesktopCollapsedChange,
}: SidebarProps = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { companyId, companies } = useCompany();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [internalDesktopCollapsed, setInternalDesktopCollapsed] = useState(() => {
    return readStoredSidebarCollapsed();
  });
  const isDesktopCollapsed = controlledDesktopCollapsed ?? internalDesktopCollapsed;
  const { data: preferences } = useQuery({
    queryKey: ['settings', 'preference', companyId],
    queryFn: () => getPreferences(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const updatePreferenceMutation = useMutation({
    mutationFn: (collapsed: boolean) => updatePreference(companyId as string, SIDEBAR_COLLAPSED_PREFERENCE_KEY, collapsed),
    onSuccess: (updatedPreferences, collapsed) => {
      queryClient.setQueryData<PreferenceItem[]>(['settings', 'preference', companyId], (current) => {
        if (updatedPreferences.length > 0) return updatedPreferences;

        const preference = { key: SIDEBAR_COLLAPSED_PREFERENCE_KEY, value: collapsed };
        if (!current) return [preference];

        const existingIndex = current.findIndex((item) => item.key === SIDEBAR_COLLAPSED_PREFERENCE_KEY);
        if (existingIndex < 0) return [...current, preference];

        return current.map((item, index) => (
          index === existingIndex ? preference : item
        ));
      });
    },
    onError: (error) => {
      console.warn(error);
    },
  });

  const setIsDesktopCollapsed = (collapsed: boolean) => {
    if (controlledDesktopCollapsed === undefined) {
      setInternalDesktopCollapsed(collapsed);
    }
    writeStoredSidebarCollapsed(collapsed);
    if (companyId) {
      updatePreferenceMutation.mutate(collapsed);
    }
    onDesktopCollapsedChange?.(collapsed);
  };

  const { menus, isLoading: isMenuLoading } = useCompanyMenu(companies);
  const slugQuery = router.query.slug;
  const slug = Array.isArray(slugQuery) ? slugQuery[0] : slugQuery || '';
  const visibleMenus = useMemo(() => ensureReportFallbackSidebarMenus(menus, slug), [menus, slug]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!preferences) return;

    const collapsedPreference = getPreferenceValue(preferences, SIDEBAR_COLLAPSED_PREFERENCE_KEY, undefined);
    if (collapsedPreference === undefined) return;

    const collapsed = parseBooleanPreference(collapsedPreference);
    if (collapsed === isDesktopCollapsed) return;

    if (controlledDesktopCollapsed === undefined) {
      setInternalDesktopCollapsed(collapsed);
      writeStoredSidebarCollapsed(collapsed);
      return;
    }

    onDesktopCollapsedChange?.(collapsed);
  }, [
    controlledDesktopCollapsed,
    isDesktopCollapsed,
    onDesktopCollapsedChange,
    preferences,
  ]);

  const sidebarContent = (
    <aside className="flex h-full w-full flex-col border-r border-gray-200 bg-[#F9FAFB]">
      <div className={cn("flex h-16 shrink-0 items-center border-b border-gray-200", isDesktopCollapsed ? "px-0 justify-center" : "px-4")}>
        <div className="flex w-full items-center gap-2">
          {isDesktopCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={() => setIsDesktopCollapsed(false)}
                className="p-2 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                title="Expand Sidebar"
              >
                <Image src="/wajira-logo.png" alt="Wajira Logo" height={40} width={40} priority />
                {/* <PanelLeftOpen className="w-5 h-5" /> */}
              </button>
            </div>
          ) : (
            <>
              <CompanySelector
                companies={companies}
                companyId={companyId}
              />

              <button
                onClick={() => setIsMobileOpen(false)}
                className="md:hidden ml-1 shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-200 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto py-6", isDesktopCollapsed ? "px-2" : "px-4")}>
        <div className="mb-4 flex items-center justify-between text-sm font-semibold text-gray-500">
          {!isDesktopCollapsed && <span className="uppercase text-xs tracking-wider">Menu Utama</span>}
          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className={cn("hidden md:block p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors", isDesktopCollapsed && "mx-auto")}
            title="Toggle Sidebar"
          >
            {isDesktopCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
          </button>
        </div>

        <nav className="space-y-1">
          {isMenuLoading ? (
            <div className="space-y-2 animate-pulse px-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-gray-200 rounded-md w-full"></div>
              ))}
            </div>
          ) : (
            visibleMenus.map((item, index) => (
              <SidebarNavItem key={index} item={item} isCollapsed={isDesktopCollapsed} />
            ))
          )}
        </nav>
      </div>
    </aside>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed mt-3 left-4 z-40 rounded-md border border-gray-200 bg-white p-2 shadow-sm text-gray-700 hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:flex h-full w-full">
        {sidebarContent}
      </div>

      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-primary/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}

function SidebarNavItem({ item, isCollapsed }: { item: MenuItem; isCollapsed?: boolean }) {
  const router = useRouter();

  const isActiveRoute = (href?: string, exact?: boolean) => {
    if (!href) return false;
    const currentPath = router.asPath.split('?')[0];
    if (exact) {
      return currentPath === href;
    }
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  const hasActiveChild = (menuItem: MenuItem): boolean => {
    if (menuItem.href && isActiveRoute(menuItem.href, menuItem.exact)) {
      return true;
    }
    if (menuItem.children) {
      return menuItem.children.some(hasActiveChild);
    }
    return false;
  };

  const isChildActive = item.children?.some(hasActiveChild) || false;
  const isSelfActive = item.href ? isActiveRoute(item.href, item.exact) : false;

  const [open, setOpen] = useState(isChildActive || false);

  useEffect(() => {
    if (isChildActive && !isCollapsed) {
      setOpen(true);
    }
  }, [isChildActive, isCollapsed]);

  const handleToggle = () => {
    if (isChildActive && !isCollapsed) return;
    setOpen(!open);
  };

  if (!item.children && item.href) {
    return (
      <div className={cn(isCollapsed && "flex justify-center mb-1")}>
        <Link
          href={item.href}
          title={isCollapsed ? item.label : undefined}
          className={cn(
            'flex items-center justify-between rounded-md py-[9px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3',
            isSelfActive ? 'sidebar-menu-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          )}
          aria-current={isSelfActive ? 'page' : undefined}
        >
          <div className="flex items-center gap-3">
            {item.icon && <item.icon className={cn("w-[18px] h-[18px] shrink-0", isSelfActive ? "text-white" : "text-slate-500")} />}
            {!isCollapsed && <span>{item.label}</span>}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(isCollapsed && "flex justify-center mb-1")}>
      <button
        onClick={handleToggle}
        title={isCollapsed ? item.label : undefined}
        className={cn(
          'flex items-center justify-between rounded-md py-[9px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer',
          isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3',
          isChildActive ? 'text-orange-600 bg-orange-50/80 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )}
      >
        <div className="flex items-center gap-3">
          {item.icon && <item.icon className={cn("w-[18px] h-[18px] shrink-0", isChildActive ? "text-orange-600" : "text-slate-500")} />}
          {!isCollapsed && <span>{item.label}</span>}
        </div>
        {!isCollapsed && item.children && (
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180', isChildActive ? 'text-orange-600' : 'text-slate-400')} />
        )}
      </button>

      {item.children && open && !isCollapsed && (
        <div className="relative mt-1 ml-[22px] space-y-1">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />

          {item.children.map((child, idx) => (
            <SidebarSubNavItem
              key={idx}
              item={child}
              isActiveRoute={isActiveRoute}
              hasActiveChild={hasActiveChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarSubNavItem({
  item,
  isActiveRoute,
  hasActiveChild,
}: {
  item: MenuItem;
  isActiveRoute: (href?: string, exact?: boolean) => boolean;
  hasActiveChild: (menuItem: MenuItem) => boolean;
}) {
  const isSubChildActive = item.children?.some(hasActiveChild) || false;
  const [open, setOpen] = useState(isSubChildActive);

  useEffect(() => {
    if (isSubChildActive) {
      setOpen(true);
    }
  }, [isSubChildActive]);

  if (!item.children) {
    const active = isActiveRoute(item.href, item.exact);
    return (
      <Link
        href={item.href || '#'}
        className={cn(
          'group relative ml-1 block rounded-md pl-3 pr-2 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          active ? 'sidebar-menu-primary' : 'text-slate-600 hover:bg-orange-50/60 hover:text-orange-600',
        )}
        aria-current={active ? 'page' : undefined}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="ml-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between rounded-md pl-3 pr-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer',
          isSubChildActive ? 'text-orange-600 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )}
      >
        <span>{item.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180', isSubChildActive ? 'text-orange-600' : 'text-slate-400')} />
      </button>

      {open && (
        <div className="relative mt-1 ml-3 space-y-1">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
          {item.children.map((subChild, idx) => {
            const active = isActiveRoute(subChild.href, subChild.exact);
            return (
              <Link
                key={idx}
                href={subChild.href || '#'}
                className={cn(
                  'group relative ml-2 block rounded-md pl-3 pr-2 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  active ? 'sidebar-menu-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {subChild.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
