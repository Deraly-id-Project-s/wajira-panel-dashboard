import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, DollarSignIcon, FileText, Info, ListTodoIcon, Loader2, MoreVertical, Plus, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePurchaseById } from '@/hooks/useUnitTransaction';
import { useTypeUnits } from '@/hooks/useTypeUnit';
import { useCreateUnitItemDetail, useDeleteUnitItemDetail, useImportUnitItemDetails, useUnitItemDetails, useUnitTransactionItemById, useUpdateUnitItemDetail } from '@/hooks/useUnitItemDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { CopyBox } from '@/components/ui/copy-box';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';

const parseApiError = (err: any): string => {
  const details = err?.details ?? err?.response?.data?.errors;
  if (typeof details === 'string') return details;
  if (details && typeof details === 'object') {
    return Object.entries(details)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value[0] : String(value)}`)
      .join(', ');
  }
  return err?.message || 'Terjadi kesalahan pada server';
};

export default function UnitPurchaseDetailPage() {
  const router = useRouter();
  const { hasPermission } = usePermissionGuard();
  const canCreate = hasPermission('transaction:create');
  const canEdit = hasPermission('transaction:edit');
  const canDelete = hasPermission('transaction:delete');

  const { slug, id, unitId } = router.query;

  const purchaseId = String(id ?? '');
  const unitItemId = String(unitId ?? '');

  const columns = useMemo(
    () => [
      {
        header: 'NO',
        alignment: 'left' as const,
        cell: (_: any, index: number) => index + 1,
      },
      {
        header: 'Nomor Mesin',
        accessorKey: 'machine_number',
        sortable: true,
        alignment: 'left' as const,
        cell: (details: any) => (
          <CopyBox text={`${details.machine_number}`} />
        ),
      },
      {
        header: 'Nomor Rangka',
        accessorKey: 'chassis_number',
        sortable: true,
        alignment: 'left' as const,
        cell: (details: any) => <CopyBox text={`${details.chassis_number}`} />,
      },
      {
        header: 'Warna',
        accessorKey: 'color',
        sortable: true,
        alignment: 'left' as const,
        cell: (details: any) => details.color,
      },
      {
        header: 'aksi',
        alignment: 'left' as const,
        sticky: 'right' as const,
        cell: (details: any) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#111827]">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[162px] rounded-[14px] border border-[#E5E7EB] p-2 shadow-[0_12px_35px_rgba(15,23,42,0.14)]">
              <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#111827]" onClick={() => openEditForm(details)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#EF4444]" onClick={() => setDeleteTarget(details)}>
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const { data: purchase, isLoading: purchaseLoading } = usePurchaseById(purchaseId);
  const { data: unitItem, isLoading: unitItemLoading, isError: unitItemError } = useUnitTransactionItemById(unitItemId);
  const { data: detailResponse } = useUnitItemDetails(unitItemId);
  const { data: typeUnits } = useTypeUnits();

  const createMutation = useCreateUnitItemDetail();
  const updateMutation = useUpdateUnitItemDetail();
  const deleteMutation = useDeleteUnitItemDetail();
  const importMutation = useImportUnitItemDetails();

  const [openForm, setOpenForm] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string | number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number } | null>(null);
  const [formValues, setFormValues] = useState({
    color: '',
    machine_number: '',
    chassis_number: '',
  });

  const details = detailResponse?.data ?? [];

  const unitTypeName = useMemo(() => {
    if (!unitItem?.unit_type_id) return '-';
    return typeUnits?.data?.find((item) => String(item.id) === String(unitItem.unit_type_id))?.name ?? unitItem.unit_type_id;
  }, [typeUnits, unitItem]);

  const qty = Number(unitItem?.qty_total ?? 0);
  const price = Number(unitItem?.price ?? 0);

  const bbnPrice = Number(unitItem?.bbn_price ?? 0);
  const otherFee = Number(unitItem?.other_fee ?? 0);
  const expeditionFee = Number(unitItem?.expedition_fee ?? 0);

  const fallbackHppPerUnit = price + (bbnPrice + expeditionFee + otherFee) / (qty || 1);
  const hppPerUnitFromApi = Number(unitItem?.hpp_per_unit_price ?? 0);
  const hppPerUnit = hppPerUnitFromApi > 0 ? hppPerUnitFromApi : fallbackHppPerUnit;
  const totalHppFromApi = Number(unitItem?.hpp_total_price ?? 0);
  const totalHpp = totalHppFromApi > 0 ? totalHppFromApi : hppPerUnit * (qty || 1);
  const dppPerUnitFromApi = Number(unitItem?.dpp_per_unit_price ?? 0);
  const dppPerUnit = dppPerUnitFromApi > 0
    ? dppPerUnitFromApi
    : Number(unitItem?.dpp_total_price ?? hppPerUnit * qty) / (qty || 1);
  const ppnPerUnitFromApi = Number(unitItem?.ppn_per_unit_price ?? 0);
  const ppnPerUnit = ppnPerUnitFromApi > 0
    ? ppnPerUnitFromApi
    : Number(unitItem?.ppn_total_price ?? dppPerUnit * qty * 0.11) / (qty || 1);
  const totalPembelian = price * qty;

  const openCreateForm = () => {
    setEditingItem(null);
    setFormValues({ color: '', machine_number: '', chassis_number: '' });
    setOpenForm(true);
  };

  const openEditForm = (item: any) => {
    setEditingItem(item);
    setFormValues({
      color: item.color ?? '',
      machine_number: item.machine_number ?? '',
      chassis_number: item.chassis_number ?? '',
    });
    setOpenForm(true);
  };

  const validateForm = (): string | null => {
    const color = formValues.color.trim();
    const machineNumber = formValues.machine_number.trim();
    const chassisNumber = formValues.chassis_number.trim();

    if (!color || !machineNumber || !chassisNumber) return 'Semua field wajib diisi';

    const duplicateMachine = details.find((item) => item.machine_number === machineNumber && item.id !== editingItem?.id);
    if (duplicateMachine) return 'Nomor mesin harus unik';

    const duplicateChassis = details.find((item) => item.chassis_number === chassisNumber && item.id !== editingItem?.id);
    if (duplicateChassis) return 'Nomor rangka harus unik';

    return null;
  };

  const handleSubmit = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    const payload = {
      unit_transaction_item_id: unitItemId,
      color: formValues.color.trim(),
      machine_number: formValues.machine_number.trim(),
      chassis_number: formValues.chassis_number.trim(),
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: String(editingItem.id), payload });
        toast.success('Detail unit berhasil diperbarui');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Detail unit berhasil ditambahkan');
      }
      setOpenForm(false);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(parseApiError(err));
    }
  };

  const handleImport = async (file: File) => {
    try {
      await importMutation.mutateAsync({ unitItemId, file });
    } catch (err: any) {
      throw new Error(parseApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync({ id: String(deleteTarget.id), unitItemId });
      toast.success('Detail unit berhasil dihapus');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(parseApiError(err));
    }
  };

  if (purchaseLoading || unitItemLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!purchase || !unitItem || unitItemError) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Data detail unit tidak ditemukan</p>
          <Button onClick={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${purchaseId}`)}>Kembali ke Detail Pembelian</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <button onClick={() => router.back()} className="mb-2 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Detail Pembelian Unit</h1>
            <p className="text-sm text-muted-foreground">
              Invoice <span className="text-blue-600 font-medium">{purchase.code}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-2">

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Informasi Invoice</h3>
              </div>
              <div className="text-sm text-slate-600">
                <p>Nomor Pembelian</p>
                <p className="font-semibold text-slate-900">
                  <CopyBox text={purchase.code} />
                </p>
              </div>
              <div className="text-sm text-slate-600">
                <p>Tipe Unit</p>
                <p className="font-semibold text-slate-900">
                  <ReferenceLink href={`/dashboard/${slug}/master/type-unit?search=${unitTypeName}`}>{unitTypeName}</ReferenceLink>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-50">
                  <DollarSignIcon className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Detail Pembelian</h3>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Harga Unit</span>
                <span className="font-semibold text-slate-900">{currenciesFormat('idr', price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>BBN</span>
                <span className="font-semibold text-slate-900">{currenciesFormat('idr', bbnPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Quantity</span>
                <span className="font-semibold text-slate-900">{qty}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Total HPP</span>
                <span className="font-semibold text-slate-900">{currenciesFormat('idr', totalHpp)}</span>
              </div>
              {unitItem?.price_usd ? (
                <div className="flex items-center justify-between text-sm text-amber-800 bg-amber-50/50 px-2.5 py-1.5 rounded-lg border border-amber-100 mt-2">
                  <span className="font-medium">Total Harga (USD)</span>
                  <span className="font-bold">{currenciesFormat('usd', Number(unitItem.price_usd))}</span>
                </div>
              ) : null}
              {unitItem?.price_per_unit_usd ? (
                <div className="flex items-center justify-between text-sm text-amber-800 bg-amber-50/50 px-2.5 py-1.5 rounded-lg border border-amber-100">
                  <span className="font-medium">Harga Satuan (USD)</span>
                  <span className="font-bold">{currenciesFormat('usd', Number(unitItem.price_per_unit_usd))}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-yellow-50">
                  <ListTodoIcon className="h-5 w-5 text-yellow-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">Rincian Biaya</h3>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>DPP</span>
                <span className="font-semibold text-slate-900">
                  {currenciesFormat('idr', dppPerUnit)}
                  <span className="ml-2 font-light opacity-70">
                    ({(Number(unitItem?.dpp_tax_rate) / 100).toFixed(2)}%)
                    {unitItem?.dpp_tax?.tax?.name && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-help p-0.5">
                            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {unitItem?.dpp_tax?.tax?.name}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>PPN</span>
                <span className="font-semibold text-slate-900">
                  {currenciesFormat('idr', ppnPerUnit)}
                  <span className="ml-2 font-light opacity-70">
                    ({(Number(unitItem?.ppn_tax_rate) / 100).toFixed(2)}%)
                  </span>
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Total Pembelian</span>
                <span className="font-semibold text-slate-900">{currenciesFormat('idr', totalPembelian)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <BaseTable
              data={details ?? []}
              columns={columns}
              headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
              defaultSort={{ key: 'payment_date', direction: 'desc' }}
              headerActions=
              {(
                <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-800">Detail Pembelian Detail Unit</h2>
                    <p className="text-xs text-slate-500">Rincian lengkap detail unit yang dibeli</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canCreate && (
                      <>
                        <Button onClick={() => setOpenImport(true)} disabled={qty === details.length} variant="outline" className="w-full sm:w-auto">
                          <Upload className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                        <Button onClick={openCreateForm} disabled={qty === details.length || !qty} className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#152e4d]">
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Detail Unit
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Detail Unit' : 'Tambah Detail Unit'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Warna</label>
              <Input value={formValues.color} onChange={(e) => setFormValues((prev) => ({ ...prev, color: e.target.value }))} placeholder="Masukkan warna" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Mesin</label>
              <Input value={formValues.machine_number} onChange={(e) => setFormValues((prev) => ({ ...prev, machine_number: e.target.value }))} placeholder="Masukkan nomor mesin" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Rangka</label>
              <Input value={formValues.chassis_number} onChange={(e) => setFormValues((prev) => ({ ...prev, chassis_number: e.target.value }))} placeholder="Masukkan nomor rangka" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenForm(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Detail Unit</AlertDialogTitle>
            <AlertDialogDescription>Data detail unit yang dihapus tidak bisa dikembalikan. Lanjutkan?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DataImportModal
        open={openImport}
        onOpenChange={setOpenImport}
        title="Import Detail Unit"
        description="Pilih file Excel yang berisi detail unit (Warna, No Mesin, No Rangka)"
        onImport={handleImport}
        isPending={importMutation.isPending}
        templateUrl="https://docs.google.com/spreadsheets/d/1UdemvHlkJrmTD3mK5N4hcI5OfwQi2T2yw-vZxwrmcGg/edit?usp=sharing"
      />
    </DashboardLayout >
  );
}
