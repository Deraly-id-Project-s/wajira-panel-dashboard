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
import type { DoEkspedisi, DoEkspedisiClaim, DoEkspedisiClaimDocumentation } from '@/@types/do-ekspedisi.types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CLAIM_DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;
const CLAIM_DOCUMENT_ACCEPT = '.pdf,.img,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg';
const CLAIM_DOCUMENT_ALLOWED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const CLAIM_DOCUMENT_ALLOWED_EXTENSIONS = new Set(['pdf', 'img', 'png', 'jpg', 'jpeg']);

interface ClaimDocumentationForm {
  key: number;
  caption: string;
  file: File | null;
}

interface DOEkspedisiClaimsProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

const field = (label: string, value: string, placeholder: string, onChange: (value: string) => void, type = 'text', required = true) => (
  <div className="space-y-2">
    <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
    <Input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

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
            <div className="rounded-lg bg-orange-100 p-2 text-orange-700">{icon}</div>
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
  const [isClaimOpen, setIsClaimOpen] = React.useState(false);
  const [editingClaim, setEditingClaim] = React.useState<DoEkspedisiClaim | null>(null);
  const documentationKeyRef = React.useRef(0);
  const [claimForm, setClaimForm] = React.useState({
    subject: '',
    description: '',
    claim_nominal: '' as string | number,
  });
  const [claimDocumentationForms, setClaimDocumentationForms] = React.useState<ClaimDocumentationForm[]>([]);

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

  const createEmptyDocumentationForm = React.useCallback((): ClaimDocumentationForm => {
    documentationKeyRef.current += 1;
    return {
      key: documentationKeyRef.current,
      caption: '',
      file: null,
    };
  }, []);

  const openCreateClaim = () => {
    setEditingClaim(null);
    setClaimForm({
      subject: '',
      description: '',
      claim_nominal: '',
    });
    setClaimDocumentationForms([createEmptyDocumentationForm()]);
    setIsClaimOpen(true);
  };

  const openEditClaim = (item: DoEkspedisiClaim) => {
    setEditingClaim(item);
    setClaimForm({
      subject: item.subject ?? '',
      description: item.description ?? '',
      claim_nominal: String(item.claimNominal ?? ''),
    });
    setClaimDocumentationForms([]);
    setIsClaimOpen(true);
  };

  const isAllowedClaimDocument = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return CLAIM_DOCUMENT_ALLOWED_TYPES.has(file.type) || CLAIM_DOCUMENT_ALLOWED_EXTENSIONS.has(extension);
  };

  const validateClaimDocument = (file: File) => {
    if (file.size > CLAIM_DOCUMENT_MAX_SIZE) {
      toast.error('Ukuran file maksimal 10MB');
      return false;
    }

    if (!isAllowedClaimDocument(file)) {
      toast.error('Format file harus PDF, IMG, PNG, JPG, atau JPEG');
      return false;
    }

    return true;
  };

  const addClaimDocumentationForm = () => {
    setClaimDocumentationForms((old) => [...old, createEmptyDocumentationForm()]);
  };

  const removeClaimDocumentationForm = (key: number) => {
    setClaimDocumentationForms((old) => old.filter((item) => item.key !== key));
  };

  const updateClaimDocumentationForm = (key: number, patch: Partial<Omit<ClaimDocumentationForm, 'key'>>) => {
    setClaimDocumentationForms((old) => old.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const handleClaimDocumentationFileChange = (key: number, file: File | null) => {
    if (!file) {
      updateClaimDocumentationForm(key, { file: null });
      return;
    }

    if (!validateClaimDocument(file)) {
      updateClaimDocumentationForm(key, { file: null });
      return;
    }

    updateClaimDocumentationForm(key, { file });
  };

  const saveClaim = async (event: React.FormEvent) => {
    event.preventDefault();
    const filledDocumentationForms = claimDocumentationForms.filter((item) => item.caption.trim() || item.file);
    const incompleteDocumentationForm = filledDocumentationForms.find((item) => !item.caption.trim() || !item.file);

    if (incompleteDocumentationForm) {
      toast.error('Subjek dokumentasi dan file wajib diisi untuk setiap dokumentasi');
      return;
    }

    if (filledDocumentationForms.some((item) => item.file && !validateClaimDocument(item.file))) return;

    try {
      const payload = new FormData();
      payload.append('subject', claimForm.subject);
      payload.append('description', claimForm.description);
      payload.append('claim_nominal', String(Number(claimForm.claim_nominal)));
      payload.append('do_expeditions_id', String(data.id));
      payload.append('driver_id', String(Number(data.driverId)));

      let savedClaim: any;
      if (editingClaim) {
        savedClaim = await claimMutations.update.mutateAsync({ id: editingClaim.id, payload });
      } else {
        savedClaim = await claimMutations.create.mutateAsync(payload);
      }

      const claimId = savedClaim?.id ?? savedClaim?.data?.id ?? editingClaim?.id;
      if (!claimId && filledDocumentationForms.length > 0) {
        throw new Error('ID claim tidak ditemukan untuk menyimpan dokumentasi');
      }

      for (const documentation of filledDocumentationForms) {
        const fd = new FormData();
        fd.append('do_expedition_claim_id', String(claimId));
        fd.append('caption', documentation.caption.trim());
        fd.append('file', documentation.file as File);
        await docMutations.create.mutateAsync(fd);
      }

      toast.success('Claim berhasil disimpan');
      setIsClaimOpen(false);
      setClaimDocumentationForms([]);
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

  const handleDocFileChange = (file: File | null) => {
    if (!file) {
      setDocForm((old) => ({ ...old, image: null }));
      return;
    }

    if (!validateClaimDocument(file)) {
      setDocForm((old) => ({ ...old, image: null }));
      return;
    }

    setDocForm((old) => ({ ...old, image: file }));
  };

  const saveDoc = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!docClaim) return;
    if (docForm.image && !validateClaimDocument(docForm.image)) return;
    try {
      const fd = new FormData();
      fd.append('do_expedition_claim_id', String(docClaim.id));
      fd.append('caption', docForm.caption);
      if (docForm.image) fd.append('file', docForm.image);

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
          containerClassName="rounded-lg border"
          headerRowClassName="bg-orange-50"
        />
      </RelatedSection>

      {/* Claim Create/Edit Dialog */}
      <FormDialog
        open={isClaimOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsClaimOpen(false);
            setClaimDocumentationForms([]);
          }
        }}
        title={editingClaim ? 'Edit Driver Claim' : 'Driver Claim'}
        description="Lengkapi data transaksi perjalanan"
        onSubmit={saveClaim}
        isSubmitting={busy}
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-2">
          <Label>Driver</Label>
          <Input value={data.driver?.name || `Driver #${data.driverId ?? '-'}`} disabled />
        </div>
        {field('Subject', claimForm.subject, 'Subjek klaim', (v) => setClaimForm((old) => ({ ...old, subject: v })))}
        <div className="space-y-2">
          <Label>Deskripsi *</Label>
          <Textarea required value={claimForm.description} onChange={(e) => setClaimForm((old) => ({ ...old, description: e.target.value }))} placeholder="Deskripsi perihal klaim supir" />
        </div>
        <div className="space-y-2">
          <Label>Nominal Claim *</Label>
          <MoneyInput
            value={claimForm.claim_nominal === '' ? null : Number(claimForm.claim_nominal)}
            onChangeValue={(val) => setClaimForm((old) => ({ ...old, claim_nominal: val }))}
            placeholder="Nominal klaim supir"
            required
          />
        </div>

        <div className="space-y-3 rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>Dokumentasi Claim</Label>
              <p className="mt-1 text-xs text-slate-500">Tambahkan subjek dokumentasi dan file pendukung claim.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addClaimDocumentationForm}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah
            </Button>
          </div>

          {editingClaim && (editingClaim.documentations?.length ?? 0) > 0 && (
            <div className="rounded-md bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Dokumentasi tersimpan</p>
              <div className="space-y-1.5">
                {editingClaim.documentations.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-white px-3 py-2 text-sm">
                    <span className="font-medium text-slate-700">{item.caption || '-'}</span>
                    <span className="max-w-[220px] truncate text-xs text-slate-500">{item.image || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {claimDocumentationForms.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
              Belum ada dokumentasi baru.
            </div>
          ) : (
            <div className="space-y-3">
              {claimDocumentationForms.map((documentation, index) => (
                <div key={documentation.key} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
                  <div className="space-y-2">
                    <Label>Subjek Dokumentasi</Label>
                    <Input
                      value={documentation.caption}
                      onChange={(event) => updateClaimDocumentationForm(documentation.key, { caption: event.target.value })}
                      placeholder={`Subjek dokumentasi ${index + 1}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>File Dokumentasi</Label>
                    <FileInput
                      name={`claim_documentation_${documentation.key}`}
                      accept={CLAIM_DOCUMENT_ACCEPT}
                      value={documentation.file}
                      onFileChange={(file) => handleClaimDocumentationFileChange(documentation.key, file)}
                      helperText="Format PDF, IMG, PNG, JPG, atau JPEG maksimal 10MB"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 md:mt-8"
                    onClick={() => removeClaimDocumentationForm(documentation.key)}
                    aria-label={`Hapus dokumentasi ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
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
        <div className="space-y-2">
          <Label>Gambar {!editingDoc && <span className="text-red-500">*</span>}</Label>
          <FileInput
            name="file"
            required={!editingDoc}
            accept={CLAIM_DOCUMENT_ACCEPT}
            value={docForm.image}
            onFileChange={handleDocFileChange}
            helperText="Format PDF, IMG, PNG, JPG, atau JPEG maksimal 10MB"
          />
        </div>
        {field('Caption', docForm.caption, 'Keterangan dokumentasi gambar', (v) => setDocForm((old) => ({ ...old, caption: v })))}
      </FormDialog>
    </>
  );
}
