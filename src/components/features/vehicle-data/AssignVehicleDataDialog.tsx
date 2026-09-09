import * as React from 'react';
import { CalendarDays, Check, ChevronsUpDown, FileCheck2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { useAssignVehicleData, useVehicleDataLookup, useVendorLookup } from '@/hooks/useVehicleData';
import { toast } from 'sonner';
import { SearchableSelect } from './SearchableSelect';

interface AssignVehicleDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialVehicleIds?: number[];
  onAssigned?: (assignedIds: number[]) => void;
}

const formatDateValue = (date?: Date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function AssignVehicleDataDialog({ open, onOpenChange, initialVehicleIds = [], onAssigned }: AssignVehicleDataDialogProps) {
  const [vehicleSearch, setVehicleSearch] = React.useState('');
  const [vendorSearch, setVendorSearch] = React.useState('');
  const [selectedVehicleIds, setSelectedVehicleIds] = React.useState<number[]>(initialVehicleIds);
  const [vendorId, setVendorId] = React.useState('');
  const [processDate, setProcessDate] = React.useState<Date>();
  const [vehicleOpen, setVehicleOpen] = React.useState(false);

  const assignMutation = useAssignVehicleData();
  const vehicleLookup = useVehicleDataLookup(vehicleSearch);
  const vendorLookup = useVendorLookup(vendorSearch);

  React.useEffect(() => {
    if (open) {
      setSelectedVehicleIds(initialVehicleIds);
    }
  }, [initialVehicleIds, open]);

  React.useEffect(() => {
    if (!open) {
      setVehicleSearch('');
      setVendorSearch('');
      setVendorId('');
      setProcessDate(undefined);
    }
  }, [open]);

  const vehicleOptions = vehicleLookup.data ?? [];
  const vendorOptions = (vendorLookup.data ?? []).map((item) => ({
    value: String(item.id),
    label: item.label,
    subtitle: item.vendor.phone || item.vendor.code || undefined,
  }));

  const selectedVehicleLabels = vehicleOptions
    .filter((item) => selectedVehicleIds.includes(item.id))
    .map((item) => item.label);

  const toggleVehicle = (id: number) => {
    setSelectedVehicleIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const handleSubmit = async () => {
    if (!selectedVehicleIds.length) {
      toast.error('Pilih minimal satu data kendaraan');
      return;
    }

    if (!vendorId) {
      toast.error('Vendor wajib dipilih');
      return;
    }

    if (!processDate) {
      toast.error('Tanggal proses wajib diisi');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        vehicleDataIds: selectedVehicleIds,
        vendorId: Number(vendorId),
        processDate: formatDateValue(processDate),
      });
      toast.success('Data kendaraan berhasil di-assign ke ditlantas');
      onAssigned?.(selectedVehicleIds);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Gagal assign data kendaraan');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Assign ke Ditlantas</DialogTitle>
          <DialogDescription>Pilih data kendaraan, vendor, dan tanggal proses untuk assign registration.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Data Kendaraan</Label>
            <Popover open={vehicleOpen} onOpenChange={setVehicleOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between font-normal">
                  <span className="truncate text-left text-sm text-slate-700">
                    {selectedVehicleLabels.length ? `${selectedVehicleLabels.length} data dipilih` : 'Pilih data kendaraan'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Cari nomor faktur / nama STNK..." onValueChange={setVehicleSearch} />
                  <CommandList>
                    <CommandEmpty>{vehicleLookup.isLoading ? 'Memuat...' : 'Data kendaraan tidak ditemukan.'}</CommandEmpty>
                    <CommandGroup>
                      {vehicleOptions.map((item) => {
                        const selected = selectedVehicleIds.includes(item.id);
                        return (
                          <CommandItem key={item.id} value={item.label} onSelect={() => toggleVehicle(item.id)} className="items-start gap-2">
                            <Check className={cn('mt-0.5 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                            <div className="min-w-0">
                              <div className="truncate">{item.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.chassisNumber || '-'} / {item.machineNumber || '-'}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedVehicleIds.length > 0 ? (
              <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                {selectedVehicleIds.map((id) => {
                  const matched = vehicleOptions.find((item) => item.id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                      {matched?.label ?? `ID ${id}`}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Vendor</Label>
              <SearchableSelect
                value={vendorId}
                onChange={setVendorId}
                options={vendorOptions}
                loading={vendorLookup.isLoading}
                onSearchChange={setVendorSearch}
                placeholder="Pilih vendor"
                searchPlaceholder="Cari vendor..."
                emptyText="Vendor tidak ditemukan."
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Proses</Label>
              <div className="relative">
                <DatePicker value={processDate} onChange={setProcessDate} placeholder="Pilih tanggal proses" className="bg-white" />
                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assignMutation.isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={assignMutation.isPending}>
            {assignMutation.isPending ? 'Memproses...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
