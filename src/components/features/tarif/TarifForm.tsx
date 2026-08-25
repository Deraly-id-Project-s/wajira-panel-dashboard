import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { MoneyInput } from '@/components/ui/money-input';
import type { TarifPayload, Tarif } from '@/@types/tarif.types';

export interface TarifFormData {
    distance: string;
    loadingIn: string;
    loadingOut: string;
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

// ── Main Form Component ────────────────────────────────────────────────────────
export function TarifForm({ initialData, onSubmit, isSubmitting, title }: TarifFormProps) {
    const router = useRouter();

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<TarifFormData>({
        defaultValues: {
            distance: '',
            loadingIn: '',
            loadingOut: '',
            ujTowing: null,
            ujCdd: null,
            ujFuso: null,
            invTowing: null,
            invCdd: null,
            invFuso: null,
            isActive: true,
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                distance: String(initialData.distance),
                loadingIn: initialData.loadingIn,
                loadingOut: initialData.loadingOut,
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
        onSubmit({
            loading_in: data.loadingIn,
            loading_out: data.loadingOut,
            distance: Number(data.distance),
            uj_towing: data.ujTowing,
            uj_cdd: data.ujCdd,
            uj_fuso: data.ujFuso,
            inv_towing: data.invTowing,
            inv_cdd: data.invCdd,
            inv_fuso: data.invFuso,
            is_active: data.isActive,
        });
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Page Title */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <Card className="p-6">
                    {/* Section Header */}
                    <h2 className="text-base font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                        Form Detail Tarif
                    </h2>

                    {/* Form grid — matching the UI design exactly */}
                    <div className="space-y-6">
                        {/* Row 1: Loading In | Loading Out | Jarak */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="loadingIn" className="text-sm font-medium text-gray-700">
                                    Loading in <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="loadingIn"
                                    placeholder="Masukkan data"
                                    {...register('loadingIn', {
                                        required: 'Loading in wajib diisi',
                                        maxLength: { value: 249, message: 'Maksimal 249 karakter' },
                                    })}
                                    className={`bg-white ${errors.loadingIn ? 'border-red-500' : ''}`}
                                />
                                {errors.loadingIn && (
                                    <p className="text-red-500 text-xs">{errors.loadingIn.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="loadingOut" className="text-sm font-medium text-gray-700">
                                    Loading out <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="loadingOut"
                                    placeholder="Masukkan data"
                                    {...register('loadingOut', {
                                        required: 'Loading out wajib diisi',
                                        maxLength: { value: 249, message: 'Maksimal 249 karakter' },
                                    })}
                                    className={`bg-white ${errors.loadingOut ? 'border-red-500' : ''}`}
                                />
                                {errors.loadingOut && (
                                    <p className="text-red-500 text-xs">{errors.loadingOut.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="distance" className="text-sm font-medium text-gray-700">
                                    Jarak (KM) <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="distance"
                                    type="number"
                                    placeholder="Masukkan data"
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

                        {/* Row 3: UJ Towing | UJ CDD | UJ Fuso */}
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

                        {/* Row 4: Invoice Towing (placeholder) | Invoice CDD | Invoice Fuso */}
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
                        className="min-w-[130px] gap-2 button-theme-1!"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
