import React from 'react';
import { FinanceAssetForm } from './FinanceAssetForm';
import type { FinanceAsset, FinanceAssetPayload } from '@/@types/finance-asset.types';

export interface FinanceAssetEditFormProps {
    initialData: FinanceAsset;
    onSave: (data: Partial<FinanceAssetPayload>) => void | Promise<void>;
    onCancel: () => void;
    isSaving?: boolean;
}

export function FinanceAssetEditForm({ initialData, onSave, onCancel, isSaving = false }: FinanceAssetEditFormProps) {
    return (
        <FinanceAssetForm
            mode="edit"
            initialData={initialData}
            onSave={onSave}
            onCancel={onCancel}
            isSaving={isSaving}
        />
    );
}

