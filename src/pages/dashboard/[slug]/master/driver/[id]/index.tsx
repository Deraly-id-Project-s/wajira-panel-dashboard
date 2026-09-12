import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Building2, CalendarDays, CheckCircle2, CircleUserRound, Clock3, Copy, CreditCard,
  ExternalLink, Eye, EyeOff, FileBadge2, Globe2, IdCard, ImageIcon, KeyRound, Link2,
  MapPin, Pencil, Phone, ShieldCheck, UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { Switch } from '@/components/ui/switch';
import { ShowMapLeaflet, parseMapCoordinate } from '@/components/ui/show-map-leaflet';
import { StorageImage } from '@/components/ui/storage-image';
import { useActivateDriver, useDeactivateDriver, useDriverDetail } from '@/hooks/useDriver';
import { getDriverPassword } from '@/services/driver.service';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { cn } from '@/lib/utils';

const display = (value?: string | number | null) =>
  value === undefined || value === null || value === '' ? '-' : String(value);

const formatDate = (value?: string | null, includeTime = false) => {
  if (!value) return '-';
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(parsedDate);
};

const getSafeExternalUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex min-w-0 items-start gap-2 text-sm font-semibold text-slate-950">
        {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> : null}
        <div className="min-w-0 break-words">{value || '-'}</div>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-orange-100 p-2 text-orange-700"><Icon className="h-5 w-5" /></div>
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, valueClassName }: { label: string; value: React.ReactNode; icon: React.ElementType; valueClassName?: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-md bg-orange-100 p-3 text-orange-700"><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <div className={cn('mt-1 truncate text-sm font-bold text-slate-950', valueClassName)}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExternalLinkField({ label, value }: { label: string; value?: string | null }) {
  const safeUrl = getSafeExternalUrl(value);
  return (
    <Field
      label={label}
      icon={Link2}
      value={safeUrl ? (
        <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 hover:underline">
          Buka tautan <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : display(value)}
    />
  );
}

export default function DriverDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const { data: driver, isLoading, isError, refetch } = useDriverDetail(id ?? null);
  const activateMutation = useActivateDriver();
  const deactivateMutation = useDeactivateDriver();
  const { hasPermission } = usePermissionGuard();
  const canEdit = hasPermission('master-data:edit');
  const [password, setPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isFetchingPassword, setIsFetchingPassword] = useState(false);
  const listPath = `/dashboard/${slug}/master/driver`;
  const isActive = driver?.isActive === true || driver?.isActive === 1;
  const isStatusPending = activateMutation.isPending || deactivateMutation.isPending;
  const mapCoordinate = parseMapCoordinate(driver?.mapCoordinat);

  useEffect(() => {
    setPassword(null);
    setShowPassword(false);
  }, [id]);

  const revealPassword = async () => {
    if (showPassword) {
      setShowPassword(false);
      return;
    }
    if (!password && id) {
      setIsFetchingPassword(true);
      try {
        setPassword(await getDriverPassword(id));
      } catch (error: any) {
        toast.error(error?.message || 'Gagal mengambil password driver');
        return;
      } finally {
        setIsFetchingPassword(false);
      }
    }
    setShowPassword(true);
  };

  const toggleStatus = async (checked: boolean) => {
    if (!driver || !canEdit) return;
    try {
      if (checked) await activateMutation.mutateAsync(driver.id);
      else await deactivateMutation.mutateAsync(driver.id);
      toast.success(`Driver berhasil ${checked ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengubah status driver');
    }
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Password berhasil disalin');
    } catch {
      toast.error('Password gagal disalin');
    }
  };

  const copyDriverCode = async () => {
    if (!driver?.code) return;
    try {
      await navigator.clipboard.writeText(driver.code);
      toast.success('Kode driver berhasil disalin');
    } catch {
      toast.error('Kode driver gagal disalin');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <PageHeader
          title="Detail Driver"
          breadcrumbs={[{ label: 'Driver', onClick: () => void router.push(listPath) }, { label: 'Detail Driver' }]}
          onBack={() => void router.push(listPath)}
          subtitle={driver ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Kode Driver:</span>
              <button type="button" onClick={() => void copyDriverCode()} className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">
                {driver.code || '-'} {driver.code ? <Copy className="h-3.5 w-3.5" /> : null}
              </button>
              <Badge variant="outline" className={cn('rounded-full px-3 py-1', isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600')}>
                {isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
              <span className="text-xs text-slate-500">Dibuat {formatDate(driver.createdAt, true)}</span>
            </div>
          ) : 'Informasi lengkap driver'}
          actions={canEdit && driver ? (
            <Button onClick={() => void router.push(`${listPath}/${id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit Driver</Button>
          ) : undefined}
        />

        {isLoading ? (
          <LoadingState variant="section" text="Memuat detail driver..." />
        ) : isError || !driver ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">Detail driver tidak dapat dimuat.</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => void refetch()}>Coba Lagi</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="Status Akun" value={isActive ? 'Driver Aktif' : 'Driver Nonaktif'} icon={ShieldCheck} valueClassName={isActive ? 'text-emerald-700' : 'text-slate-600'} />
              <SummaryCard label="Perusahaan" value={driver.company?.name || '-'} icon={Building2} />
              <SummaryCard label="Tanggal Bergabung" value={formatDate(driver.joinedAt)} icon={CalendarDays} />
              <SummaryCard label="Login Terakhir" value={formatDate(driver.lastLogin, true)} icon={Clock3} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="space-y-6 p-5 sm:p-6">
                  <SectionHeading icon={CircleUserRound} title="Informasi Driver" description="Identitas, kontak, dan dokumen pengemudi" />
                  <div className="grid gap-6 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-3">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-orange-200 bg-orange-50 text-orange-700">
                        {driver.image ? <StorageImage src={driver.image} alt={`Foto ${driver.name}`} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-slate-950">{driver.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{driver.code || 'Kode driver belum tersedia'}</p>
                        <Badge variant="outline" className="mt-2 rounded-full border-orange-200 bg-orange-50 text-orange-700">{driver.type || 'Driver'}</Badge>
                      </div>
                    </div>
                    <Field label="Nama Driver" value={driver.name} icon={UserRound} />
                    <Field label="Nama PIC" value={display(driver.picName)} icon={CircleUserRound} />
                    <Field label="Nomor Telepon" value={display(driver.phone)} icon={Phone} />
                    <Field label="NPWP" value={display(driver.npwp)} icon={CreditCard} />
                    <Field label="Nomor KTP" value={display(driver.identityNumber)} icon={IdCard} />
                    <Field label="Nomor SIM" value={display(driver.driveLicenseNumber)} icon={FileBadge2} />
                  </div>
                  <div className="rounded-md bg-orange-50 p-4"><Field label="Alamat Driver" value={display(driver.address)} icon={MapPin} /></div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardContent className="space-y-6 p-5 sm:p-6">
                  <SectionHeading icon={KeyRound} title="Akun Driver" description="Informasi login dan status akses aplikasi" />
                  <div className="space-y-5 border-t border-slate-100 pt-5">
                    <Field label="Username" value={display(driver.username)} icon={UserRound} />
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Password</p>
                      <div className="flex gap-2">
                        <div className="flex h-10 min-w-0 flex-1 items-center truncate rounded-md border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-900">{showPassword ? display(password) : '••••••••'}</div>
                        <Button type="button" variant="outline" size="icon" onClick={() => void revealPassword()} disabled={isFetchingPassword} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {showPassword ? <Button type="button" variant="outline" size="icon" onClick={() => void copyPassword()} aria-label="Salin password"><Copy className="h-4 w-4" /></Button> : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50/60 p-4">
                      <div>
                        <p className="font-semibold text-slate-950">Status Akun</p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <CheckCircle2 className={cn('h-3.5 w-3.5', isActive ? 'text-emerald-600' : 'text-slate-400')} />
                          {isActive ? 'Dapat mengakses aplikasi' : 'Akses aplikasi dinonaktifkan'}
                        </div>
                      </div>
                      <Switch checked={isActive} onCheckedChange={(checked) => void toggleStatus(checked)} disabled={!canEdit || isStatusPending} aria-label="Ubah status akun driver" />
                    </div>
                    <Field label="Login Terakhir" value={formatDate(driver.lastLogin, true)} icon={Clock3} />
                    <Field label="Dibuat Pada" value={formatDate(driver.createdAt, true)} icon={CalendarDays} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <SectionHeading icon={MapPin} title="Lokasi Driver" description="Preview titik lokasi yang tersimpan pada data driver" />
                <div className="grid gap-5 border-t border-slate-100 pt-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="space-y-5 rounded-md bg-orange-50 p-4">
                    <Field label="Koordinat" value={mapCoordinate ? `${mapCoordinate.lat}, ${mapCoordinate.lng}` : 'Belum tersedia'} icon={MapPin} />
                    <ExternalLinkField label="Link Maps" value={driver.mapLink} />
                    <p className="text-xs leading-relaxed text-slate-500">Koordinat diperbarui melalui form edit driver dan digunakan sebagai titik preview pada peta.</p>
                  </div>
                  {mapCoordinate ? (
                    <ShowMapLeaflet value={mapCoordinate} className="h-[320px] min-h-[280px]" ariaLabel={`Preview lokasi ${driver.name}`} />
                  ) : (
                    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                      <MapPin className="h-9 w-9 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-700">Koordinat belum tersedia</p>
                      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">Edit data driver dan pilih lokasi agar preview peta dapat ditampilkan.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
