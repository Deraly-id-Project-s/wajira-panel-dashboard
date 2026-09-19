import React from 'react';
import { FileText, MoreVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { InputDateTime } from '@/components/ui/input-date-time';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileInput } from '@/components/ui/file-input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils/format';
import { useDoDetailResourceMutation } from '@/hooks/useDoEkspedisi';
import type { DoEkspedisi, DoEkspedisiDriverNote } from '@/@types/do-ekspedisi.types';
import { ImagePreview } from '@/components/ui/image-preview';
import { TextTruncate } from '@/components/ui/text-truncate';

interface DOEkspedisiDriverNotesProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

const field = (label: string, value: string, placeholder: string | null, onChange: (value: string) => void, type = 'text', required = true) => (
  <div className="space-y-1">
    <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
    {type === 'datetime-local' ? (
      <InputDateTime value={value} onChange={(e) => onChange(e.target.value)} className="mt-2" />
    ) : type === 'date' ? (
      <InputDate value={value} onChange={(e) => onChange(e.target.value)} className="mt-2" />
    ) : (
      <Input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? ''} className="mt-2" />
    )}
  </div>
);

function RelatedSection({ title, description, icon, onAdd, children, addDisabled = false, addLabel = 'Tambah Catatan', helper }: { title: string; description: string | null, icon: React.ReactNode; onAdd: () => void; children: React.ReactNode; addDisabled?: boolean; addLabel?: string; helper?: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
        <Button size="sm" onClick={onAdd} disabled={addDisabled} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {addLabel}
        </Button>
      </div>
      {children}
    </section>
  );
}

export function DOEkspedisiDriverNotes({ data, onRefresh }: DOEkspedisiDriverNotesProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<DoEkspedisiDriverNote | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    effective_date: new Date().toISOString().slice(0, 16),
    subject: '',
    description: '',
    image: null as File | null,
  });

  const { create, update, remove } = useDoDetailResourceMutation('note', data.id);
  const busy = create.isPending || update.isPending;

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      effective_date: new Date().toISOString().slice(0, 16),
      subject: '',
      description: '',
      image: null,
    });
    setIsOpen(true);
  };

  const openEdit = (item: DoEkspedisiDriverNote) => {
    setEditingItem(item);
    setForm({
      effective_date: item.effectiveDate?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
      subject: item.subject ?? '',
      description: item.description ?? '',
      image: null,
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEditingItem(null);
  };

  const set = (key: string, value: any) => setForm((old) => ({ ...old, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          fd.append(key, value instanceof File ? value : String(value));
        }
      });
      fd.append('do_expeditions_id', String(data.id));

      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload: fd });
      } else {
        await create.mutateAsync(fd);
      }
      toast.success('Data berhasil disimpan');
      close();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (item: DoEkspedisiDriverNote) => {
    if (!window.confirm('Hapus data ini?')) return;
    try {
      await remove.mutateAsync(item.id);
      toast.success('Data berhasil dihapus');
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus data');
    }
  };

  const bucketUrl = process.env.OBJECT_BUCKET_URL || 'http://localhost:9000';
  const bucketName = process.env.OBJECT_BUKCET || 'wajirafs';

  const getImageUrl = React.useCallback((path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${bucketUrl}/${bucketName}/${cleanPath}`;
  }, [bucketUrl, bucketName]);

  const columns: ColumnDef<DoEkspedisiDriverNote>[] = [
    { header: 'Tanggal Efektif', cell: (item) => item.effectiveDate ? formatDate(item.effectiveDate) : '-' },
    { header: 'Subjek', cell: (item) => item.subject || '-' },
    { header: 'Deskripsi', cell: (item) => <TextTruncate text={item.description || '-'} maxLength={25} /> },
    {
      header: 'Gambar',
      cell: (item) => item.image ? (
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
          onClick={() => setPreviewUrl(getImageUrl(item.image))}
        >
          Lihat Gambar
        </Button>
      ) : (
        <span className="text-slate-400">-</span>
      )
    },
    {
      header: 'Aksi',
      alignment: 'center',
      sticky: 'right',
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(item)} disabled={data?.status !== 'draft'}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => void handleDelete(item)} disabled={data?.status !== 'draft'}>
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
        title="Catatan Driver"
        description="Catatan tambahan untuk Driver"
        icon={<FileText />}
        onAdd={openCreate}
        addDisabled={data?.status !== 'draft'}
      >
        <BaseTable
          data={data.driverNotes ?? []}
          columns={columns}
          containerClassName="rounded-md border"
          headerRowClassName="bg-orange-50"
        />
      </RelatedSection>

      <FormDialog
        open={isOpen}
        onOpenChange={(open) => !open && close()}
        title="Catatan Driver"
        description="Tambah data catatan untuk Driver"
        onSubmit={save}
        isSubmitting={busy}
        maxWidthClassName="max-w-lg"
      >
        {field('Tanggal Efektif', form.effective_date, 'Pilih tanggal efektif', (v) => set('effective_date', v), 'datetime-local')}
        {field('Subjek Pesan', form.subject, 'Subjek pesan', (v) => set('subject', v))}
        <div className="space-y-3">
          <Label>Gambar</Label>
          <FileInput accept="image/*" value={form.image} onFileChange={(file) => set('image', file)} />
        </div>
        <div className="space-y-3">
          <Label>Deskripsi</Label>
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Deskripsi Isi Pesan" />
        </div>
      </FormDialog>

      <ImagePreview open={previewUrl !== null} onClose={() => setPreviewUrl(null)} src={previewUrl} />
    </>
  );
}
