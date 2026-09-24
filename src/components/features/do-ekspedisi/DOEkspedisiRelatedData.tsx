import React from 'react';
import { FileText, WalletCards } from 'lucide-react';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { CollapsibleBox } from '@/components/ui/collapsible-box';
import { DOEkspedisiDriverNotes } from './DOEkspedisiDriverNotes';
import { DOEkspedisiExpenses } from './DOEkspedisiExpenses';
import { DOEkspedisiDocumentations } from './DOEkspedisiDocumentations';
import { DOEkspedisiClaims } from './DOEkspedisiClaims';
import { DOEkspedisiClaimApplications } from './DOEkspedisiClaimApplications';
import { DOEkspedisiCashAdvanceClaims } from './DOEkspedisiCashAdvanceClaims';

interface DOEkspedisiRelatedDataProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

export function DOEkspedisiRelatedData({ data, onRefresh }: DOEkspedisiRelatedDataProps) {
  return (
    <div className="space-y-6">
      <CollapsibleBox
        title="Data Ekspedisi"
        description="Catatan driver, biaya tambahan, dokumentasi foto, dan claim ekspedisi"
        icon={FileText}
        defaultExpanded
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="min-w-0 [&>section]:h-full">
              <DOEkspedisiDriverNotes data={data} onRefresh={onRefresh} />
            </div>
            <div className="min-w-0 [&>section]:h-full">
              <DOEkspedisiExpenses data={data} onRefresh={onRefresh} />
            </div>
          </div>
          <DOEkspedisiClaims data={data} onRefresh={onRefresh} />
          <DOEkspedisiDocumentations data={data} />
        </div>
      </CollapsibleBox>

      <CollapsibleBox
        title="Potongan Uang Jalan"
        description="Rincian potongan claim DO dan potongan kas bon driver pada uang jalan"
        icon={WalletCards}
        defaultExpanded
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DOEkspedisiClaimApplications data={data} onRefresh={onRefresh} />
          <DOEkspedisiCashAdvanceClaims data={data} onRefresh={onRefresh} />
        </div>
      </CollapsibleBox>
    </div>
  );
}
