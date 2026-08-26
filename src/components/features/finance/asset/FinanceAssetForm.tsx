import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { FinanceAsset, FinanceAssetPayload } from '@/types/finance-asset.types';
import { useAssets } from '@/hooks/useAsset';
import { useCompany } from '@/contexts/CompanyContext';
import { useFinanceAssetFormula } from '@/hooks/useFinanceAsset';
import { Save, Loader2, Calculator } from 'lucide-react';

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
    const watchedDescription = watch('description');
    const watchedSerialNumber = watch('serial_number');

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
            <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-md">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {isEdit ? 'Detail Informasi Aset Finance' : 'Tambah Aset Finance'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {isEdit
                                    ? 'Perbarui informasi aset finance dan formula penyusutan'
                                    : 'Masukkan detail aset baru untuk menghitung penyusutan otomatis'}
                            </p>
                        </div>
                        {isFetchingFormula && (
                            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Menghitung Formula...</span>
                            </div>
                        )}
                        {!isFetchingFormula && formulaData && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                <Calculator className="h-3.5 w-3.5" />
                                <span>Formula Terhitung</span>
                            </div>
                        )}
                    </div>
                    <div className="h-px bg-gray-100" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Master Aset */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">
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
                                        >
                                            <SelectTrigger className="w-full bg-white border-gray-200">
                                                <SelectValue placeholder={isLoadingAssets ? 'Memuat master aset...' : 'Pilih Master Aset'} />
                                            </SelectTrigger>
                                            <SelectContent>
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

                        {/* Tanggal Beli */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">
                                Tanggal Beli <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="date"
                                {...register('purchase_date', { required: 'Tanggal beli wajib diisi' })}
                                className="border-gray-200 bg-white"
                            />
                        </div>

                        {/* Harga Beli */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">
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
                                            className="bg-white border-gray-200"
                                        />
                                        {fieldState.error && (
                                            <p className="text-xs text-red-500">{fieldState.error.message}</p>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        {/* Serial Number */}
                        <div className="space-y-2">
                            <Label htmlFor="serial_number" className="text-sm font-semibold text-gray-900">
                                Serial Number
                            </Label>
                            <Input
                                id="serial_number"
                                placeholder="Masukkan serial number (opsional)"
                                {...register('serial_number')}
                                className="border-gray-200 bg-white uppercase"
                            />
                        </div>

                        {/* Umur Ekonomis (Tahun) */}
                        <div className="space-y-2">
                            <Label htmlFor="economic_age" className="text-sm font-semibold text-gray-900">
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
                                    className="border-gray-200 pr-16 bg-white"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    Tahun
                                </span>
                            </div>
                        </div>

                        {/* Umur (Bulan) */}
                        <div className="space-y-2">
                            <Label htmlFor="age" className="text-sm font-semibold text-gray-900">
                                Umur (Bulan) <span className="ml-1 text-xs text-blue-500 font-normal">(Auto Formula)</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="age"
                                    type="number"
                                    readOnly
                                    disabled
                                    value={ageMonths || 0}
                                    className="bg-gray-50 border-gray-200 text-gray-600 pr-16 cursor-not-allowed"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    Bulan
                                </span>
                            </div>
                        </div>

                        {/* Penyusutan / Bulan */}
                        <div className="space-y-2">
                            <Label htmlFor="monthly_depreciation" className="text-sm font-semibold text-gray-900">
                                Penyusutan Perbulan <span className="ml-1 text-xs text-blue-500 font-normal">(Auto Formula)</span>
                            </Label>
                            <MoneyInput
                                id="monthly_depreciation"
                                value={monthlyDepreciation}
                                readOnly
                                disabled
                                onChangeValue={() => {}}
                                placeholder="Rp 0"
                                className="bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                            />
                        </div>

                        {/* Bulan Terpakai */}
                        <div className="space-y-2">
                            <Label htmlFor="months_used" className="text-sm font-semibold text-gray-900">
                                Bulan Terpakai <span className="ml-1 text-xs text-blue-500 font-normal">(Auto Formula)</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="months_used"
                                    type="number"
                                    readOnly
                                    disabled
                                    value={monthsUsed || 0}
                                    className="bg-gray-50 border-gray-200 text-gray-600 pr-16 cursor-not-allowed"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    Bulan
                                </span>
                            </div>
                        </div>

                        {/* Akumulasi Penyusutan */}
                        <div className="space-y-2">
                            <Label htmlFor="accumulated_depreciation" className="text-sm font-semibold text-gray-900">
                                Akumulasi Penyusutan <span className="ml-1 text-xs text-blue-500 font-normal">(Auto Formula)</span>
                            </Label>
                            <MoneyInput
                                id="accumulated_depreciation"
                                value={accumulatedDepreciation}
                                readOnly
                                disabled
                                onChangeValue={() => {}}
                                placeholder="Rp 0"
                                className="bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                            />
                        </div>

                        {/* Nilai Buku */}
                        <div className="space-y-2">
                            <Label htmlFor="book_value" className="text-sm font-semibold text-gray-900">
                                Nilai Buku <span className="ml-1 text-xs text-blue-500 font-normal">(Auto Formula)</span>
                            </Label>
                            <MoneyInput
                                id="book_value"
                                value={bookValue}
                                readOnly
                                disabled
                                onChangeValue={() => {}}
                                placeholder="Rp 0"
                                className="bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">
                                Status <span className="ml-1 text-xs text-blue-500 font-normal">(Auto Formula)</span>
                            </Label>
                            <div className="flex items-center h-10 px-3 bg-gray-50 border border-gray-200 rounded-md">
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

                        {/* Deskripsi */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description" className="text-sm font-semibold text-gray-900">
                                Keterangan / Deskripsi
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Masukkan keterangan atau deskripsi aset (opsional)"
                                {...register('description')}
                                className="border-gray-200 bg-white min-h-[90px]"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                    type="button"
                    variant="ghost"
                    className="px-8 text-gray-500 hover:text-gray-700"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    Batal
                </Button>
                <Button
                    type="submit"
                    className="px-8 bg-[#1e3a5f] hover:bg-[#152e4d] flex items-center gap-2"
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
