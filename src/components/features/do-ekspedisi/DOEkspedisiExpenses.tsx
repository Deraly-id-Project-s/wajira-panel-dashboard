import React from 'react';
import { Receipt, MoreVertical, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import BaseTable, { type ColumnDef } from '@/components/ui/base-table';
import { FormDialog } from '@/components/ui/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoneyInput } from '@/components/ui/money-input';
import { formatCurrency } from '@/lib/utils/currency';
import { useDoDetailResourceMutation } from '@/hooks/useDoEkspedisi';
import type { DoEkspedisi, DoEkspedisiExpense } from '@/types/do-ekspedisi.types';
import RequiredMark from '@/components/ui/required-mark';

interface DOEkspedisiExpensesProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

const field = (label: string, value: string, placeholder: string, onChange: (value: string) => void, type = 'text', required = true) => (
  <div className="space-y-1">
    <Label>{label}{required && <span className="text-red-500"> *</span>}</Label>
    <Input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2" />
  </div>
);

function RelatedSection({ title, description, icon, onAdd, children, addDisabled = false, addLabel = 'Tambah', helper }: { title: string; description: string | null, icon: React.ReactNode; onAdd: () => void; children: React.ReactNode; addDisabled?: boolean; addLabel?: string; helper?: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2 text-orange-700">{icon}</div>
            <div>
              <h2 className="font-semibold text-slate-950">{title}</h2>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
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

export function DOEkspedisiExpenses({ data, onRefresh }: DOEkspedisiExpensesProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<DoEkspedisiExpense | null>(null);
  const [form, setForm] = React.useState({
    subject: '',
    description: '',
    nominal: '' as string | number,
  });

  const { create, update, remove } = useDoDetailResourceMutation('expense', data.id);
  const busy = create.isPending || update.isPending;

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      subject: '',
      description: '',
      nominal: '',
    });
    setIsOpen(true);
  };

  const openEdit = (item: DoEkspedisiExpense) => {
    setEditingItem(item);
    setForm({
      subject: item.subject ?? '',
      description: item.description ?? '',
      nominal: String(item.nominal ?? ''),
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
      const payload = {
        ...form,
        do_expeditions_id: data.id,
        nominal: Number(form.nominal),
      };

      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success('Data berhasil disimpan');
      close();
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async (item: DoEkspedisiExpense) => {
    if (!window.confirm('Hapus data ini?')) return;
    try {
      await remove.mutateAsync(item.id);
      toast.success('Data berhasil dihapus');
      onRefresh?.();
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus data');
    }
  };

  const columns: ColumnDef<DoEkspedisiExpense>[] = [
    { header: 'No', cell: (_, i) => i + 1 },
    { header: 'Subject', cell: (x) => x.subject },
    { header: 'Deskripsi', cell: (x) => x.description },
    { header: 'Nominal', alignment: 'right', cell: (x) => formatCurrency(x.nominal) },
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
            <DropdownMenuItem onClick={() => openEdit(x)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => void handleDelete(x)}>
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
        title="Tambahan Biaya"
        description="Data biaya tambahan pada DO Ekspedisi"
        icon={<Receipt />}
        onAdd={openCreate}
      >
        <BaseTable
          data={data.expeditionExpenses ?? []}
          columns={columns}
          containerClassName="rounded-lg border"
          headerRowClassName="bg-orange-50"
        />
      </RelatedSection>

      <FormDialog
        open={isOpen}
        onOpenChange={(open) => !open && close()}
        title="Biaya Perjalanan"
        description="Lengkapi data biaya perjalanan tambahan"
        onSubmit={save}
        isSubmitting={busy}
        maxWidthClassName="max-w-lg"
      >
        <div className="space-y-3">
          <Label>Subjek Biaya <RequiredMark /></Label>
          <Input required value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Subjek biaya perjalanan" />
        </div>
        <div className="space-y-3">
          <Label>Deskripsi <RequiredMark /></Label>
          <Textarea required value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Deskripsi biaya perjalanan tambahan" />
        </div>
        <div className="space-y-3">
          <Label>Nominal <RequiredMark /></Label>
          <MoneyInput
            value={form.nominal === '' ? null : Number(form.nominal)}
            onChangeValue={(val) => set('nominal', val)}
            placeholder="Nominal biaya perjalanan"
            required
          />
        </div>
      </FormDialog>
    </>
  );
}
