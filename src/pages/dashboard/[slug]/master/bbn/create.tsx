import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BBNForm } from '@/components/features/bbn/BBNForm';
import { useCreateBBN } from '@/hooks/useBBN';
import type { BBNPayload } from '@/types/bbn.types';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/lib/utils/apiErrorHandler';

export default function CreateBBNPage() {
    const router = useRouter();
    const slug = router.query.slug as string;
    const createMutation = useCreateBBN();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (data: BBNPayload) => {
        setIsSubmitting(true);
        try {
            await createMutation.mutateAsync(data);
            toast.success('Data biaya berhasil ditambahkan');
            router.push(`/dashboard/${slug}/master/bbn`);
        } catch (error) {
            toast.error(getApiErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <BBNForm 
                title="Tambah Data Biaya" 
                onSubmit={handleSubmit} 
                isSubmitting={isSubmitting} 
            />
        </DashboardLayout>
    );
}
