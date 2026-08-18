import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import type { TarifPayload } from '@/@types/tarif.types';

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
}

interface TarifFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TarifPayload) => void;
    isSubmitting?: boolean;
}

export function TarifFormModal({ isOpen, onClose, onSave, isSubmitting = false }: TarifFormModalProps) {
    const form = useForm<TarifFormData>({
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
        },
    });

    useEffect(() => {
        if (!isOpen) {
            form.reset({
                distance: '',
                loadingIn: '',
                loadingOut: '',
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
        onSave({
            loading_in: data.loadingIn,
            loading_out: data.loadingOut,
            distance: Number(data.distance),
            uj_towing: data.ujTowing,
            uj_cdd: data.ujCdd,
            uj_fuso: data.ujFuso,
            inv_towing: data.invTowing,
            inv_cdd: data.invCdd,
            inv_fuso: data.invFuso,
            is_active: true,
        });
    };

    return (
        <Form {...form}>
            <FormDialog
                open={isOpen}
                onOpenChange={(open) => !open && onClose()}
                title="Tambah Tarif"
                description="Masukkan detail tarif baru"
                onSubmit={form.handleSubmit(onSubmit)}
                submitLabel="Simpan"
                isSubmitting={isSubmitting}
                maxWidthClassName="max-w-4xl"
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 py-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="loadingIn"
                            rules={{ required: 'Loading in wajib diisi' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Loading in <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Masukkan data"
                                            className={`bg-white ${form.formState.errors.loadingIn ? 'border-red-500' : ''}`}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="loadingOut"
                            rules={{ required: 'Loading out wajib diisi' }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Loading out <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Masukkan data"
                                            className={`bg-white ${form.formState.errors.loadingOut ? 'border-red-500' : ''}`}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                            placeholder="Masukkan data"
                                            className={`bg-white ${form.formState.errors.distance ? 'border-red-500' : ''}`}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

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
    );
}
