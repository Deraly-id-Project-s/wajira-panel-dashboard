import { FormDialog } from '@/components/ui/form-dialog';
import { Form } from '@/components/ui/form';
import { AccountGroupForm } from './AccountGroupForm';
import type { AccountGroupFormValues } from '@/scheme/account-group.schema';
import type { UseFormReturn } from 'react-hook-form';

interface AccountGroupFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: UseFormReturn<AccountGroupFormValues>;
    onSubmit: (values: AccountGroupFormValues) => void;
    title: string;
    description: string;
    isSubmitting?: boolean;
    submitLabel?: string;
}

export const AccountGroupFormModal = ({
    open,
    onOpenChange,
    form,
    onSubmit,
    title,
    description,
    isSubmitting = false,
    submitLabel = 'Simpan',
}: AccountGroupFormModalProps) => {
    return (
        <Form {...form}>
            <FormDialog
                open={open}
                onOpenChange={onOpenChange}
                title={title}
                description={description}
                onSubmit={form.handleSubmit(onSubmit)}
                submitLabel={submitLabel}
                isSubmitting={isSubmitting}
            >
                <AccountGroupForm form={form} />
            </FormDialog>
        </Form>
    );
};
