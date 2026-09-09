import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { FinanceAsset, FinanceAssetPayload } from '@/@types/finance-asset.types';
import { useAssets } from '@/hooks/useAsset';
import { useCompany } from '@/contexts/CompanyContext';
import { useFinanceAssetFormula } from '@/hooks/useFinanceAsset';
import { Calendar, Hash, Loader2, Save, WalletCards } from 'lucide-react';

export interface FinanceAssetFormProps {
    mode?: 'create' | 'edit';
    initialData?: FinanceAsset | null;
    onSave: (data: FinanceAssetPayload) => void | Promise<void>;
    onCancel: () => void;
    isSaving?: boolean;
}

export function FinanceAssetForm({
    mode = 'create',
    initialData,
    onSave,
    onCancel,
    isSaving = false,
}: FinanceAssetFormProps) {
    const { companyId } = useCompany();
    const { data: assetsData, isLoading: isLoadingAssets } = useAssets(companyId, { perPage: 1000 });
    const assetsList = assetsData?.data || [];

    const defaultPurchaseDate = initialData?.purchase_date
        ? initialData.purchase_date.split('T')[0].split(' ')[0]
        : '';

    const { register, handleSubmit, control, setValue, watch, reset } = useForm<FinanceAssetPayload>({
        defaultValues: {
            asset_id: initialData?.asset_id || 0,
            price: initialData?.price || 0,
            purchase_date: defaultPurchaseDate,
            economic_age: initialData?.economic_age || 0,
            description: initialData?.description || '',
            serial_number: initialData?.serial_number || '',
            depreciation: initialData?.depreciation || initialData?.monthly_depreciation || 0,
            monthly_depreciation: initialData?.monthly_depreciation || initialData?.depreciation || 0,
            accumulated_depreciation: initialData?.accumulated_depreciation || 0,
            book_value: initialData?.book_value || initialData?.final_value || 0,
            final_value: initialData?.final_value || initialData?.book_value || 0,
            status: initialData?.status || 'AKTIF',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                asset_id: initialData.asset_id || 0,
                price: initialData.price || 0,
                purchase_date: initialData.purchase_date
                    ? initialData.purchase_date.split('T')[0].split(' ')[0]
                    : '',
                economic_age: initialData.economic_age || 0,
                description: initialData.description || '',
                serial_number: initialData.serial_number || '',
                depreciation: initialData.depreciation || initialData.monthly_depreciation || 0,
                monthly_depreciation: initialData.monthly_depreciation || initialData.depreciation || 0,
                accumulated_depreciation: initialData.accumulated_depreciation || 0,
                book_value: initialData.book_value || initialData.final_value || 0,
                final_value: initialData.final_value || initialData.book_value || 0,
                status: initialData.status || 'AKTIF',
            });
        }
    }, [initialData, reset]);

    const watchedAssetId = watch('asset_id');
    const watchedPurchaseDate = watch('purchase_date');
    const watchedPrice = watch('price');
    const watchedEconomicAge = watch('economic_age');
    // Fetch formula calculation from API
    const {
        data: formulaData,
        isFetching: isFetchingFormula,
        isError: isFormulaError,
    } = useFinanceAssetFormula({
        asset_id: watchedAssetId,
        purchase_date: watchedPurchaseDate,
        price: watchedPrice,
        economic_age: watchedEconomicAge,
    });

    // Update form values when formula calculation arrives
    useEffect(() => {
        if (formulaData) {
            if (formulaData.monthly_depreciation !== undefined) {
                setValue('depreciation', formulaData.monthly_depreciation);
                setValue('monthly_depreciation', formulaData.monthly_depreciation);
            }
            if (formulaData.accumulated_depreciation !== undefined) {
                setValue('accumulated_depreciation', formulaData.accumulated_depreciation);
            }
            if (formulaData.book_value !== undefined) {
                setValue('book_value', formulaData.book_value);
                setValue('final_value', formulaData.book_value);
            }
            if (formulaData.status) {
                setValue('status', formulaData.status);
            }
        }
    }, [formulaData, setValue]);

    // Fallback display values if formula has not returned yet
    const priceNum = Number(watchedPrice) || 0;
    const economicAgeNum = Number(watchedEconomicAge) || 0;
    const ageMonths = formulaData?.age ?? (economicAgeNum > 0 ? economicAgeNum * 12 : initialData?.age ?? 0);
    const monthlyDepreciation =
        formulaData?.monthly_depreciation ??
        (economicAgeNum > 0 && priceNum > 0
            ? Math.round(priceNum / (economicAgeNum * 12))
            : initialData?.monthly_depreciation ?? initialData?.depreciation ?? 0);
    const monthsUsed = formulaData?.months_used ?? initialData?.months_used ?? 0;
    const accumulatedDepreciation =
        formulaData?.accumulated_depreciation ??
        (initialData?.accumulated_depreciation ?? monthlyDepreciation * monthsUsed);
    const bookValue =
        formulaData?.book_value ??
        (initialData?.book_value ?? Math.max(0, priceNum - accumulatedDepreciation));
    const currentStatus = formulaData?.status || initialData?.status || 'AKTIF';

    const onSubmit = (data: FinanceAssetPayload) => {
        const payload: FinanceAssetPayload = {
            ...data,
            asset_id: Number(data.asset_id),
            price: Number(data.price),
            economic_age: Number(data.economic_age),
            depreciation: formulaData?.monthly_depreciation ?? Number(data.depreciation) ?? monthlyDepreciation,
            monthly_depreciation: formulaData?.monthly_depreciation ?? Number(data.monthly_depreciation) ?? monthlyDepreciation,
            accumulated_depreciation: formulaData?.accumulated_depreciation ?? Number(data.accumulated_depreciation) ?? accumulatedDepreciation,
            book_value: formulaData?.book_value ?? Number(data.book_value) ?? bookValue,
            final_value: formulaData?.book_value ?? Number(data.final_value) ?? bookValue,
            status: formulaData?.status ?? data.status ?? currentStatus,
        };
        onSave(payload);
    };

    const isEdit = mode === 'edit';

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="overflow-hidden rounded-md border-slate-200 bg-white shadow-sm">
                <CardContent className="px-5 py-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                                Master Aset <span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                control={control}
                                name="asset_id"
                                rules={{ required: 'Pilih master aset', min: { value: 1, message: 'Pilih master aset' } }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Select
                                            value={field.value ? String(field.value) : ''}
                                            onValueChange={(val) => field.onChange(Number(val))}
                                            disabled={isSaving || isLoadingAssets}
                                        >
                                            <SelectTrigger className="h-11 w-full border-slate-200 bg-white text-sm shadow-sm">
                                                <SelectValue placeholder={isLoadingAssets ? 'Memuat master aset...' : 'Pilih Master Aset'} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72" showSearch searchPlaceholder="Cari master aset...">
                                                {assetsList.map((asset) => (
                                                    <SelectItem key={asset.id} value={String(asset.id)}>
                                                        {asset.code} - {asset.name}
                                                    </SelectItem>
                                                ))}
                                                {field.value &&
                                                    !assetsList.find((a) => String(a.id) === String(field.value)) &&
                                                    initialData?.asset && (
                                                        <SelectItem value={String(field.value)}>
                                                            {initialData.asset.code || initialData.code} -{' '}
                                                            {initialData.asset.name || initialData.name}
                                                        </SelectItem>
                                                    )}
                                            </SelectContent>
                                        </Select>
                                        {fieldState.error && (
                                            <p className="text-xs text-red-500">{fieldState.error.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purchase_date" className="text-sm font-medium text-slate-700">
                                Tanggal Beli <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="purchase_date"
                                    type="date"
                                    {...register('purchase_date', { required: 'Tanggal beli wajib diisi' })}
                                    disabled={isSaving}
                                    className="h-11 border-slate-200 bg-white pl-10 text-sm shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                                Harga Perolehan <span className="text-red-500">*</span>
                            </Label>
                            <Controller
                                control={control}
                                name="price"
                                rules={{ required: 'Harga perolehan wajib diisi', min: { value: 1, message: 'Harga perolehan harus lebih dari 0' } }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <MoneyInput
                                            value={Number(field.value)}
                                            onChangeValue={field.onChange}
                                            placeholder="Masukkan Harga Perolehan"
                                            disabled={isSaving}
                                            className="h-11 border-slate-200 bg-white text-sm shadow-sm"
                                        />
                                        {fieldState.error && (
                                            <p className="text-xs text-red-500">{fieldState.error.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="serial_number" className="text-sm font-medium text-slate-700">
                                Serial Number
                            </Label>
                            <div className="relative">
                                <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    id="serial_number"
                                    placeholder="Masukkan serial number"
                                    {...register('serial_number')}
                                    disabled={isSaving}
                                    className="h-11 border-slate-200 bg-white pl-10 text-sm uppercase shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="economic_age" className="text-sm font-medium text-slate-700">
                                Umur Ekonomis (Tahun) <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="economic_age"
                                    type="number"
                                    min="1"
                                    placeholder="Contoh: 8"
                                    {...register('economic_age', {
                                        valueAsNumber: true,
                                        required: 'Umur ekonomis wajib diisi',
                                        min: { value: 1, message: 'Umur ekonomis minimal 1 tahun' },
                                    })}
                                    disabled={isSaving}
                                    className="h-11 border-slate-200 bg-white pr-16 text-sm shadow-sm"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                    Tahun
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                                Keterangan / Deskripsi
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Masukkan keterangan atau deskripsi aset"
                                {...register('description')}
                                disabled={isSaving}
                                className="min-h-[96px] border-slate-200 bg-white text-sm shadow-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-md border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                    <CardTitle className="text-base text-slate-900">Formula Penyusutan</CardTitle>
                    <CardDescription>Nilai berikut dihitung otomatis berdasarkan data aset.</CardDescription>
                </CardHeader>
                <CardContent className="px-5 py-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="age" className="text-sm font-medium text-slate-700">
                                Umur (Bulan) <span className="ml-1 text-xs font-normal text-[#1e3a5f]">(Auto Formula)</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="age"
                                    type="number"
                                    readOnly
                                    disabled
                                    value={ageMonths || 0}
                                    className="h-11 cursor-not-allowed border-slate-200 bg-slate-50 pr-16 text-sm text-slate-600 shadow-sm"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                    Bulan
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="monthly_depreciation" className="text-sm font-medium text-slate-700">
                                Penyusutan Perbulan <span className="ml-1 text-xs font-normal text-[#1e3a5f]">(Auto Formula)</span>
                            </Label>
                            <MoneyInput
                                id="monthly_depreciation"
                                value={monthlyDepreciation}
                                readOnly
                                disabled
                                onChangeValue={() => { }}
                                placeholder="Rp 0"
                                className="h-11 cursor-not-allowed border-slate-200 bg-slate-50 text-sm text-slate-600 shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="months_used" className="text-sm font-medium text-slate-700">
                                Bulan Terpakai <span className="ml-1 text-xs font-normal text-[#1e3a5f]">(Auto Formula)</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="months_used"
                                    type="number"
                                    readOnly
                                    disabled
                                    value={monthsUsed || 0}
                                    className="h-11 cursor-not-allowed border-slate-200 bg-slate-50 pr-16 text-sm text-slate-600 shadow-sm"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                    Bulan
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="accumulated_depreciation" className="text-sm font-medium text-slate-700">
                                Akumulasi Penyusutan <span className="ml-1 text-xs font-normal text-[#1e3a5f]">(Auto Formula)</span>
                            </Label>
                            <MoneyInput
                                id="accumulated_depreciation"
                                value={accumulatedDepreciation}
                                readOnly
                                disabled
                                onChangeValue={() => { }}
                                placeholder="Rp 0"
                                className="h-11 cursor-not-allowed border-slate-200 bg-slate-50 text-sm text-slate-600 shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="book_value" className="text-sm font-medium text-slate-700">
                                Nilai Buku <span className="ml-1 text-xs font-normal text-[#1e3a5f]">(Auto Formula)</span>
                            </Label>
                            <MoneyInput
                                id="book_value"
                                value={bookValue}
                                readOnly
                                disabled
                                onChangeValue={() => { }}
                                placeholder="Rp 0"
                                className="h-11 cursor-not-allowed border-slate-200 bg-slate-50 text-sm text-slate-600 shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">
                                Status <span className="ml-1 text-xs font-normal text-[#1e3a5f]">(Auto Formula)</span>
                            </Label>
                            <div className="flex h-11 items-center rounded-md border border-slate-200 bg-slate-50 px-3 shadow-sm">
                                <Badge
                                    variant="outline"
                                    className={
                                        currentStatus.toUpperCase() === 'AKTIF'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                                            : 'bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                                    }
                                >
                                    {currentStatus}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    className="h-11 min-w-[120px] rounded-md border-slate-200 bg-white px-8 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Batal
                </Button>
                <Button
                    type="submit"
                    className="flex h-11 min-w-[140px] items-center gap-2 rounded-md px-8 btn-primary!"
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Menyimpan...</span>
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            <span>Simpan</span>
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
