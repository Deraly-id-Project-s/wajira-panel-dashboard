import React from 'react';
import { ShieldAlert, MoreVertical, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileInput } from '@/components/ui/file-input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoneyInput } from '@/components/ui/money-input';
import { formatCurrency } from '@/lib/utils/currency';
import { useDoDetailResourceMutation } from '@/hooks/useDoEkspedisi';
import type { DoEkspedisi, DoEkspedisiClaim, DoEkspedisiClaimDocumentation } from '@/types/do-ekspedisi.types';

interface DOEkspedisiClaimsProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

const field = (label: string, value: string, placeholder: string, onChange: (value: string) => void, type = 'text', required = true) => (
  <div className="space-y-1">
    <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
    <Input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2" />
  </div>
);

function RelatedSection({ title, icon, onAdd, children, addDisabled = false, addLabel = 'Tambah', helper }: { title: string; icon: React.ReactNode; onAdd: () => void; children: React.ReactNode; addDisabled?: boolean; addLabel?: string; helper?: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2 text-orange-700">{icon}</div>
            <h2 className="font-semibold text-slate-950">{title}</h2>
          </div>
          {helper && <p className="ml-12 mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        <Button size="sm" onClick={onAdd} disabled={addDisabled}>
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      {children}
    </section>
  );
}

export function DOEkspedisiClaims({ data, onRefresh }: DOEkspedisiClaimsProps) {
  const [isClaimOpen, setIsClaimOpen] = React.useState(false);
  const [editingClaim, setEditingClaim] = React.useState<DoEkspedisiClaim | null>(null);
  const [claimForm, setClaimForm] = React.useState({
    subject: '',
    description: '',
    claim_nominal: '' as string | number,
  });

  const [docClaim, setDocClaim] = React.useState<DoEkspedisiClaim | null>(null);
  const [isDocOpen, setIsDocOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<DoEkspedisiClaimDocumentation | null>(null);
  const [docForm, setDocForm] = React.useState({
    caption: '',
    image: null as File | null,
  });

  const claimMutations = useDoDetailResourceMutation('claim', data.id);
  const docMutations = useDoDetailResourceMutation('documentation', data.id);

  const canManageClaims = data.status === 'done' && Boolean(data.driverId);
  const busy = claimMutations.create.isPending || claimMutations.update.isPending || docMutations.create.isPending || docMutations.update.isPending;

  const openCreateClaim = () => {
    setEditingClaim(null);
    setClaimForm({
      subject: '',
      description: '',
      claim_nominal: '',
    });
    setIsClaimOpen(true);
  };

  const openEditClaim = (item: DoEkspedisiClaim) => {
    setEditingClaim(item);
    setClaimForm({
      subject: item.subject ?? '',
      description: item.description ?? '',
      claim_nominal: String(item.claimNominal ?? ''),
    });
    setIsClaimOpen(true);
  };

  const saveClaim = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = {
        ...claimForm,
        do_expeditions_id: data.id,
        driver_id: Number(data.driverId),
        claim_nominal: Number(claimForm.claim_nominal),
      };

      if (editingClaim) {
        await claimMutations.update.mutateAsync({ id: editingClaim.id, payload });
      } else {
        await claimMutations.create.mutateAsync(payload);
      }
      toast.success('Claim berhasil disimpan');
      setIsClaimOpen(false);
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan claim');
    }
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

  const openCreateDoc = () => {
    setEditingDoc(null);
    setDocForm({ caption: '', image: null });
    setIsDocOpen(true);
  };

  const openEditDoc = (item: DoEkspedisiClaimDocumentation) => {
    setEditingDoc(item);
    setDocForm({ caption: item.caption ?? '', image: null });
    setIsDocOpen(true);
  };

  const saveDoc = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!docClaim) return;
    try {
      const fd = new FormData();
      Object.entries(docForm).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          fd.append(key, value instanceof File ? value : String(value));
        }
      });
      fd.append('do_expedition_claim_id', String(docClaim.id));

      if (editingDoc) {
        await docMutations.update.mutateAsync({ id: editingDoc.id, payload: fd });
      } else {
        await docMutations.create.mutateAsync(fd);
      }
      toast.success('Dokumentasi berhasil disimpan');
      setIsDocOpen(false);

      // Update local docClaim object reference by finding it in data.expeditionClaims
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan dokumentasi');
    }
  };

  // Sync state if data updates
  React.useEffect(() => {
    if (docClaim) {
      const updated = data.expeditionClaims?.find((c) => c.id === docClaim.id);
      if (updated) {
        setDocClaim(updated);
      }
    }
  }, [data.expeditionClaims, docClaim]);

  const handleDeleteDoc = async (item: DoEkspedisiClaimDocumentation) => {
    if (!window.confirm('Hapus dokumentasi ini?')) return;
    try {
      await docMutations.remove.mutateAsync(item.id);
      toast.success('Dokumentasi berhasil dihapus');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus dokumentasi');
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
        <Button variant="link" className="p-0 font-semibold text-orange-600 hover:text-orange-700" onClick={() => setDocClaim(x)}>
          {x.documentations?.length ?? 0} file
        </Button>
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

  const docColumns: ColumnDef<DoEkspedisiClaimDocumentation>[] = [
    { header: 'No', cell: (_, i) => i + 1 },
    { header: 'Caption', cell: (x) => x.caption },
    { header: 'File', cell: (x) => x.image || '-' },
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
            <DropdownMenuItem onClick={() => openEditDoc(x)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => void handleDeleteDoc(x)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <RelatedSection
        title="Driver Claim"
        icon={<ShieldAlert />}
        onAdd={openCreateClaim}
        addDisabled={!canManageClaims}
        helper={!canManageClaims ? 'Claim baru hanya dapat dibuat setelah ekspedisi selesai.' : undefined}
      >
        {data?.status !== 'done' && (
          <div role="status" className="mb-2 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div><p className="font-semibold">Claim driver belum dapat dikelola</p><p className="mt-1 text-sm text-blue-800">Selesaikan DO Ekspedisi terlebih dahulu. Setelah selesai, claim dari ekspedisi ini dapat dibuat dan claim outstanding driver dapat dipotong dari UJ.</p></div>
          </div>
        )}
        <BaseTable
          data={data.expeditionClaims ?? []}
          columns={claimColumns}
          containerClassName="rounded-lg border"
          headerRowClassName="bg-orange-50"
        />
      </RelatedSection>

      {/* Claim Create/Edit Dialog */}
      <FormDialog
        open={isClaimOpen}
        onOpenChange={(open) => !open && setIsClaimOpen(false)}
        title={editingClaim ? 'Edit Driver Claim' : 'Driver Claim'}
        description="Lengkapi data transaksi perjalanan"
        onSubmit={saveClaim}
        isSubmitting={busy}
        maxWidthClassName="max-w-lg"
      >
        <div className="space-y-1">
          <Label>Driver</Label>
          <Input value={data.driver?.name || `Driver #${data.driverId ?? '-'}`} disabled />
        </div>
        {field('Subject', claimForm.subject, 'Subjek klaim', (v) => setClaimForm((old) => ({ ...old, subject: v })))}
        <div className="space-y-3">
          <Label>Deskripsi *</Label>
          <Textarea required value={claimForm.description} onChange={(e) => setClaimForm((old) => ({ ...old, description: e.target.value }))} placeholder="Deskripsi perihal klaim supir" />
        </div>
        <div className="space-y-3">
          <Label>Nominal Claim *</Label>
          <MoneyInput
            value={claimForm.claim_nominal === '' ? null : Number(claimForm.claim_nominal)}
            onChangeValue={(val) => setClaimForm((old) => ({ ...old, claim_nominal: val }))}
            placeholder="Nominal klaim supir"
            className="mt-2"
            required
          />
        </div>
      </FormDialog>

      {/* Documentation List Dialog */}
      <FormDialog
        open={Boolean(docClaim)}
        onOpenChange={(open) => !open && setDocClaim(null)}
        title="Dokumentasi Claim"
        description="Lampiran kerusakan atau kehilangan barang"
        onSubmit={(e) => { e.preventDefault(); }}
        submitLabel="Tutup"
        cancelLabel="Tutup"
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" onClick={openCreateDoc}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Dokumentasi
            </Button>
          </div>
          <BaseTable
            data={docClaim?.documentations ?? []}
            columns={docColumns}
            containerClassName="rounded-lg border"
            headerRowClassName="bg-orange-50"
          />
        </div>
      </FormDialog>

      {/* Documentation Create/Edit Dialog */}
      <FormDialog
        open={isDocOpen}
        onOpenChange={(open) => !open && setIsDocOpen(false)}
        title="Dokumentasi Claim"
        description="Lengkapi data transaksi perjalanan"
        onSubmit={saveDoc}
        isSubmitting={busy}
        maxWidthClassName="max-w-lg"
      >
        <div className="space-y-1">
          <Label>Gambar {!editingDoc && <span className="text-red-500">*</span>}</Label>
          <FileInput required={!editingDoc} accept="image/*" value={docForm.image} onFileChange={(file) => setDocForm((old) => ({ ...old, image: file }))} />
        </div>
        {field('Caption', docForm.caption, 'Keterangan dokumentasi gambar', (v) => setDocForm((old) => ({ ...old, caption: v })))}
      </FormDialog>
    </>
  );
}
