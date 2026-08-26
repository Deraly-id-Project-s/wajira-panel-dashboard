import React from 'react';
import { FinanceAssetForm } from './FinanceAssetForm';
import type { FinanceAssetPayload } from '@/types/finance-asset.types';

export interface FinanceAssetCreateFormProps {
    onSave: (data: FinanceAssetPayload) => void | Promise<void>;
    onCancel: () => void;
    isSaving?: boolean;
}

export function FinanceAssetCreateForm(props: FinanceAssetCreateFormProps) {
    return <FinanceAssetForm mode="create" {...props} />;
}

