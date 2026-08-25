import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/features/vehicle-data/SearchableSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useDealers } from '@/hooks/useDealer';
import { useRegions } from '@/hooks/useRegion';
import { useCompany } from '@/contexts/CompanyContext';
import type { BBNPayload, BBN } from '@/@types/bbn.types';

export interface BBNFormData {
    dealerId: string;
    regionId: string;
    tnbkCode: string;
    vehicleType: string;
    unNoticeFee: number;
    garwilFee: number;
    countershopFee: number;
    otherFee: number;
}

interface BBNFormProps {
    initialData?: BBN;
    onSubmit: (data: BBNPayload) => void;
    isSubmitting: boolean;
    title: string;
}

export function BBNForm({ initialData, onSubmit, isSubmitting, title }: BBNFormProps) {
    const router = useRouter();
    const [dealerSearch, setDealerSearch] = React.useState('');
    const [regionSearch, setRegionSearch] = React.useState('');

    const { companyId: localCompanyId } = useCompany();
    const { data: dealersResponse } = useDealers(localCompanyId ? String(localCompanyId) : null, { page: 1, perPage: 200, search: dealerSearch });
    const { data: regionsResponse } = useRegions({ page: 1, perPage: 200, search: regionSearch });
    const dealers = (dealersResponse as any)?.data || [];
    const regions = (regionsResponse as any)?.data || [];

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<BBNFormData>({
        defaultValues: {
            dealerId: '',
            regionId: '',
            tnbkCode: '',
            vehicleType: '',
            unNoticeFee: 0,
            garwilFee: 0,
            countershopFee: 0,
            otherFee: 0,
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                dealerId: String(initialData.dealerId),
                regionId: String(initialData.regionId),
                tnbkCode: initialData.tnbkCode,
                vehicleType: initialData.vehicleType,
                unNoticeFee: Number(initialData.unNoticeFee) || 0,
                garwilFee: Number(initialData.garwilFee) || 0,
                countershopFee: Number(initialData.countershopFee) || 0,
                otherFee: Number(initialData.otherFee) || 0,
            });
        }
    }, [initialData, reset]);

    const handleFormSubmit = (data: BBNFormData) => {
        onSubmit({
            dealerId: Number(data.dealerId),
            regionId: Number(data.regionId),
            tnbkCode: data.tnbkCode.trim().toUpperCase(),
            vehicleType: data.vehicleType,
            unNoticeFee: data.unNoticeFee,
            garwilFee: data.garwilFee,
            countershopFee: data.countershopFee,
            otherFee: data.otherFee,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header Form */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="h-10 w-10 rounded-md border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">

                    {/* Section: Informasi Biaya */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">Informasi Biaya</h2>

                        <div className="bg-gray-50/50 rounded-lg p-6 border border-gray-100 space-y-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4">Detail</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2 lg:col-span-3">
                                    <Label htmlFor="dealerId" className="text-gray-900 font-medium">Nama Dealer</Label>
                                    <Controller
                                        name="dealerId"
                                        control={control}
                                        rules={{ required: 'Dealer wajib dipilih' }}
                                        render={({ field }) => (
                                            <SearchableSelect
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={dealers.map((dealer: any) => ({
                                                    value: String(dealer.id),
                                                    label: dealer.namaDealer || dealer.name,
                                                    subtitle: dealer.code || undefined,
                                                }))}
                                                loading={!dealersResponse}
                                                onSearchChange={setDealerSearch}
                                                placeholder="Masukkan nama dealer"
                                                searchPlaceholder="Cari dealer..."
                                                emptyText="Dealer tidak ditemukan."
                                                className={errors.dealerId ? 'border-red-500' : ''}
                                            />
                                        )}
                                    />
                                    {errors.dealerId && <p className="text-red-500 text-xs">{errors.dealerId.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tnbkCode" className="text-gray-900 font-medium">Kode TNBK</Label>
                                    <Input
                                        id="tnbkCode"
                                        placeholder="Masukkan kode TNBK"
                                        {...register('tnbkCode', {
                                            required: 'Kode TNBK wajib diisi',
                                            setValueAs: (value) => String(value ?? '').trim().toUpperCase(),
                                            validate: (value) => value.trim().length > 0 || 'Kode TNBK wajib diisi',
                                            maxLength: {
                                                value: 10,
                                                message: 'Kode TNBK maksimal 10 karakter',
                                            },
                                        })}
                                        className={errors.tnbkCode ? 'border-red-500 bg-white' : 'bg-white'}
                                        autoCapitalize="characters"
                                    />
                                    {errors.tnbkCode && <p className="text-red-500 text-xs">{errors.tnbkCode.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="regionId" className="text-gray-900 font-medium">Nama Wilayah</Label>
                                    <Controller
                                        name="regionId"
                                        control={control}
                                        rules={{ required: 'Wilayah wajib dipilih' }}
                                        render={({ field }) => (
                                            <SearchableSelect
                                                value={field.value}
                                                onChange={field.onChange}
                                                options={regions.map((region: any) => ({
                                                    value: String(region.id),
                                                    label: region.name,
                                                    subtitle: region.code || undefined,
                                                }))}
                                                loading={!regionsResponse}
                                                onSearchChange={setRegionSearch}
                                                placeholder="Masukkan nama wilayah"
                                                searchPlaceholder="Cari wilayah..."
                                                emptyText="Wilayah tidak ditemukan."
                                                className={errors.regionId ? 'border-red-500' : ''}
                                            />
                                        )}
                                    />
                                    {errors.regionId && <p className="text-red-500 text-xs">{errors.regionId.message}</p>}
                                </div>

                                <div className="space-y-2 flex flex-col">
                                    <Label htmlFor="vehicleType" className="text-gray-900 font-medium">Jenis</Label>
                                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                        <div className="w-full">
                                            <Controller
                                                name="vehicleType"
                                                control={control}
                                                rules={{ required: 'Jenis wajib dipilih' }}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                        <SelectTrigger className={`bg-white w-full ${errors.vehicleType ? 'border-red-500' : ''}`}>
                                                            <SelectValue placeholder="Select an item" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="r2">R2</SelectItem>
                                                            <SelectItem value="r3">R3</SelectItem>
                                                            <SelectItem value="r4">R4</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <Button type="button" title="Tambah Jenis (Not implemented)" className="button-theme-1!">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {errors.vehicleType && <p className="text-red-500 text-xs">{errors.vehicleType.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Biaya */}
                    <div className="bg-gray-50/50 rounded-lg p-6 border border-gray-100 space-y-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Biaya</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="unNoticeFee" className="text-gray-900 font-medium">UN Notice</Label>
                                <Controller
                                    name="unNoticeFee"
                                    control={control}
                                    rules={{ required: 'Jumlah wajib diisi', min: { value: 0, message: 'Jumlah tidak boleh negatif' } }}
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="unNoticeFee"
                                            placeholder="Tambahkan jumlah"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className={`bg-white ${errors.unNoticeFee ? 'border-red-500' : ''}`}
                                        />
                                    )}
                                />
                                {errors.unNoticeFee && <p className="text-red-500 text-xs">{errors.unNoticeFee.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="garwilFee" className="text-gray-900 font-medium">Garwil</Label>
                                <Controller
                                    name="garwilFee"
                                    control={control}
                                    rules={{ required: 'Jumlah wajib diisi', min: { value: 0, message: 'Jumlah tidak boleh negatif' } }}
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="garwilFee"
                                            placeholder="Tambahkan jumlah"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className={`bg-white ${errors.garwilFee ? 'border-red-500' : ''}`}
                                        />
                                    )}
                                />
                                {errors.garwilFee && <p className="text-red-500 text-xs">{errors.garwilFee.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="countershopFee" className="text-gray-900 font-medium">Biro/Loket</Label>
                                <Controller
                                    name="countershopFee"
                                    control={control}
                                    rules={{ required: 'Jumlah wajib diisi', min: { value: 0, message: 'Jumlah tidak boleh negatif' } }}
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="countershopFee"
                                            placeholder="Tambahkan jumlah"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className={`bg-white ${errors.countershopFee ? 'border-red-500' : ''}`}
                                        />
                                    )}
                                />
                                {errors.countershopFee && <p className="text-red-500 text-xs">{errors.countershopFee.message}</p>}
                            </div>

                            <div className="space-y-2 lg:col-span-3">
                                <Label htmlFor="otherFee" className="text-gray-900 font-medium">Biaya Lainnya</Label>
                                <Controller
                                    name="otherFee"
                                    control={control}
                                    rules={{ required: 'Jumlah wajib diisi', min: { value: 0, message: 'Jumlah tidak boleh negatif' } }}
                                    render={({ field }) => (
                                        <MoneyInput
                                            id="otherFee"
                                            placeholder="Tambahkan jumlah"
                                            value={field.value}
                                            onChangeValue={field.onChange}
                                            className={`bg-white md:max-w-md ${errors.otherFee ? 'border-red-500' : ''}`}
                                        />
                                    )}
                                />
                                {errors.otherFee && <p className="text-red-500 text-xs">{errors.otherFee.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center items-center gap-4 pt-6 pb-8">
                        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[120px] button-theme-1!">
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>

                </form>
            </Card>
        </div>
    );
}

// Simple Plus icon to render beside Jenis select as seen in mockup
function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
