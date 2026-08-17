import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingState } from '@/components/ui/loading-state';
import { getToken } from '@/lib/auth';

export default function DashboardIndex() {
  const router = useRouter();
  const { companyId, isLoading, setCompanyId, loadCompanies } = useCompany();

  useEffect(() => {
    async function handleRedirect() {
      if (isLoading) return;

      if (!getToken()) {
        router.replace('/login');
        return;
      }

      try {
        const companies = await loadCompanies();
        const company = companies.find((item) => String(item.id) === String(companyId)) || companies[0];

        if (!company) {
          router.replace('/select-company');
          return;
        }

        setCompanyId(String(company.id));
        router.replace(`/dashboard/${company.slug || company.id}`);
      } catch {
        router.replace('/select-company');
      }
    }

    handleRedirect();
  }, [companyId, isLoading, router, setCompanyId, loadCompanies]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <LoadingState variant="page" className="h-screen" />
    </div>
  );
}
