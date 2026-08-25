import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Copy, Eye, EyeOff, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { Switch } from '@/components/ui/switch';
import { useActivateDriver, useDeactivateDriver, useDriverDetail } from '@/hooks/useDriver';
import { getDriverPassword } from '@/services/driver.service';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';

const display = (value?: string | number | null) => value === undefined || value === null || value === '' ? '-' : String(value);
const date = (value?: string | null) => value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

function DetailItem({ label, value }: { label: string; value?: string | number | null }) {
  return <div><p className="mb-1 text-xs text-slate-500">{label}</p><p className="text-slate-900">{display(value)}</p></div>;
}

export default function DriverDetailPage() {
  const router = useRouter();
  const slug = router.query.slug as string;
  const id = router.query.id as string | undefined;
  const { data: driver, isLoading, isError } = useDriverDetail(id ?? null);
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
    await navigator.clipboard.writeText(password);
    toast.success('Password berhasil disalin');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Detail Driver" subtitle={driver ? `${driver.code || '-'} · ${driver.name}` : 'Informasi lengkap driver'} breadcrumbs={[{ label: 'Driver', onClick: () => router.push(listPath) }, { label: 'Detail' }]} onBack={() => router.push(listPath)} actions={canEdit && driver ? <Button onClick={() => router.push(`${listPath}/${id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit Driver</Button> : undefined} />
        {isLoading ? <LoadingState variant="section" text="Memuat detail driver..." /> : isError || !driver ? <div className="rounded-md border bg-white p-6 text-sm text-red-600">Detail driver tidak dapat dimuat.</div> : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="border-0 shadow-sm rounded-xl xl:col-span-2">
              <CardHeader className="border-b px-6 py-4"><CardTitle className="text-base">Informasi Driver</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                <DetailItem label="Nama Driver" value={driver.name} />
                <DetailItem label="Kode" value={driver.code} />
                <DetailItem label="Company" value={driver.company?.name} /><DetailItem label="Nama PIC" value={driver.picName} />
                <DetailItem label="Nomor Telepon" value={driver.phone} /><DetailItem label="NPWP" value={driver.npwp} />
                <DetailItem label="Nomor KTP" value={driver.identityNumber} /><DetailItem label="Nomor SIM" value={driver.driveLicenseNumber} />
                <DetailItem label="Tanggal Bergabung" value={driver.joinedAt ? new Date(driver.joinedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : null} /><DetailItem label="Dibuat Pada" value={date(driver.createdAt)} />
                <div className="md:col-span-2"><DetailItem label="Alamat" value={driver.address} /></div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-xl">
              <CardHeader className="border-b px-6 py-4"><CardTitle className="text-base">Akun Driver</CardTitle></CardHeader>
              <CardContent className="space-y-6 p-6">
                <DetailItem label="Username" value={driver.username} />
                <div><p className="mb-2 text-sm text-slate-500">Password</p><div className="flex gap-2"><div className="flex h-10 flex-1 items-center rounded-md border bg-slate-50 px-3 text-sm">{showPassword ? password : '••••••••'}</div><Button variant="outline" size="icon" onClick={revealPassword} disabled={isFetchingPassword}><span className="sr-only">Tampilkan password</span>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>{showPassword && <Button variant="outline" size="icon" onClick={copyPassword}><span className="sr-only">Salin password</span><Copy className="h-4 w-4" /></Button>}</div></div>
                <div className="flex items-center justify-between rounded-md border p-4"><div><p className="font-medium">Status Akun</p><Badge variant={isActive ? 'default' : 'secondary'} className="mt-1">{isActive ? 'Aktif' : 'Nonaktif'}</Badge></div><Switch checked={isActive} onCheckedChange={toggleStatus} disabled={!canEdit || isStatusPending} /></div>
                <DetailItem label="Login Terakhir" value={date(driver.lastLogin)} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-xl xl:col-span-3">
              <CardHeader className="border-b px-6 py-4"><CardTitle className="text-base">Tautan & Informasi Tambahan</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                <DetailItem label="Link Maps" value={driver.mapLink} /><DetailItem label="Website" value={driver.websiteLink} /><DetailItem label="Foto" value={driver.image} />
                <DetailItem label="Media Sosial 1" value={driver.socialMedia1Link} /><DetailItem label="Media Sosial 2" value={driver.socialMedia2Link} /><DetailItem label="Media Sosial 3" value={driver.socialMedia3Link} /><DetailItem label="Media Sosial 4" value={driver.socialMedia4Link} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
