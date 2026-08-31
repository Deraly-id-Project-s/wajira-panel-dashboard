import { useQuery } from '@tanstack/react-query';
import { liabilityService } from '@/services/liability.service';
import { useCompany } from '@/contexts/CompanyContext';
import { companyQueryKeys } from '@/lib/query/company-key';

type DataPiutangListOptions = {
  page?: number;
  perPage?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
};

export const useDataPiutang = (options: DataPiutangListOptions = {}) => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: companyId ? companyQueryKeys.list(companyId, 'data-piutang-list', options) : ['data-piutang-list', 'unscoped', options],
    queryFn: () => liabilityService.getAllReceivables({ company_id: companyId ?? undefined, page: options.page, per_page: options.perPage, search: options.search, start_date: options.start_date, end_date: options.end_date }),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previous) => previous,
    enabled: Boolean(companyId),
  });
};
