import React from 'react';
import type { ColumnDef } from '@/components/ui/base-table';
import { ReferenceLink } from '@/components/ui/reference-link';

export type PersonReferenceData =
  | {
      id?: number | string;
      name?: string;
      type?: string;
    }
  | string
  | null
  | undefined;

export function getPersonName(person: PersonReferenceData): string | null {
  if (!person) return null;
  if (typeof person === 'string') {
    const trimmed = person.trim();
    return trimmed && trimmed !== '-' ? trimmed : null;
  }
  const name = person.name?.trim();
  return name && name !== '-' ? name : null;
}

export function PersonReferenceCell({
  person,
  type,
  slug,
}: {
  person: PersonReferenceData;
  type: 'customer' | 'supplier';
  slug: string;
}) {
  const name = getPersonName(person);
  if (!name) return <span>-</span>;

  const href = `/dashboard/${slug}/master/${type}?search=${encodeURIComponent(name)}`;
  return (
    <ReferenceLink target="_blank" href={href}>
      {name}
    </ReferenceLink>
  );
}

export const createSupplierColumn = <T extends Record<string, any>>(slug: string): ColumnDef<T> => ({
  header: 'Supplier',
  accessorKey: 'supplier.name',
  sortable: true,
  cell: (item: T) => {
    const person = item.supplier ?? (item.person?.type === 'supplier' ? item.person : null) ?? item.supplier_name;
    return <PersonReferenceCell person={person} type="supplier" slug={slug} />;
  },
});

export const createCustomerColumn = <T extends Record<string, any>>(slug: string): ColumnDef<T> => ({
  header: 'Customer',
  accessorKey: 'customer.name',
  sortable: true,
  cell: (item: T) => {
    const person = item.customer ?? (item.person?.type === 'customer' ? item.person : null) ?? item.customer_name;
    return <PersonReferenceCell person={person} type="customer" slug={slug} />;
  },
});
