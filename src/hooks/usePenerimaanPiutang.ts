import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { liabilityService } from '@/services/liability.service';
import type { CreatePenerimaanPiutangPaymentPayload } from '@/@types/penerimaan-piutang.types';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';

type PenerimaanPiutangListOptions = {
    page?: number;
    perPage?: number;
    search?: string;
    start_date?: string;
    end_date?: string;
};

export const usePenerimaanPiutang = (options: PenerimaanPiutangListOptions = {}) => {
    const { companyId } = useCompany();

    return useQuery({
        queryKey: companyId ? companyQueryKeys.list(companyId, 'sales-liability-list', options) : ['sales-liability-list', 'unscoped', options],
        queryFn: () => liabilityService.getList({ type: 'sales', company_id: companyId ?? undefined, page: options.page, per_page: options.perPage, search: options.search, start_date: options.start_date, end_date: options.end_date }),
        staleTime: 1000 * 60 * 5,
        placeholderData: (previous) => previous,
        enabled: Boolean(companyId),
    });
};

export const useDeletePenerimaanPiutang = () => {
    const queryClient = useQueryClient();
    const { companyId } = useCompany();

    return useMutation({
        mutationFn: (id: number) => liabilityService.delete(id),
        onSuccess: () => {
            if (companyId) {
                queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
                return;
            }

            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && (query.queryKey.includes('sales-liability-list') || query.queryKey.includes('sales-liability-detail')),
            });
        },
    });
};

export const useCreatePenerimaanPiutangPayment = () => {
    const queryClient = useQueryClient();
    const { companyId } = useCompany();

    return useMutation({
        mutationFn: (payload: CreatePenerimaanPiutangPaymentPayload | FormData) => liabilityService.createPayment(payload),
        onSuccess: () => {
            if (companyId) {
                queryClient.invalidateQueries({ queryKey: companyQueryKeys.companyScope(companyId) });
                return;
            }

            queryClient.invalidateQueries({
                predicate: (query) => Array.isArray(query.queryKey) && (query.queryKey.includes('sales-liability-list') || query.queryKey.includes('sales-liability-detail')),
            });
        },
    });
};
