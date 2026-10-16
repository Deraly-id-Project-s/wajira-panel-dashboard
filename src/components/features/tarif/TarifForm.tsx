import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectAdd } from '@/components/ui/select-add';
import { RouteFormModal } from '@/components/features/route/RouteFormModal';
import { useRouteOptions, useCreateRoute } from '@/hooks/useRoute';
import type { TarifPayload, Tarif, TarifRouteInput } from '@/@types/tarif.types';
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
    isActive: boolean;
}

interface TarifFormProps {
    initialData?: Tarif;
    onSubmit: (data: TarifPayload) => void;
    isSubmitting: boolean;
    title: string;
}

export function TarifForm({ initialData, onSubmit, isSubmitting, title }: TarifFormProps) {
    const router = useRouter();
    const { data: routeOptions = [], isLoading: isLoadingRoutes, refetch: refetchRoutes } = useRouteOptions();
    const createRouteMutation = useCreateRoute();
    const [isCreateRouteModalOpen, setIsCreateRouteModalOpen] = useState(false);
    const [activeRouteRowIndex, setActiveRouteRowIndex] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        formState: { errors },
    } = useForm<TarifFormData>({
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
            isActive: true,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'routes',
    });

    useEffect(() => {
        if (initialData) {
            let initialRoutes: RouteItemRow[] = [];

            if (initialData.routes && initialData.routes.length > 0) {
                initialRoutes = initialData.routes.map((r) => ({
                    routeId: String(r.id),
                    stateAt: (r.pivot?.state_at as 'loading_in' | 'loading_out') || 'loading_in',
                }));
            } else {
                initialRoutes = [
                    { routeId: '', stateAt: 'loading_in' },
                    { routeId: '', stateAt: 'loading_out' },
                ];
            }

            reset({
                distance: String(initialData.distance || ''),
                routes: initialRoutes,
                ujTowing: initialData.ujTowing !== null && initialData.ujTowing !== undefined ? Number(initialData.ujTowing) : null,
                ujCdd: initialData.ujCdd !== null && initialData.ujCdd !== undefined ? Number(initialData.ujCdd) : null,
                ujFuso: initialData.ujFuso !== null && initialData.ujFuso !== undefined ? Number(initialData.ujFuso) : null,
                invTowing: initialData.invTowing !== null && initialData.invTowing !== undefined ? Number(initialData.invTowing) : null,
                invCdd: initialData.invCdd !== null && initialData.invCdd !== undefined ? Number(initialData.invCdd) : null,
                invFuso: initialData.invFuso !== null && initialData.invFuso !== undefined ? Number(initialData.invFuso) : null,
                isActive: initialData.isActive ?? true,
            });
        }
    }, [initialData, reset]);

    const handleFormSubmit = (data: TarifFormData) => {
        const validRoutes: TarifRouteInput[] = (data.routes || [])
            .map((r, index) => ({
                route_id: Number(r.routeId),
                order: index + 1,
                state_at: r.stateAt,
            }))
            .filter((r) => !Number.isNaN(r.route_id) && r.route_id > 0);

        if (validRoutes.length < 2) {
            toast.error('Minimal harus memilih 2 titik rute (Asal / Loading In dan Tujuan / Loading Out)');
            return;
        }

        const hasLoadingIn = validRoutes.some((r) => r.state_at === 'loading_in');
        const hasLoadingOut = validRoutes.some((r) => r.state_at === 'loading_out');

        if (!hasLoadingIn || !hasLoadingOut) {
            toast.error('Rute harus memiliki minimal satu titik Loading In dan satu titik Loading Out');
            return;
        }

        onSubmit({
            distance: Number(data.distance),
            routes: validRoutes,
            uj_towing: data.ujTowing,
            uj_cdd: data.ujCdd,
            uj_fuso: data.ujFuso,
            inv_towing: data.invTowing,
            inv_cdd: data.invCdd,
            inv_fuso: data.invFuso,
            is_active: data.isActive,
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
                setValue(`routes.${activeRouteRowIndex}.routeId`, String(newRoute.id), {
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
        <div className="space-y-6 pb-8">
            {/* Page Title */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Card className="p-6 space-y-6">
                    {/* Section Titik Rute Logistik */}
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 mb-4 gap-2">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    Daftar Titik Rute
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tentukan rute asal (Loading In), rute tujuan (Loading Out), serta titik transit jika ada.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ routeId: '', stateAt: 'loading_out' })}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah Titik Rute
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field, index) => {
                                const isFirst = index === 0;
                                const isLast = index === fields.length - 1;
                                const stepLabel = isFirst ? 'Titik Awal (Origin)' : isLast ? 'Titik Akhir (Destination)' : `Transit ${index}`;

                                return (
                                    <div
                                        key={field.id}
                                        className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg"
                                    >
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                                                {index + 1}
                                            </span>
                                            <span className="text-xs font-medium text-slate-600">{stepLabel}</span>
                                        </div>

                                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {/* Pilih Rute */}
                                            <div className="w-full">
                                                <Controller
                                                    control={control}
                                                    name={`routes.${index}.routeId`}
                                                    rules={{ required: 'Rute wajib dipilih' }}
                                                    render={({ field: routeField }) => (
                                                        <SelectAdd
                                                            onAdd={() => handleQuickAddRoute(index)}
                                                            addLabel="Tambah Master Rute"
                                                            addVariant="outline"
                                                            containerClassName="w-full"
                                                        >
                                                            <Select
                                                                value={routeField.value}
                                                                onValueChange={routeField.onChange}
                                                                disabled={isLoadingRoutes}
                                                            >
                                                                <SelectTrigger className="bg-white w-full">
                                                                    <SelectValue placeholder={isLoadingRoutes ? 'Memuat rute...' : 'Pilih Rute / Lokasi'} />
                                                                </SelectTrigger>
                                                                <SelectContent className="max-h-60">
                                                                    {routeOptions.map((opt) => (
                                                                        <SelectItem key={opt.id} value={String(opt.id)}>
                                                                            <span className="font-medium text-slate-900">{opt.name}</span>
                                                                            {opt.address && (
                                                                                <span className="text-xs text-slate-500 ml-2">({opt.address})</span>
                                                                            )}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </SelectAdd>
                                                    )}
                                                />
                                            </div>

                                            {/* Status Titik (Loading In / Loading Out) */}
                                            <div className="w-full">
                                                <Controller
                                                    control={control}
                                                    name={`routes.${index}.stateAt`}
                                                    render={({ field: stateField }) => (
                                                        <Select
                                                            value={stateField.value}
                                                            onValueChange={stateField.onChange}
                                                        >
                                                            <SelectTrigger className="bg-white w-full">
                                                                <SelectValue placeholder="Pilih Jenis Titik" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="loading_in">
                                                                    <span className="inline-flex items-center gap-1.5 font-medium text-blue-700">
                                                                        Loading In (Muat)
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="loading_out">
                                                                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                                                                        Loading Out (Bongkar)
                                                                    </span>
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {fields.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 self-end md:self-auto"
                                                title="Hapus Titik Rute"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section Jarak */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-gray-100">
                        <div className="space-y-1.5">
                            <Label htmlFor="distance" className="text-sm font-medium text-gray-700">
                                Jarak Total (KM) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="distance"
                                type="number"
                                placeholder="Masukkan jarak dalam KM"
                                {...register('distance', {
                                    required: 'Jarak wajib diisi',
                                    min: { value: 0, message: 'Jarak tidak boleh negatif' },
                                })}
                                className={`bg-white ${errors.distance ? 'border-red-500' : ''}`}
                            />
                            {errors.distance && (
                                <p className="text-red-500 text-xs">{errors.distance.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Section Uang Jalan (UJ) */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            Uang Jalan (UJ Driver)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="ujTowing" className="text-sm font-medium text-gray-700">
                                    UJ Towing
                                </Label>
                                <Controller
                                    control={control}
                                    name="ujTowing"
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="ujTowing"
                                            placeholder="Masukkan data"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className="bg-white"
                                        />
                                    )}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ujCdd" className="text-sm font-medium text-gray-700">
                                    UJ CDD
                                </Label>
                                <Controller
                                    control={control}
                                    name="ujCdd"
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="ujCdd"
                                            placeholder="Masukkan data"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className="bg-white"
                                        />
                                    )}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ujFuso" className="text-sm font-medium text-gray-700">
                                    UJ Fuso
                                </Label>
                                <Controller
                                    control={control}
                                    name="ujFuso"
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="ujFuso"
                                            placeholder="Masukkan data"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className="bg-white"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section Tagihan Invoice (INV) */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            Tagihan Invoice Customer (INV)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="invTowing" className="text-sm font-medium text-gray-700">
                                    Invoice Towing
                                </Label>
                                <Controller
                                    control={control}
                                    name="invTowing"
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="invTowing"
                                            placeholder="Masukkan data"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className="bg-white"
                                        />
                                    )}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="invCdd" className="text-sm font-medium text-gray-700">
                                    Invoice CDD
                                </Label>
                                <Controller
                                    control={control}
                                    name="invCdd"
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="invCdd"
                                            placeholder="Masukkan data"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className="bg-white"
                                        />
                                    )}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="invFuso" className="text-sm font-medium text-gray-700">
                                    Invoice Fuso
                                </Label>
                                <Controller
                                    control={control}
                                    name="invFuso"
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="invFuso"
                                            placeholder="Masukkan data"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className="bg-white"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-center items-center gap-6 pt-8">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        disabled={isSubmitting}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="min-w-[130px] gap-2 btn-primary!"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </div>
            </form>

            <RouteFormModal
                open={isCreateRouteModalOpen}
                onOpenChange={setIsCreateRouteModalOpen}
                onSubmit={handleCreateRouteSubmit}
                isSubmitting={createRouteMutation.isPending}
            />
        </div>
    );
}
