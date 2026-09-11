import React from 'react';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0 [&>section]:h-full">
          <DOEkspedisiDriverNotes data={data} onRefresh={onRefresh} />
        </div>
        <div className="min-w-0 [&>section]:h-full">
          <DOEkspedisiExpenses data={data} onRefresh={onRefresh} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0 [&>section]:h-full">
          <DOEkspedisiDocumentations data={data} onRefresh={onRefresh} />
        </div>
        <div className="min-w-0 [&>section]:h-full">
          <DOEkspedisiClaims data={data} onRefresh={onRefresh} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DOEkspedisiClaimApplications data={data} onRefresh={onRefresh} />
        <DOEkspedisiCashAdvanceClaims data={data} onRefresh={onRefresh} />
      </div>
    </div>
  );
}
