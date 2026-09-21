import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSignIcon, FileText, Info, ListTodoIcon, MoreVertical, Plus, Upload, Trash, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { usePurchaseById } from '@/hooks/useUnitTransaction';
import {
  useCreateUnitItemDetail,
  useDeleteUnitItemDetail,
  useImportUnitItemDetails,
  useUnitItemDetails,
  useUnitTransactionItemById,
  useUpdateUnitItemDetail,
  useBulkDeleteUnitItemDetails,
} from '@/hooks/useUnitItemDetail';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormDialog } from '@/components/ui/form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataImportModal } from '@/components/features/master-data/DataImportModal';
import { CopyBox } from '@/components/ui/copy-box';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import { ReferenceLink } from '@/components/ui/reference-link';
import BaseTable from '@/components/ui/base-table';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CollapsibleBox } from '@/components/ui/collapsible-box';

const statusConfig: Record<string, { label: string; className: string }> = {
  // Backend enum statuses
  normal: { label: 'Normal', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  minor_damage: { label: 'Minor Damage', className: 'border-amber-200 bg-amber-50 text-amber-700 font-semibold' },
  major_damage: { label: 'Major Damage', className: 'border-red-200 bg-red-50 text-red-700 font-semibold' },
  returned: { label: 'Returned', className: 'border-purple-200 bg-purple-50 text-purple-700 font-semibold' },
  refunded: { label: 'Refunded', className: 'border-orange-200 bg-orange-50 text-orange-700 font-semibold' },
  lost: { label: 'Lost', className: 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' },
  in_repair: { label: 'In Repair', className: 'border-blue-200 bg-blue-50 text-blue-700 font-semibold' },

  // Fallback / legacy statuses
  draft: { label: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600 font-medium' },
  cancel: { label: 'Cancel', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  rejected: { label: 'Rejected', className: 'border-red-200 bg-red-50 text-red-700 font-medium' },
  prepare: { label: 'Prepare', className: 'border-amber-200 bg-amber-50 text-amber-700 font-medium' },
  inbound_purcase_order: { label: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700 font-medium' },
  inbound_incoming_goods: { label: 'In Transit', className: 'border-blue-200 bg-blue-50 text-blue-700 font-medium' },
  inbound_receipt: { label: 'Available', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold' },
  inbound_return: { label: 'Refund', className: 'border-orange-200 bg-orange-50 text-orange-700 font-medium' },
  outbound_reserved: { label: 'Reserved', className: 'border-orange-200 bg-orange-50 text-orange-700 font-medium' },
  outbound_in_transit: { label: 'In Transit', className: 'border-indigo-200 bg-indigo-50 text-indigo-700 font-medium' },
  outbound_delivered: { label: 'Delivered', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 font-medium' },
  outbound_return: { label: 'Return', className: 'border-rose-200 bg-rose-50 text-rose-700 font-medium' },
};

const renderStatus = (status: string) => {
  const config = statusConfig[status] ?? {
    label: status ? status.replace(/_/g, ' ') : '-',
    className: 'border-slate-200 bg-slate-50 text-slate-700 font-medium',
  };

  return (
    <Badge variant="outline" className={cn('capitalize', config.className)}>
      {config.label}
    </Badge>
  );
};

const parseApiError = (err: any): string => {
  const message = err?.response?.data?.message || err?.message || '';
  if (message.toLowerCase().includes('capacity reach maximum') || message.toLowerCase().includes('capacity limit')) {
    return 'Jumlah unit yang diimport melebihi kapasitas quantity item pembelian ini.';
  }

  const details = err?.details ?? err?.response?.data?.errors;
  if (typeof details === 'string') return details;
  if (details && typeof details === 'object') {
    return Object.entries(details)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value[0] : String(value)}`)
      .join(', ');
  }
  return message || 'Terjadi kesalahan pada server';
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

  const { data: purchase, isLoading: purchaseLoading } = usePurchaseById(purchaseId);
  const { data: unitItem, isLoading: unitItemLoading, isError: unitItemError } = useUnitTransactionItemById(unitItemId);
  const { data: detailResponse } = useUnitItemDetails(unitItemId);

  const createMutation = useCreateUnitItemDetail();
  const updateMutation = useUpdateUnitItemDetail();
  const deleteMutation = useDeleteUnitItemDetail();
  const importMutation = useImportUnitItemDetails();
  const bulkDeleteMutation = useBulkDeleteUnitItemDetails();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openForm, setOpenForm] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string | number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number } | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [openBulkDeleteModal, setOpenBulkDeleteModal] = useState(false);

  const [search, setSearch] = useState('');

  const [formValues, setFormValues] = useState({
    color: '',
    machine_number: '',
    chassis_number: '',
  });

  const details = useMemo(() => detailResponse?.data ?? [], [detailResponse?.data]);

  const isPaid = purchase?.unit_transaction_billing?.is_paid;

  const filteredDetails = useMemo(() => {
    return details.filter((d: any) => {
      const s = search.toLowerCase();
      return (
        (d.machine_number?.toLowerCase().includes(s) ?? false) ||
        (d.chassis_number?.toLowerCase().includes(s) ?? false) ||
        (d.color?.toLowerCase().includes(s) ?? false)
      );
    });
  }, [details, search]);

  const columns = useMemo(
    () => [
      {
        header: 'Warna',
        accessorKey: 'color',
        sortable: true,
        alignment: 'left' as const,
        cell: (details: any) => details.color,
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
        header: 'Sub Blok',
        accessorKey: 'warehouseSubBlock',
        alignment: 'center' as const,
        sortable: true,
        tooltip: 'Lokasi sub-blok penyimpanan unit di dalam gudang',
        cell: (details: any) => details.warehouse_sub_block?.name ? details.warehouse_sub_block?.name : <Badge variant='outline' className="font-semibold bg-white">Belum Ditambahkan</Badge>,
      },
      {
        header: 'Status Stok',
        accessorKey: 'in_stock',
        sortable: true,
        alignment: 'center' as const,
        tooltip: 'Status ketersediaan unit fisik di gudang',
        cell: (details: any) => details.in_stock ? <Badge variant="outline" className={cn('capitalize', 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold')}>Tersedia</Badge> : <Badge variant="outline" className={cn('capitalize', 'border-rose-200 bg-rose-50 text-rose-700 font-semibold')}>Tidak Tersedia</Badge>
      },
      {
        header: 'Kondisi Stok',
        accessorKey: 'status',
        sortable: true,
        alignment: 'center' as const,
        tooltip: 'Kondisi fisik unit saat ini',
        cell: (details: any) => renderStatus(details.status),
      },
      {
        header: 'Posisi Stok',
        accessorKey: 'stock_state',
        sortable: true,
        alignment: 'center' as const,
        tooltip: 'Posisi logistik atau status alur stok unit',
        cell: (details: any) => {
          const config: Record<string, { label: string; name: string; className: string }> = {
            draft: { label: 'Draft', name: 'Draft', className: 'border-slate-200 bg-slate-50 text-slate-600' },
            cancel: { label: 'Cancel', name: 'Batal', className: 'border-rose-200 bg-rose-50 text-rose-700' },
            prepare: { label: 'Prepare', name: 'Disiapkan', className: 'border-amber-200 bg-amber-50 text-amber-700' },
            purchase_order: { label: 'Purchase Order', name: 'Purchase Order', className: 'border-blue-200 bg-blue-50 text-blue-700' },
            in_transit: { label: 'In Transit', name: 'Dalam Perjalanan', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
            receipt: { label: 'Receipt', name: 'Diterima', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
          };
          const stateVal = details?.stock_state ?? 'draft';
          const match = config[stateVal] ?? {
            label: stateVal.replace(/_/g, ' '),
            className: 'border-slate-200 bg-slate-50 text-slate-700',
          };

          const isRefund = details?.status === 'returned' || details?.status === 'refunded';

          return (
            <Badge variant="outline" className={cn('capitalize font-semibold', match.className)}>
              {stateVal === 'receipt' ? (isRefund ? 'Dikembalikan' : 'Diterima') : match.label}
            </Badge>
          );
        }
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
              {canEdit && <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#111827]" onClick={() => openEditForm(details)}>
                Edit
              </DropdownMenuItem>}
              {canDelete && !isPaid && <DropdownMenuItem className="rounded-[10px] px-4 py-3 text-sm text-[#EF4444]" onClick={() => setDeleteTarget(details)}>
                Hapus
              </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canDelete, canEdit, isPaid],
  );

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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsBulkDeleting(true);
      await bulkDeleteMutation.mutateAsync({
        unitItemId,
        ids: Array.from(selectedIds),
      });
      toast.success('Beberapa detail unit berhasil dihapus');
      setSelectedIds(new Set());
      setOpenBulkDeleteModal(false);
    } catch (err: any) {
      toast.error(parseApiError(err));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (purchaseLoading || unitItemLoading) {
    return (
      <DashboardLayout>
        <LoadingState variant="page" />
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
        <div className="space-y-6">
          <PageHeader
            breadcrumbs={[
              { label: 'Pembelian Unit', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit`) },
              { label: 'Detail Pembelian', onClick: () => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${purchaseId}`) },
              { label: 'Detail Pembelian Unit' }
            ]}
            title="Detail Data Pembelian"
            subtitle={
              <>
                <span>Kode Beli:</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-orange-600 hover:text-orange-700">{purchase.code}</span>
              </>
            }
            onBack={() => router.push(`/dashboard/${slug}/transaksi/pembelian-unit/${purchaseId}`)}
          />

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
                    <ReferenceLink href={`/dashboard/${slug}/master/type-unit/${unitItem?.unit_type?.id}`}>{unitItem?.unit_type?.name}</ReferenceLink>
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
                  <div className="flex items-center justify-between text-sm text-amber-800 bg-amber-50/50 px-2.5 py-1.5 rounded-md border border-amber-100 mt-2">
                    <span className="font-medium">Total Harga (USD)</span>
                    <span className="font-bold">{currenciesFormat('usd', Number(unitItem.price_usd))}</span>
                  </div>
                ) : null}
                {unitItem?.price_per_unit_usd ? (
                  <div className="flex items-center justify-between text-sm text-amber-800 bg-amber-50/50 px-2.5 py-1.5 rounded-md border border-amber-100">
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
            <CollapsibleBox title="Data Pembelian Detail Unit Tipe" description="Rincian lengkap detail unit yang dibeli">
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col md:items-end justify-between border-b border-slate-100 pb-4 gap-4">
                  <div className={cn(
                    "flex items-center gap-4 px-4 py-2.5 rounded-md border",
                    details.length >= qty
                      ? "bg-emerald-50/50 border-emerald-100"
                      : "bg-blue-50/50 border-blue-100"
                  )}>
                    <div>
                      <p className={cn(
                        "text-[11px] font-semibold uppercase tracking-wider mb-0.5",
                        details.length >= qty ? "text-emerald-600" : "text-blue-600"
                      )}>
                        Status Pengisian Unit
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold text-slate-800 leading-none">{details.length}</span>
                        <span className="text-sm font-medium text-slate-500">/ {qty}</span>
                        <span className="text-xs text-slate-500 ml-0.5">Unit</span>
                      </div>
                    </div>
                    <div className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full",
                      details.length >= qty ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                    )}>
                      {details.length >= qty ? <CheckCircle2 className="h-5 w-5" /> : <ListTodoIcon className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                <BaseTable
                  data={filteredDetails}
                  columns={columns}
                  loading={purchaseLoading}
                  headerRowClassName="bg-[#f8f9fa] border-b border-gray-200"
                  defaultSort={{ key: 'payment_date', direction: 'desc' }}
                  showCheckbox={!isPaid}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={setSelectedIds}
                  search={search}
                  onSearchChange={(val) => { setSearch(val); }}
                  headerActions=
                  {(
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                      {selectedIds.size > 0 && canDelete && !isPaid && (
                        <Button
                          onClick={() => setOpenBulkDeleteModal(true)}
                          disabled={isBulkDeleting}
                          variant="destructive"
                          className="w-full sm:w-auto bg-[#EF4444] hover:bg-[#DC2626] text-white"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Hapus ({selectedIds.size})
                        </Button>
                      )}
                      {canCreate && (
                        <>
                          <Button onClick={() => setOpenImport(true)} disabled={qty === details.length} variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                          </Button>
                          <Button onClick={openCreateForm} disabled={qty === details.length || !qty} variant="default">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Detail Unit
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                />
              </CardContent>
            </CollapsibleBox>

          </Card>
        </div>
      </div>

      <FormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        title={editingItem ? 'Edit Detail Unit' : 'Tambah Detail Unit'}
        onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit(); }}
        maxWidthClassName="max-w-md"
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      >
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
      </FormDialog>

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

      <AlertDialog open={openBulkDeleteModal} onOpenChange={setOpenBulkDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.size} Detail Unit</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus {selectedIds.size} detail unit terpilih? Data yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? 'Menghapus...' : 'Hapus'}
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
