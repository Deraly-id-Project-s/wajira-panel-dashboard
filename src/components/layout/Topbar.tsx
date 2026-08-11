import { useEffect, useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Bell, Clock, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthMe } from '@/features/auth/hooks/use-auth-me';
import { performClientLogout } from '@/lib/session/logout';
import { fetchUserCompanies, Company } from '@/services/company.service';
import { useCompanyMenu } from '@/hooks/use-company-menu';
import { MenuItem } from '@/types/menu.types';
import { cn } from '@/lib/utils';
import { ParsedImage } from '@/components/ui/parsed-image';

const RECENT_STORAGE_KEY = 'global-search-recent';

const flattenMenus = (items: MenuItem[]): Array<{ label: string; href: string; parentLabel?: string }> => {
  const list: Array<{ label: string; href: string; parentLabel?: string }> = [];
  const traverse = (itemsList: MenuItem[], parent?: string) => {
    itemsList.forEach((item) => {
      if (item.href) {
        list.push({
          label: item.label,
          href: item.href,
          parentLabel: parent,
        });
      }
      if (item.children) {
        traverse(item.children, item.label);
      }
    });
  };
  traverse(items);
  return list;
};

export function Topbar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { data: profile, isLoading: isProfileLoading } = useAuthMe();
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetchUserCompanies()
      .then((data) => {
        setCompanies(data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch user companies:', err);
      });
  }, []);

  // Keyboard shortcut handler (Cmd + K or Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { menus } = useCompanyMenu(companies);

  const allFlattenedMenus = useMemo(() => {
    return flattenMenus(menus);
  }, [menus]);

  const filteredMenus = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allFlattenedMenus.filter((m) =>
      m.label.toLowerCase().includes(q) ||
      (m.parentLabel && m.parentLabel.toLowerCase().includes(q))
    );
  }, [allFlattenedMenus, query]);

  const user = profile?.data;

  const displayName = user?.name || [user?.firstname, user?.lastname].filter(Boolean).join(' ') || '-';
  const userId = user?.username || user?.email || String(user?.id ?? '-');
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'US';

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_STORAGE_KEY);
    if (stored) setRecentItems(JSON.parse(stored));
  }, []);

  const saveRecent = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    let updated = [trimmed, ...recentItems.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())];
    updated = updated.slice(0, 6);
    setRecentItems(updated);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteRecent = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentItems.filter((item) => item.toLowerCase() !== value.toLowerCase());
    setRecentItems(updated);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredMenus.length > 0) {
      const target = filteredMenus[0];
      router.push(target.href);
      saveRecent(target.label);
      setQuery('');
      setOpen(false);
      setMobileSearchOpen(false);
    } else {
      saveRecent(query);
      setOpen(false);
      setMobileSearchOpen(false);
    }
  };

  const handleLogout = () => {
    performClientLogout(queryClient);
    router.replace('/login');
  };

  const handleProfileClick = () => {
    router.push(slug ? `/dashboard/${slug}/profile` : `/dashboard/profile`);
  };

  const SearchResultsList = (
    <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto px-4 py-3">
      {query.trim() === '' ? (
        recentItems.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pencarian Terakhir</p>
            <div className="space-y-1">
              {recentItems.map((item, index) => {
                const matchedMenu = allFlattenedMenus.find(
                  (m) => m.label.toLowerCase() === item.toLowerCase()
                );
                return (
                  <div
                    key={index}
                    className="group/item flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm text-gray-700 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => {
                      if (matchedMenu) {
                        router.push(matchedMenu.href);
                        saveRecent(matchedMenu.label);
                      } else {
                        setQuery(item);
                      }
                      setOpen(false);
                      setMobileSearchOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-3 truncate mr-2">
                      <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => deleteRecent(item, e)}
                      className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-gray-200/60 rounded text-gray-400 hover:text-gray-600 transition shrink-0"
                      title="Hapus pencarian terakhir"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-gray-400">
            Ketik untuk mencari menu atau fitur...
          </div>
        )
      ) : (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hasil Pencarian</p>
          {filteredMenus.length > 0 ? (
            <div className="space-y-1">
              {filteredMenus.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    saveRecent(item.label);
                    setQuery('');
                    setOpen(false);
                    setMobileSearchOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-slate-50 hover:text-[#1e3a5f] transition group"
                >
                  <div className="flex flex-col overflow-hidden mr-2">
                    <span className="font-medium truncate">{item.label}</span>
                    {item.parentLabel && (
                      <span className="text-[10px] text-gray-400 group-hover:text-[#1e3a5f]/70 mt-0.5 truncate">
                        {item.parentLabel}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-[#1e3a5f] font-mono shrink-0">↗</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-400">
              Menu atau fitur tidak ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
        {/* Left — spacer on mobile (hamburger is fixed, handled by Sidebar) */}
        <div className="flex items-center gap-3">
          {/* Spacer so content doesn't sit behind hamburger on mobile */}
          <div className="w-8 md:hidden" />

          {/* ── Desktop Search ── */}
          <div className="hidden md:block relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <form onSubmit={handleSearchSubmit}>
              <input autoComplete="off"
                ref={searchInputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search here..."
                className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-12 text-sm text-gray-900 placeholder:text-gray-400 transition focus:bg-white focus:outline-none focus:border-slate-300"
              />
            </form>

            {/* Keyboard shortcut hint badge */}
            <div className={cn("absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-0.5 bg-gray-200/50 border border-gray-300/40 rounded px-1.5 py-0.5 text-[10px] font-mono text-gray-500 transition-opacity", (open || query) && "opacity-0")}>
              <span className="text-[9px]">⌘</span>K
            </div>

            {open && (
              <>
                {/* Backdrop handler to close search dropdown when user clicks outside */}
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute left-0 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
                  {SearchResultsList}
                </div>
              </>
            )}
          </div>

          {/* ── Mobile Search Button ── */}
          <button
            onClick={() => setMobileSearchOpen(true)}
            className="md:hidden flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 hover:bg-white transition"
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
          </button>
        </div>

        {/* ── Right Side ── */}
        <div className="flex items-center gap-4 md:gap-6">
          <button className="text-gray-600 hover:text-black transition">
            <Bell className="h-5 w-5" />
          </button>

          <div className="h-8 w-px bg-gray-200" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 outline-none hover:opacity-80 transition-opacity">
                {/* Hide name/userId on mobile, show only avatar */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[13px] leading-tight font-semibold text-gray-900" title={displayName}>
                    {isProfileLoading ? 'Loading...' : displayName}
                  </span>
                  <span className="text-[11px] leading-tight text-slate-500 font-medium mt-0.5" title={`User ID: ${userId}`}>
                    {isProfileLoading ? '' : userId}
                  </span>
                </div>
                <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-slate-50 text-[13px] font-bold text-black border border-gray-100 overflow-hidden">
                  {user?.avatar ? (
                    <ParsedImage
                      src={user.avatar}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-2 rounded-md">
              <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer font-medium text-slate-900 text-[13px] py-2 px-3 rounded-lg hover:bg-slate-50 focus:bg-slate-50">
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer font-medium text-red-600 text-[13px] py-2 px-3 rounded-lg hover:bg-red-50 focus:bg-red-50 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Mobile Search Modal ── */}
      {mobileSearchOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-white">
          {/* Modal Header */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input autoComplete="off"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search here..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </form>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 transition"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {SearchResultsList}
          </div>
        </div>
      )}
    </>
  );
}
