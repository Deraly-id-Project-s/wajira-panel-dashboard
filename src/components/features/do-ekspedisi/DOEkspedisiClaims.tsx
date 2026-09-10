import React from 'react';
import { ShieldAlert, MoreVertical, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils/currency';
import { useDoDetailResourceMutation } from '@/hooks/useDoEkspedisi';
import type { DoEkspedisi, DoEkspedisiClaim } from '@/@types/do-ekspedisi.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DOEkspedisiClaimsProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

function RelatedSection({
  title,
  description,
  icon,
  onAdd,
  addLabel = 'Tambah',
  addDisabled = false,
  helper,
  children,
}: {
  title: string;
  description?: string | null;
  icon: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  addDisabled?: boolean;
  helper?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-100 p-2 text-orange-700">{icon}</div>
            <div>
              <h2 className="font-semibold text-slate-950">{title}</h2>
              {description && <p className="text-xs text-slate-500">{description}</p>}
            </div>
          </div>
          {helper && <p className="ml-12 mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        {onAdd && (
          <Button size="sm" onClick={onAdd} disabled={addDisabled}>
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

export function DOEkspedisiClaims({ data, onRefresh }: DOEkspedisiClaimsProps) {
  const router = useRouter();
  const { slug } = router.query;

  const claimMutations = useDoDetailResourceMutation('claim', data.id);

  const canManageClaims = data.status === 'done' && Boolean(data.driverId);

  const openCreateClaim = () => {
    if (!slug) return;
    void router.push(`/dashboard/${slug}/do-ekspedisi/detail/${data.id}/claim/create`);
  };

  const openEditClaim = (item: DoEkspedisiClaim) => {
    if (!slug) return;
    void router.push(`/dashboard/${slug}/do-ekspedisi/detail/${data.id}/claim/${item.id}/edit`);
  };

  const handleDeleteClaim = async (item: DoEkspedisiClaim) => {
    if (!window.confirm('Hapus claim ini?')) return;
    try {
      await claimMutations.remove.mutateAsync(item.id);
      toast.success('Claim berhasil dihapus');
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus claim');
    }
  };

  const claimColumns: ColumnDef<DoEkspedisiClaim>[] = [
    { header: 'No', cell: (_, i) => i + 1 },
    { header: 'Subject', cell: (x) => x.subject },
    { header: 'Deskripsi', cell: (x) => x.description },
    { header: 'Claim', alignment: 'right', cell: (x) => formatCurrency(x.claimNominal) },
    { header: 'Terpakai', alignment: 'right', cell: (x) => formatCurrency(x.appliedNominal) },
    { header: 'Sisa', alignment: 'right', cell: (x) => formatCurrency(x.remainingNominal) },
    {
      header: 'Dokumentasi',
      cell: (x) => (
        <div className="max-w-[220px] space-y-1">
          <div className="font-semibold text-slate-800">{x.documentations?.length ?? 0} file</div>
          {(x.documentations ?? []).slice(0, 2).map((documentation) => (
            <div key={documentation.id} className="truncate text-xs text-slate-500">
              {documentation.caption || documentation.image || '-'}
            </div>
          ))}
          {(x.documentations?.length ?? 0) > 2 && (
            <div className="text-xs text-slate-400">+{(x.documentations?.length ?? 0) - 2} file lain</div>
          )}
        </div>
      ),
    },
    {
      header: '',
      alignment: 'right',
      cell: (x) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditClaim(x)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {Number(x.appliedNominal) === 0 && (
              <DropdownMenuItem className="text-red-600" onClick={() => void handleDeleteClaim(x)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <RelatedSection
      title="Driver Claim"
      description="Data claim driver"
      icon={<ShieldAlert />}
      onAdd={openCreateClaim}
      addDisabled={!canManageClaims}
      helper={!canManageClaims ? 'Claim baru hanya dapat dibuat setelah ekspedisi selesai.' : undefined}
    >
      {data?.status !== 'done' && (
        <Alert variant="warning" className="mb-2">
          <AlertTriangle />
          <AlertTitle>Claim driver belum dapat dikelola</AlertTitle>
          <AlertDescription>
            Selesaikan DO Ekspedisi terlebih dahulu. Setelah selesai, claim dari ekspedisi ini dapat dibuat dan claim outstanding driver dapat dipotong dari UJ.
          </AlertDescription>
        </Alert>
      )}
      <BaseTable
        data={data.expeditionClaims ?? []}
        columns={claimColumns}
        containerClassName="rounded-md border"
        headerRowClassName="bg-orange-50"
      />
    </RelatedSection>
  );
}
