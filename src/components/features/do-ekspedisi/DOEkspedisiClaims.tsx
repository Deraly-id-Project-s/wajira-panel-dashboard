import React from 'react';
import {
  AlertTriangle,
  Eye,
  FileImage,
  FileText,
  MoreVertical,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import type {
  DoEkspedisi,
  DoEkspedisiClaim,
  DoEkspedisiClaimDocumentation,
} from '@/@types/do-ekspedisi.types';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileInput } from '@/components/ui/file-input';
import { ImagePreview } from '@/components/ui/image-preview';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { getObjectStorageUrl, StorageImage } from '@/components/ui/storage-image';
import { TextTruncate } from '@/components/ui/text-truncate';
import { useCreateExpeditionClaimDocumentation, useDoDetailResourceMutation } from '@/hooks/useDoEkspedisi';
import { formatCurrency } from '@/lib/utils/currency';
import { getApiErrorMessage } from '@/utils/apiErrorHandler';
import { CLAIM_DOCUMENT_ACCEPT, validateClaimDocument } from './DOEkspedisiClaimForm';

interface DOEkspedisiClaimsProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

function RelatedSection({
  title,
  description,
  icon,
  onAdd,
  addLabel = 'Tambah Claim',
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
          <Button onClick={onAdd} disabled={addDisabled}>
            <Plus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}

function ClaimMetric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'danger' | 'success' }) {
  const valueClassName = tone === 'danger'
    ? 'text-rose-700'
    : tone === 'success'
      ? 'text-emerald-700'
      : 'text-slate-950';

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-semibold tabular-nums ${valueClassName}`}>{value}</p>
    </div>
  );
}

export function DOEkspedisiClaims({ data, onRefresh }: DOEkspedisiClaimsProps) {
  const router = useRouter();
  const { slug } = router.query;
  const claimMutations = useDoDetailResourceMutation('claim', data.id);
  const documentationMutations = useDoDetailResourceMutation('documentation', data.id);
  const createDocumentation = useCreateExpeditionClaimDocumentation(data.id);
  const canManageClaims = data.status === 'done' && Boolean(data.driverId);

  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [selectedClaimId, setSelectedClaimId] = React.useState<number | null>(null);
  const [documentationFormOpen, setDocumentationFormOpen] = React.useState(false);
  const [documentationFile, setDocumentationFile] = React.useState<File | null>(null);
  const [documentationCaption, setDocumentationCaption] = React.useState('');
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [deleteClaimTarget, setDeleteClaimTarget] = React.useState<DoEkspedisiClaim | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = React.useState<DoEkspedisiClaimDocumentation | null>(null);

  const selectedClaim = React.useMemo(
    () => (data.expeditionClaims ?? []).find((claim) => claim.id === selectedClaimId) ?? null,
    [data.expeditionClaims, selectedClaimId],
  );

  const resetDocumentationForm = React.useCallback(() => {
    setDocumentationFormOpen(false);
    setDocumentationFile(null);
    setDocumentationCaption('');
  }, []);

  const openClaimDetail = (item: DoEkspedisiClaim) => {
    setSelectedClaimId(item.id);
    setDetailDialogOpen(true);
  };

  const handleDetailDialogChange = (open: boolean) => {
    setDetailDialogOpen(open);
    if (!open) {
      setSelectedClaimId(null);
      setPreviewUrl(null);
      resetDocumentationForm();
    }
  };

  const openCreateClaim = () => {
    if (!slug) return;
    void router.push(`/dashboard/${slug}/do-ekspedisi/detail/${data.id}/claim/create`);
  };

  const confirmDeleteClaim = async () => {
    if (!deleteClaimTarget) return;
    try {
      await claimMutations.remove.mutateAsync(deleteClaimTarget.id);
      toast.success('Claim berhasil dihapus');
      if (selectedClaimId === deleteClaimTarget.id) {
        setSelectedClaimId(null);
        setDetailDialogOpen(false);
      }
      setDeleteClaimTarget(null);
      onRefresh?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDocumentationFileChange = (file: File | null) => {
    if (file && !validateClaimDocument(file)) {
      setDocumentationFile(null);
      return;
    }
    setDocumentationFile(file);
    setDocumentationFormOpen(Boolean(file));
  };

  const handleAddDocumentation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClaim || !documentationFile) {
      toast.error('Foto dokumentasi wajib dipilih.');
      return;
    }
    if (!validateClaimDocument(documentationFile)) return;

    try {
      await createDocumentation.mutateAsync({
        do_expedition_claim_id: selectedClaim.id,
        caption: documentationCaption.trim() || null,
        image: documentationFile,
      });
      toast.success('Dokumentasi claim berhasil ditambahkan.');
      resetDocumentationForm();
      onRefresh?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const confirmDeleteDocumentation = async () => {
    if (!deleteDocTarget) return;
    try {
      await documentationMutations.remove.mutateAsync(deleteDocTarget.id);
      toast.success('Dokumentasi claim berhasil dihapus.');
      setDeleteDocTarget(null);
      onRefresh?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const claimColumns: ColumnDef<DoEkspedisiClaim>[] = [
    { header: 'Subjek Klaim', cell: (item) => <span className="font-medium text-slate-900">{item.subject || '-'}</span> },
    { header: 'Deskripsi', cell: (item) => <TextTruncate text={item.description || '-'} maxLength={25} /> },
    { header: 'Nominal Claim', alignment: 'right', cell: (item) => formatCurrency(item.claimNominal) },
    { header: 'Terpakai', alignment: 'right', cell: (item) => formatCurrency(item.appliedNominal) },
    { header: 'Nominal Sisa', alignment: 'right', cell: (item) => formatCurrency(item.remainingNominal) },
    {
      header: 'Dokumentasi',
      alignment: 'center',
      cell: (item) => {
        const documentationCount = item.documentations?.length ?? 0;
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-slate-700 hover:bg-slate-50"
            onClick={() => openClaimDetail(item)}
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>{documentationCount} Dokumentasi</span>
          </Button>
        );
      },
    },
    {
      header: 'Aksi',
      sticky: 'right',
      alignment: 'center',
      cell: (item) => (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900" aria-label={`Aksi claim ${item.subject}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px] rounded-md border-slate-200 p-1.5 shadow-lg">
              <DropdownMenuItem onClick={() => openClaimDetail(item)} className="rounded-md px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                Detail
              </DropdownMenuItem>
              {Number(item.appliedNominal) === 0 && (
                <DropdownMenuItem className="rounded-md px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer" onClick={() => setDeleteClaimTarget(item)}>
                  Hapus
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const usagePercentage = selectedClaim?.claimNominal
    ? Math.min(100, Math.max(0, (selectedClaim.appliedNominal / selectedClaim.claimNominal) * 100))
    : 0;

  return (
    <>
      <RelatedSection
        title="Driver Claim"
        icon={<ShieldAlert />}
        onAdd={openCreateClaim}
        addDisabled={!canManageClaims}
        description="Daftar klaim driver dan bukti dokumentasi pada ekspedisi ini."
        helper={!canManageClaims ? 'Claim baru hanya dapat dibuat setelah ekspedisi selesai.' : undefined}
      >
        {data.status !== 'done' && (
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

      <Dialog open={detailDialogOpen} onOpenChange={handleDetailDialogChange}>
        <DialogContent className="grid max-h-[90vh] max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-5 py-5 pr-12 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle>Detail Driver Claim</DialogTitle>
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                {selectedClaim?.documentations?.length ?? 0} dokumentasi
              </Badge>
            </div>
            <DialogDescription>
              Informasi claim dan bukti dokumentasi untuk {data.driver?.name || 'driver'}.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-5 py-5 sm:px-6">
            {selectedClaim ? (
              <div className="space-y-6">
                <section className="space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Subjek Claim</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950">{selectedClaim.subject || '-'}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{selectedClaim.description || '-'}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <ClaimMetric label="Nominal Claim" value={formatCurrency(selectedClaim.claimNominal)} />
                    <ClaimMetric label="Sudah Terpakai" value={formatCurrency(selectedClaim.appliedNominal)} tone="danger" />
                    <ClaimMetric label="Nominal Sisa" value={formatCurrency(selectedClaim.remainingNominal)} tone="success" />
                  </div>

                  <div className="rounded-md border border-slate-200 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-slate-600">Penggunaan nominal claim</span>
                      <span className="font-semibold text-slate-900">{Math.round(usagePercentage)}%</span>
                    </div>
                    <Progress value={usagePercentage} />
                  </div>
                </section>

                <section className="space-y-4 border-t border-slate-200 pt-5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-950">Dokumentasi Claim</h3>
                      <p className="text-xs text-slate-500">Klik foto untuk melihat ukuran penuh atau gunakan kartu plus untuk menambah bukti baru.</p>
                    </div>
                    <span className="text-xs text-slate-500">PNG/JPG, maksimal 10MB</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FileInput
                      name="claim_documentation_picker"
                      accept={CLAIM_DOCUMENT_ACCEPT}
                      value={documentationFile}
                      onFileChange={handleDocumentationFileChange}
                      helperText="Format PNG, JPG, atau JPEG maksimal 10MB"
                      disabled={!canManageClaims || createDocumentation.isPending}
                      className="h-full"
                      triggerClassName="group min-h-52 h-full border-2 border-orange-200 bg-orange-50/50 p-5 hover:border-orange-400 hover:bg-orange-50 focus-visible:ring-orange-500"
                      triggerContent={(
                        <>
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-700 transition group-hover:scale-105 group-hover:bg-orange-200">
                            <Plus className="h-9 w-9" />
                          </span>
                          <span className="mt-4 font-semibold text-slate-900">Tambah Dokumentasi</span>
                          <span className="mt-1 text-xs text-slate-500">Klik untuk memilih foto</span>
                        </>
                      )}
                    />

                    {(selectedClaim.documentations ?? []).map((documentation, index) => {
                      const imageUrl = getObjectStorageUrl(documentation.image);
                      const caption = documentation.caption || `Dokumentasi ${index + 1}`;

                      return (
                        <article key={documentation.id} className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                          <button
                            type="button"
                            className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset disabled:cursor-default"
                            onClick={() => imageUrl && setPreviewUrl(imageUrl)}
                            disabled={!imageUrl}
                            aria-label={imageUrl ? `Lihat ${caption}` : `${caption} tidak memiliki gambar`}
                          >
                            {imageUrl ? (
                              <>
                                <StorageImage src={documentation.image} alt={caption} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                <span className="absolute inset-0 flex items-center justify-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/30 group-hover:opacity-100">
                                  <Eye className="h-6 w-6" />
                                </span>
                              </>
                            ) : (
                              <FileImage className="h-10 w-10 text-slate-400" />
                            )}
                          </button>
                          <div className="flex items-start justify-between gap-3 p-3">
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-medium text-slate-800">{caption}</p>
                              <p className="mt-1 text-xs text-slate-400">Dokumentasi #{index + 1}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              disabled={!canManageClaims || documentationMutations.remove.isPending}
                              onClick={() => setDeleteDocTarget(documentation)}
                              aria-label={`Hapus ${caption}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {documentationFormOpen && (
                    <form onSubmit={handleAddDocumentation} className="rounded-md border border-orange-200 bg-orange-50/40 p-4 sm:p-5">
                      <div className="mb-4">
                        <h4 className="font-semibold text-slate-950">Dokumentasi Baru</h4>
                        <p className="text-xs text-slate-500">Pilih satu foto, lalu tambahkan caption bila diperlukan.</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                        <div className="space-y-2">
                          <Label>Foto Terpilih</Label>
                          <div className="flex min-h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                            <FileImage className="h-5 w-5 shrink-0 text-orange-600" />
                            <span className="min-w-0 truncate text-sm font-medium text-slate-700">{documentationFile?.name || '-'}</span>
                          </div>
                          <p className="text-xs text-slate-500">Klik kembali kartu plus jika ingin mengganti foto.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="claim-documentation-caption">Caption</Label>
                          <Input
                            id="claim-documentation-caption"
                            value={documentationCaption}
                            onChange={(event) => setDocumentationCaption(event.target.value)}
                            placeholder="Contoh: Kondisi barang saat diterima"
                            disabled={createDocumentation.isPending}
                          />
                          <p className="text-xs text-slate-500">Caption bersifat opsional.</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={resetDocumentationForm} disabled={createDocumentation.isPending}>
                          Batal
                        </Button>
                        <Button type="submit" disabled={!documentationFile || createDocumentation.isPending}>
                          {createDocumentation.isPending ? 'Mengupload...' : 'Simpan Dokumentasi'}
                        </Button>
                      </div>
                    </form>
                  )}
                </section>
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">Data claim tidak ditemukan.</div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">Tutup</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Hapus Claim */}
      <Dialog open={deleteClaimTarget !== null} onOpenChange={(open) => !open && setDeleteClaimTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Claim</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus claim &quot;{deleteClaimTarget?.subject || 'ini'}&quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteClaimTarget(null)} disabled={claimMutations.remove.isPending}>
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteClaim()} disabled={claimMutations.remove.isPending}>
              {claimMutations.remove.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog Hapus Dokumentasi */}
      <Dialog open={deleteDocTarget !== null} onOpenChange={(open) => !open && setDeleteDocTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Dokumentasi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus dokumentasi claim ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteDocTarget(null)} disabled={documentationMutations.remove.isPending}>
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteDocumentation()} disabled={documentationMutations.remove.isPending}>
              {documentationMutations.remove.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImagePreview open={previewUrl !== null} onClose={() => setPreviewUrl(null)} src={previewUrl} />
    </>
  );
}
