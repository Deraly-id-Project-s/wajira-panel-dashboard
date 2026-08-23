import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Badge } from '@/components/ui/badge';
import type { FinanceAsset } from '@/@types/finance-asset.types';
import { ArrowLeft } from 'lucide-react';

interface FinanceAssetDetailFormProps {
    asset: FinanceAsset;
    onBack: () => void;
}

export function FinanceAssetDetailForm({ asset, onBack }: FinanceAssetDetailFormProps) {
    const ageMonths = asset.age ?? (asset.economic_age ? asset.economic_age * 12 : 0);
    const monthlyDepreciation = asset.monthly_depreciation ?? asset.depreciation_per_month ?? asset.depreciation ?? 0;
    const accumulatedDepreciation = asset.accumulated_depreciation ?? 0;
    const bookValue = asset.book_value ?? asset.final_value ?? 0;
    const status = asset.status || 'AKTIF';
    const isAktif = status.toUpperCase() === 'AKTIF';

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-md">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Detail Informasi Aset Finance</h2>
                        <div className="h-px bg-gray-100 mt-4" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Row 1 */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Kode Aset</Label>
                            <Input
                                value={asset.asset?.code || asset.code || '-'}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Bulan / Tanggal Perolehan</Label>
                            <Input
                                value={
                                    asset.purchase_date
                                        ? new Date(asset.purchase_date).toLocaleDateString('id-ID', {
                                              day: '2-digit',
                                              month: 'long',
                                              year: 'numeric',
                                          })
                                        : '-'
                                }
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Tipe Aset</Label>
                            <Input
                                value={asset.asset?.type || asset.type || '-'}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed capitalize"
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Nama Aset</Label>
                            <Input
                                value={asset.asset?.name || asset.name || '-'}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Serial Number</Label>
                            <Input
                                value={asset.serial_number || '-'}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed uppercase"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Harga Perolehan</Label>
                            <MoneyInput
                                value={asset.price}
                                onChangeValue={() => {}}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
                            />
                        </div>

                        {/* Row 3 */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Umur Ekonomis</Label>
                            <div className="relative">
                                <Input
                                    value={asset.economic_age || 0}
                                    disabled
                                    className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed pr-16"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    Tahun
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Umur (Bulan)</Label>
                            <div className="relative">
                                <Input
                                    value={ageMonths || 0}
                                    disabled
                                    className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed pr-16"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    Bulan
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Penyusutan Perbulan</Label>
                            <MoneyInput
                                value={monthlyDepreciation}
                                onChangeValue={() => {}}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
                            />
                        </div>

                        {/* Row 4 */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Bulan Terpakai</Label>
                            <div className="relative">
                                <Input
                                    value={asset.months_used || 0}
                                    disabled
                                    className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed pr-16"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                    Bulan
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Akumulasi Penyusutan</Label>
                            <MoneyInput
                                value={accumulatedDepreciation}
                                onChangeValue={() => {}}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Nilai Buku</Label>
                            <MoneyInput
                                value={bookValue}
                                onChangeValue={() => {}}
                                disabled
                                className="bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed"
                            />
                        </div>

                        {/* Row 5 */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-900">Status</Label>
                            <div className="flex items-center h-10 px-3 bg-gray-50 border border-gray-200 rounded-md">
                                <Badge
                                    variant="outline"
                                    className={
                                        isAktif
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                                            : 'bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                                    }
                                >
                                    {status}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-sm font-semibold text-gray-900">Keterangan / Deskripsi</Label>
                            <textarea
                                value={asset.description || '-'}
                                disabled
                                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 shadow-sm cursor-not-allowed min-h-[42px] max-h-[80px] resize-none"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <div className="flex items-center justify-center pt-4">
                <Button
                    type="button"
                    onClick={onBack}
                    className="px-8 bg-[#1e3a5f] hover:bg-[#152e4d] text-white flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Button>
            </div>
        </div>
    );
}
