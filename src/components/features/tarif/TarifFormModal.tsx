import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectAdd } from '@/components/ui/select-add';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { RouteFormModal } from '@/components/features/route/RouteFormModal';
import { useRouteOptions, useCreateRoute } from '@/hooks/useRoute';
import type { TarifPayload, TarifRouteInput } from '@/@types/tarif.types';
import type { CreateRoutePayload } from '@/@types/route.types';
import { toast } from 'sonner';

export interface RouteItemRow {
    routeId: string;
    stateAt: 'loading_in' | 'loading_out';
}

export interface TarifFormData {
    distance: string;
    routes: RouteItemRow[];
    ujTowing: number | null;
    ujCdd: number | null;
    ujFuso: number | null;
    invTowing: number | null;
    invCdd: number | null;
    invFuso: number | null;
}

interface TarifFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TarifPayload) => void;
    isSubmitting?: boolean;
}

export function TarifFormModal({ isOpen, onClose, onSave, isSubmitting = false }: TarifFormModalProps) {
    const { data: routeOptions = [], isLoading: isLoadingRoutes, refetch: refetchRoutes } = useRouteOptions();
    const createRouteMutation = useCreateRoute();
    const [isCreateRouteModalOpen, setIsCreateRouteModalOpen] = useState(false);
    const [activeRouteRowIndex, setActiveRouteRowIndex] = useState<number | null>(null);

    const form = useForm<TarifFormData>({
        defaultValues: {
            distance: '',
            routes: [
                { routeId: '', stateAt: 'loading_in' },
                { routeId: '', stateAt: 'loading_out' },
            ],
            ujTowing: null,
            ujCdd: null,
            ujFuso: null,
            invTowing: null,
            invCdd: null,
            invFuso: null,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'routes',
    });

    useEffect(() => {
        if (!isOpen) {
            form.reset({
                distance: '',
                routes: [
                    { routeId: '', stateAt: 'loading_in' },
                    { routeId: '', stateAt: 'loading_out' },
                ],
                ujTowing: null,
                ujCdd: null,
                ujFuso: null,
                invTowing: null,
                invCdd: null,
                invFuso: null,
            });
        }
    }, [isOpen, form]);

    const onSubmit = (data: TarifFormData) => {
        const validRoutes: TarifRouteInput[] = (data.routes || [])
            .map((r, index) => ({
                route_id: Number(r.routeId),
                order: index + 1,
                state_at: r.stateAt,
            }))
            .filter((r) => !Number.isNaN(r.route_id) && r.route_id > 0);

        if (validRoutes.length < 2) {
            toast.error('Minimal harus memilih 2 titik rute (Loading In & Loading Out)');
            return;
        }

        const hasLoadingIn = validRoutes.some((r) => r.state_at === 'loading_in');
        const hasLoadingOut = validRoutes.some((r) => r.state_at === 'loading_out');

        if (!hasLoadingIn || !hasLoadingOut) {
            toast.error('Rute harus memiliki minimal satu titik Loading In dan satu titik Loading Out');
            return;
        }

        onSave({
            distance: Number(data.distance),
            routes: validRoutes,
            uj_towing: data.ujTowing,
            uj_cdd: data.ujCdd,
            uj_fuso: data.ujFuso,
            inv_towing: data.invTowing,
            inv_cdd: data.invCdd,
            inv_fuso: data.invFuso,
            is_active: true,
        });
    };

    const handleQuickAddRoute = (index: number) => {
        setActiveRouteRowIndex(index);
        setIsCreateRouteModalOpen(true);
    };

    const handleCreateRouteSubmit = async (payload: CreateRoutePayload) => {
        try {
            const newRoute = await createRouteMutation.mutateAsync(payload);
            toast.success('Rute baru berhasil ditambahkan');
            await refetchRoutes();
            if (activeRouteRowIndex !== null && newRoute?.id) {
                form.setValue(`routes.${activeRouteRowIndex}.routeId`, String(newRoute.id), {
                    shouldDirty: true,
                    shouldValidate: true,
                });
            }
            setIsCreateRouteModalOpen(false);
            setActiveRouteRowIndex(null);
        } catch (error: any) {
            toast.error(error?.message || 'Gagal menambahkan rute baru');
        }
    };

    return (
        <>
            <Form {...form}>
                <FormDialog
                    open={isOpen}
                    onOpenChange={(open) => !open && onClose()}
                    title="Tambah Tarif"
                    description="Masukkan detail rute logistik dan tarif baru"
                    onSubmit={form.handleSubmit(onSubmit)}
                    submitLabel="Simpan"
                    isSubmitting={isSubmitting}
                    maxWidthClassName="max-w-4xl"
                >
                    <div className="space-y-5 max-h-[65vh] overflow-y-auto px-1 py-1">
                        {/* Section Titik Rute */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4 text-amber-500" />
                                    Daftar Titik Rute
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ routeId: '', stateAt: 'loading_out' })}
                                    className="border-dashed border-slate-300 text-xs gap-1 h-7"
                                >
                                    <Plus className="h-3 w-3" />
                                    Tambah Titik
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md"
                                    >
                                        <div className="flex items-center gap-2 min-w-[90px]">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                                                {index + 1}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {index === 0 ? 'Asal' : index === fields.length - 1 ? 'Tujuan' : `Transit`}
                                            </span>
                                        </div>

                                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <Controller
                                                control={form.control}
                                                name={`routes.${index}.routeId`}
                                                render={({ field: routeField }) => (
                                                    <SelectAdd
                                                        onAdd={() => handleQuickAddRoute(index)}
                                                        addLabel="Tambah Rute"
                                                        addVariant="outline"
                                                        containerClassName="w-full"
                                                    >
                                                        <Select
                                                            value={routeField.value}
                                                            onValueChange={routeField.onChange}
                                                            disabled={isLoadingRoutes}
                                                        >
                                                            <SelectTrigger className="bg-white w-full h-9 text-xs">
                                                                <SelectValue placeholder={isLoadingRoutes ? 'Memuat rute...' : 'Pilih Rute'} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-56">
                                                                {routeOptions.map((opt) => (
                                                                    <SelectItem key={opt.id} value={String(opt.id)}>
                                                                        {opt.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </SelectAdd>
                                                )}
                                            />

                                            <Controller
                                                control={form.control}
                                                name={`routes.${index}.stateAt`}
                                                render={({ field: stateField }) => (
                                                    <Select
                                                        value={stateField.value}
                                                        onValueChange={stateField.onChange}
                                                    >
                                                        <SelectTrigger className="bg-white w-full h-9 text-xs">
                                                            <SelectValue placeholder="Pilih Jenis" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="loading_in">Loading In (Muat)</SelectItem>
                                                            <SelectItem value="loading_out">Loading Out (Bongkar)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>

                                        {fields.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="text-red-500 hover:text-red-700 h-8 w-8 shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Jarak */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="distance"
                                rules={{ required: 'Jarak wajib diisi' }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700">
                                            Jarak (KM) <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Masukkan jarak"
                                                className={`bg-white ${form.formState.errors.distance ? 'border-red-500' : ''}`}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Uang Jalan */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="ujTowing"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700">UJ Towing</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                placeholder="Masukkan data"
                                                value={field.value}
                                                onChangeValue={field.onChange}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ujCdd"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700">UJ CDD</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                placeholder="Masukkan data"
                                                value={field.value}
                                                onChangeValue={field.onChange}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ujFuso"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700">UJ Fuso</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                placeholder="Masukkan data"
                                                value={field.value}
                                                onChangeValue={field.onChange}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Tagihan Invoice */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="invTowing"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700">Invoice Towing</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                placeholder="Masukkan data"
                                                value={field.value}
                                                onChangeValue={field.onChange}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="invCdd"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700">Invoice CDD</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                placeholder="Masukkan data"
                                                value={field.value}
                                                onChangeValue={field.onChange}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="invFuso"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700">Invoice Fuso</FormLabel>
                                        <FormControl>
                                            <MoneyInput
                                                placeholder="Masukkan data"
                                                value={field.value}
                                                onChangeValue={field.onChange}
                                                className="bg-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </FormDialog>
            </Form>

            <RouteFormModal
                open={isCreateRouteModalOpen}
                onOpenChange={setIsCreateRouteModalOpen}
                onSubmit={handleCreateRouteSubmit}
                isSubmitting={createRouteMutation.isPending}
            />
        </>
    );
}
