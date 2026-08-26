import { useState, useMemo } from 'react';
import { Kas } from '@/types/kas.types';
import { CopyBox } from '@/components/ui/copy-box';
import { currenciesFormat } from '@/components/ui/currenciesFormat';
import BaseTable, { ColumnDef } from '@/components/ui/base-table';
import { Badge } from '@/components/ui/badge';

const KAS_NAME_MAP: Record<string, string> = {
  bca_usd: 'BANK BCA USD',
  bca_idr: 'BANK BCA IDR',
  cash_idr: 'CASH IDR',
};

const getKasName = (code: string) => {
  const key = code.trim().toLowerCase();
  if (key in KAS_NAME_MAP) return KAS_NAME_MAP[key];
  return code.replace(/_/g, ' ').toUpperCase();
};

interface Props {
  data: Kas[];
}

export function KasTable({ data }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'code', direction: 'asc' });

  const enrichedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      name: getKasName(item.code),
    }));
  }, [data]);

  const filteredData = useMemo(() => {
    if (!search) return enrichedData;
    const lower = search.toLowerCase();
    return enrichedData.filter(
      (item) =>
        item.code.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower)
    );
  }, [enrichedData, search]);

  const sortedData = useMemo(() => {
    const { key, direction } = sortState;
    if (!key) return filteredData;
    const factor = direction === 'asc' ? 1 : -1;

    return [...filteredData].sort((a: any, b: any) => {
      const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };

      const valA = getValue(a, key);
      const valB = getValue(b, key);

      if (valA === undefined || valA === null) return 1 * factor;
      if (valB === undefined || valB === null) return -1 * factor;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * factor;
      }

      const dateA = new Date(valA).getTime();
      const dateB = new Date(valB).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && typeof valA === 'string' && valA.includes('-')) {
        return (dateA - dateB) * factor;
      }

      return String(valA).localeCompare(String(valB)) * factor;
    });
  }, [filteredData, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = useMemo(() => {
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, startIndex, itemsPerPage]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: 'Kode Kas',
        accessorKey: 'code',
        sortable: true,
        alignment: 'left',
        cell: (item) => <CopyBox text={item.code} />,
      },
      {
        header: 'Nama',
        accessorKey: 'name',
        sortable: true,
        alignment: 'left',
      },
      {
        header: 'Deskripsi',
        accessorKey: 'description',
        sortable: true,
        alignment: 'left',
        cell: (item) => item.description || '-',
      },
      {
        header: 'Jumlah Nominal',
        accessorKey: 'amount',
        sortable: true,
        alignment: 'left',
        cell: (item) =>
          item.code === 'bca_usd'
            ? currenciesFormat('usd', item.amount ? Number(item.amount) : 0)
            : currenciesFormat('idr', item.amount ? Number(item.amount) : 0),
      },
      {
        header: 'Jenis',
        accessorKey: 'type',
        sortable: true,
        alignment: 'left',
        cell: (item) => (
          item.type === 'cash' ? (
            <Badge variant={'default'}>Cash</Badge>) : (
            <Badge variant={'secondary'}>Bank</Badge>)
        )
      }
    ],
    []
  );

  return (
    <BaseTable
      data={currentData}
      columns={columns}
      search={search}
      onSearchChange={(val) => {
        setSearch(val);
        setCurrentPage(1);
      }}
      showLimitChange
      perPage={itemsPerPage}
      onPerPageChange={(val) => {
        setItemsPerPage(val);
        setCurrentPage(1);
      }}
      meta={{
        currentPage: currentPage,
        perPage: itemsPerPage,
        lastPage: totalPages,
        total: filteredData.length,
      }}
      onPageChange={setCurrentPage}
      sortBy={sortState.key}
      sortDirection={sortState.direction}
      onSortChange={(key, direction) => setSortState({ key, direction })}
    />
  );
}
