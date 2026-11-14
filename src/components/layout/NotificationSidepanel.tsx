'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Bell,
  X,
  RotateCw,
  AlertTriangle,
  Truck,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Search,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/components/ui/format-date';
import { useAppNotifications, useSyncAppNotifications } from '@/hooks/useAppNotification';
import { resolveNotificationUrl } from '@/lib/notification-link';
import type { AppNotification, AppNotificationType } from '@/@types/app-notification.types';
import { toast } from 'sonner';

interface NotificationSidepanelProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_CONFIG: Record<
  AppNotificationType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    badgeClass: string;
  }
> = {
  unit_transaction: {
    label: 'Unit Transaksi',
    icon: AlertTriangle,
    iconBg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  do_expedition: {
    label: 'DO Ekspedisi',
    icon: Truck,
    iconBg: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600',
    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  finance: {
    label: 'Finance / Kas',
    icon: DollarSign,
    iconBg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  login: {
    label: 'Keamanan / Login',
    icon: Bell,
    iconBg: 'bg-slate-100 border-slate-200',
    iconColor: 'text-slate-600',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  system: {
    label: 'Sistem',
    icon: Bell,
    iconBg: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
    badgeClass: 'border-purple-200 bg-purple-50 text-purple-700',
  },
  other: {
    label: 'Lainnya',
    icon: Bell,
    iconBg: 'bg-slate-100 border-slate-200',
    iconColor: 'text-slate-600',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-700',
  },
};

export function NotificationSidepanel({ open, onClose }: NotificationSidepanelProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;

  const [activeTab, setActiveTab] = useState<'all' | AppNotificationType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ESC key and body scroll lock
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Fetch notifications with automatic background polling every 30 seconds
  const { data, isLoading, isFetching, refetch } = useAppNotifications(
    {
      per_page: 50,
      sort_by: 'created_at',
      sort_order: 'desc',
    },
    { enabled: open },
  );

  const syncMutation = useSyncAppNotifications();

  const handleManualSync = async () => {
    try {
      await syncMutation.mutateAsync();
      toast.success('Notifikasi berhasil disinkronkan.');
    } catch {
      toast.error('Gagal menyinkronkan notifikasi.');
    }
  };

  const allNotifications = useMemo(() => data?.data ?? [], [data]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allNotifications.length,
      unit_transaction: 0,
      do_expedition: 0,
      finance: 0,
    };

    allNotifications.forEach((item) => {
      if (counts[item.type] !== undefined) {
        counts[item.type] += 1;
      }
    });

    return counts;
  }, [allNotifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let result = allNotifications;

    if (activeTab !== 'all') {
      result = result.filter((item) => item.type === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.message && item.message.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [allNotifications, activeTab, searchQuery]);

  const handleNavigate = (item: AppNotification) => {
    const targetUrl = resolveNotificationUrl(item.link, slug, item.type);
    onClose();
    router.push(targetUrl);
  };

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (Number.isNaN(d.getTime())) return '-';
      return formatDistanceToNow(d, { addSuffix: true, locale: id });
    } catch {
      return formatDate(isoString, true);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidepanel */}
      <aside className="fixed inset-y-0 right-0 flex h-full w-full max-w-full sm:max-w-md md:max-w-[460px] flex-col bg-white shadow-2xl border-l border-slate-200 transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-xs text-slate-800">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Notifikasi</h2>
                {allNotifications.length > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold">
                    {allNotifications.length}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">Anomali operasional & transaksi perlu tindakan</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleManualSync}
              disabled={syncMutation.isPending || isFetching}
              title="Sinkronkan notifikasi terbaru"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
            >
              <RotateCw className={cn('h-4 w-4', (syncMutation.isPending || isFetching) && 'animate-spin text-primary')} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              title="Tutup (Esc)"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="border-b border-slate-100 bg-white p-3 space-y-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              Semua ({categoryCounts.all ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unit_transaction')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
                activeTab === 'unit_transaction'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
              )}
            >
              Unit ({categoryCounts.unit_transaction ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('do_expedition')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
                activeTab === 'do_expedition'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100',
              )}
            >
              Ekspedisi ({categoryCounts.do_expedition ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className={cn(
                'px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
                activeTab === 'finance'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
              )}
            >
              Finance ({categoryCounts.finance ?? 0})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari notifikasi atau no. dokumen..."
              className="h-8 w-full rounded-md border border-slate-200 bg-slate-50/70 pl-8 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-300"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {isLoading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-3.5 space-y-2 bg-slate-50/40">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-md" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-4/5" />
                  <div className="flex justify-between pt-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {searchQuery || activeTab !== 'all' ? 'Tidak Ada Notifikasi Sesuai Filter' : 'Semua Beres!'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-[280px]">
                {searchQuery || activeTab !== 'all'
                  ? 'Coba ganti kata kunci pencarian atau ubah tab kategori.'
                  : 'Tidak ada notifikasi aktif. Seluruh anomali unit, ekspedisi, dan kas telah selesai.'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                  refetch();
                }}
              >
                Muat Ulang
              </Button>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.other;
              const IconComponent = config.icon;

              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-2xs mt-0.5',
                        config.iconBg,
                        config.iconColor,
                      )}
                    >
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={cn('text-[10px] font-semibold px-2 py-0.5', config.badgeClass)}>
                          {config.label}
                        </Badge>
                        <span
                          className="text-[11px] text-slate-400 shrink-0 font-medium"
                          title={formatDate(item.created_at, true)}
                        >
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>

                      <h4 className="mt-1.5 text-xs font-semibold text-slate-900 group-hover:text-primary transition-colors leading-snug">
                        {item.name}
                      </h4>

                      {item.message && (
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {item.message}
                        </p>
                      )}

                      {/* Action Button */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400">
                          {formatDate(item.created_at, true)}
                        </span>

                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => handleNavigate(item)}
                          className="text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 gap-1"
                        >
                          Lihat Rincian
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-200 bg-slate-50/90 px-4 py-2.5 text-center">
          <p className="text-[11px] text-slate-400">
            Status notifikasi otomatis diselesaikan (*self-healing*) saat transaksi lunas atau tervalidasi.
          </p>
        </div>
      </aside>
    </div>
  );
}
