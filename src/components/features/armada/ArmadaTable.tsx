import React, { useMemo } from 'react';
import { MoreVertical, CircleAlert } from 'lucide-react';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Armada } from '@/@types/armada.types';
import { CopyBox } from '@/components/ui/copy-box';
import { Badge } from '@/components/ui/badge';

interface ArmadaTableProps {
  armadas: Armada[];
  isLoading?: boolean;
  onEdit: (armada: Armada) => void;
  onDelete: (armada: Armada) => void;
  onDetail?: (armada: Armada) => void;
  canEdit: boolean;
  canDelete: boolean;
  getRowMark?: (armada: Armada) => 'alert' | 'success' | 'base' | null | undefined;
}

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
};

const getRemainingLabel = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffInMs = date.getTime() - Date.now();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return { text: `${Math.abs(diffInDays)} hari lalu`, className: 'bg-red-50 text-[#DC2626]' };
  }
  if (diffInDays <= 30) {
    return { text: `${diffInDays} hari lagi`, className: 'bg-red-50 text-[#DC2626]' };
  }
  if (diffInDays <= 90) {
    return { text: `${diffInDays} hari lagi`, className: 'bg-amber-50 text-[#F59E0B]' };
  }
  return { text: `${diffInDays} hari lagi`, className: 'bg-green-50 text-[#16A34A]' };
};

const getArmadaTypeBadge = (type?: string | null) => {
  if (!type) return '-';

  const typeLower = type.toLowerCase();
  const displayLabel = type.toUpperCase();

  switch (typeLower) {
    case 'cdd':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold px-2.5 py-0.5">
          {displayLabel}
        </Badge>
      );
    case 'towing':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-2.5 py-0.5">
          {displayLabel}
        </Badge>
      );
    case 'fuso':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-semibold px-2.5 py-0.5">
          {displayLabel}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-semibold px-2.5 py-0.5">
          {displayLabel}
        </Badge>
      );
  }
};

const getArmadaRowMark = (armada: Armada) => {
  const stnkInfo = getRemainingLabel(armada.stnkAge);
  const kirInfo = getRemainingLabel(armada.kirAge);

  const getMarkType = (info: { text: string; className: string } | null) => {
    if (!info) return null;
    if (info.className.includes('red')) return 'alert';
    if (info.className.includes('amber')) return 'base';
    if (info.className.includes('green')) return 'success';
    return null;
  };

  const stnkMark = getMarkType(stnkInfo);
  const kirMark = getMarkType(kirInfo);

  if (stnkMark === 'alert' || kirMark === 'alert') return 'alert';
  if (stnkMark === 'base' || kirMark === 'base') return 'base';
  if (stnkMark === 'success' || kirMark === 'success') return 'success';
  return undefined;
};

export function ArmadaTable({
  armadas,
  isLoading = false,
  onEdit,
  onDelete,
  onDetail,
  canEdit,
  canDelete,
  getRowMark,
}: ArmadaTableProps) {
  const columns = useMemo<ColumnDef<Armada>[]>(
    () => [
      {
        header: 'NO POLISI',
        accessorKey: 'registrationNumber',
        className: 'font-medium text-slate-900 whitespace-nowrap',
        cell: (armada) => armada.registrationNumber ? <CopyBox text={armada.registrationNumber} /> : '-',
      },
      {
        header: 'TIPE',
        accessorKey: 'type',
        className: 'text-slate-700 whitespace-nowrap',
        cell: (armada) => getArmadaTypeBadge(armada.type),
      },
      {
        header: 'NO MESIN',
        accessorKey: 'machineNumber',
        className: 'text-slate-700 font-medium whitespace-nowrap',
        cell: (armada) => armada.machineNumber ? <CopyBox text={armada.machineNumber} /> : '-',
      },
      {
        header: 'NO RANGKA',
        accessorKey: 'chassisNumber',
        className: 'text-slate-700 whitespace-nowrap',
        cell: (armada) => armada.chassisNumber ? <CopyBox text={armada.chassisNumber} /> : '-',
      },
      {
        header: 'MASA STNK',
        alignment: 'center',
        cell: (armada) => {
          const stnkInfo = getRemainingLabel(armada.stnkAge);
          return (
            <div className="whitespace-nowrap">
              <div>{formatDate(armada.stnkAge)}</div>
              {stnkInfo && (
                <div className="mt-1 flex justify-center">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stnkInfo.className}`}>
                    <span>{stnkInfo.text}</span>
                    {stnkInfo.className.includes('red') || stnkInfo.className.includes('amber') ? <CircleAlert className="h-3.5 w-3.5" /> : null}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: 'MASA KIR',
        alignment: 'center',
        cell: (armada) => {
          const kirInfo = getRemainingLabel(armada.kirAge);
          return (
            <div className="whitespace-nowrap">
              <div>{formatDate(armada.kirAge)}</div>
              {kirInfo && (
                <div className="mt-1 flex justify-center">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${kirInfo.className}`}>
                    <span>{kirInfo.text}</span>
                    {kirInfo.className.includes('red') || kirInfo.className.includes('amber') ? <CircleAlert className="h-3.5 w-3.5" /> : null}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: 'Aksi',
        alignment: 'center',
        sticky: 'right',
        cell: (armada) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] rounded-md border-slate-200 p-1.5 shadow-lg">
                {onDetail && (
                  <DropdownMenuItem onClick={() => onDetail(armada)} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                    Detail
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(armada)} disabled={!canEdit} className="rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-slate-50 cursor-pointer">
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(armada)} disabled={!canDelete} className="rounded-lg px-3 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canDelete, canEdit, onDelete, onDetail, onEdit],
  );

  return (
    <BaseTable
      data={armadas}
      columns={columns}
      loading={isLoading}
      getRowMark={getRowMark ?? getArmadaRowMark}
    />
  );
}
