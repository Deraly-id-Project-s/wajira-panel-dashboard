import React from 'react';
import type { DoEkspedisi } from '@/@types/do-ekspedisi.types';
import { DOEkspedisiDriverNotes } from './DOEkspedisiDriverNotes';
import { DOEkspedisiExpenses } from './DOEkspedisiExpenses';
import { DOEkspedisiDocumentations } from './DOEkspedisiDocumentations';
import { DOEkspedisiClaims } from './DOEkspedisiClaims';
import { DOEkspedisiClaimApplications } from './DOEkspedisiClaimApplications';

interface DOEkspedisiRelatedDataProps {
  data: DoEkspedisi;
  onRefresh?: () => void;
}

export function DOEkspedisiRelatedData({ data, onRefresh }: DOEkspedisiRelatedDataProps) {
  return (
    <div className="space-y-6">
      <DOEkspedisiDriverNotes data={data} onRefresh={onRefresh} />
      <DOEkspedisiExpenses data={data} onRefresh={onRefresh} />
      <DOEkspedisiDocumentations data={data} onRefresh={onRefresh} />
      <DOEkspedisiClaims data={data} onRefresh={onRefresh} />
      <DOEkspedisiClaimApplications data={data} onRefresh={onRefresh} />
    </div>
  );
}
