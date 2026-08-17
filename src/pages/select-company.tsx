import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { Card } from '@/components/ui/card';
import { Company } from '@/services/company.service';
import { getToken } from '@/lib/auth';
import { useCompany } from '@/contexts/CompanyContext';

export default function SelectCompanyPage() {
  const router = useRouter();
  const {
    companies,
    companyAccessStatus,
    companyAccessError,
    setCompanyId,
    loadCompanies,
  } = useCompany();

  // ===== TOKEN GUARD =====
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    void loadCompanies().catch(() => undefined);
  }, [router, loadCompanies]);

  function handleSelect(company: Company) {
    setCompanyId(String(company.id));
    if (company.slug) {
      router.push(`/dashboard/${company.slug}`);
    } else {
      // Fallback
      router.push(`/dashboard`);
    }
  }

  if (companyAccessStatus === 'idle' || companyAccessStatus === 'loading') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F6F8] px-4 font-sans">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
      </div>
    );
  }

  if (companyAccessStatus === 'error') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F6F8] px-4 font-sans">
        <Card className="w-full max-w-[420px] bg-white p-8 text-center space-y-4">
          <p className="text-sm text-red-600 font-medium">
            {companyAccessError || 'Gagal memuat perusahaan'}
          </p>
          <button
            onClick={() => void loadCompanies({ forceRefresh: true }).catch(() => undefined)}
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Coba lagi
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F6F8] px-4 font-sans">
      {/* ===== RIGHT SIDE AURORA GRADIENT ONLY ===== */}
      <div
        className="
          absolute
          top-0
          right-0
          h-full
          w-0
          md:w-[65%]
          z-0
          pointer-events-none
          bg-[radial-gradient(circle_at_85%_10%,#f64c0e_0%,#f47233_20%,#f08d5c_35%,#a85f71_55%,transparent_70%),radial-gradient(circle_at_80%_90%,#64a5db_0%,#7993c4_25%,#5a6d9f_45%,#4c6697_65%,transparent_75%)]
          [mask-image:linear-gradient(to_left,black_70%,transparent_100%)]
        "
      />

      {/* ===== CONTENT CARD ===== */}
      <div className="relative z-10 w-full max-w-[480px]">
        <Card className="w-full bg-white border border-[rgba(0,0,0,0.06)] shadow-[0px_10px_30px_rgba(0,0,0,0.08)] rounded-md p-8">
          {/* LOGO */}
          <div className="flex justify-center mb-8">
            <div className="relative w-[100px] h-[100px]">
              <Image src="/wajira-logo.png" alt="Wajira Logo" fill className="object-contain drop-shadow-sm" priority />
            </div>
          </div>

          {/* HEADER TEXT */}
          <div className="text-center mb-8">
            <p className="text-[#6B7280] text-sm font-medium tracking-wide">Pilih salah satu perusahaan di bawah ini</p>
          </div>

          {/* COMPANY LIST */}
          <div className="space-y-3">
            {companies.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500">
                Akun Anda belum memiliki akses ke perusahaan mana pun.
              </p>
            )}
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelect(company)}
                className="
                  group
                  w-full
                  flex
                  items-center
                  justify-between
                  bg-[#F9FAFB]
                  hover:bg-[#F3F4F6]
                  border
                  border-[#E5E7EB]
                  rounded-md
                  px-4
                  py-4
                  transition-all
                  duration-300
                  ease-in-out
                  cursor-pointer
                  hover:shadow-sm
                "
              >
                <span className="text-[#111827] text-[15px] font-medium group-hover:text-black transition-colors uppercase">{company.name}</span>

                {/* Arrow Icon */}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#9CA3AF] group-hover:text-[#6B7280] transform group-hover:translate-x-1 transition-all duration-300">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>

          {/* FOOTER */}
          <div className="mt-8 text-center">
            <p className="text-[#9CA3AF] text-xs">&copy; {new Date().getFullYear()} Wajira Dashboard. All rights reserved.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
