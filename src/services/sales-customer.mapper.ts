import { Customer } from '@/types/customer.types';

export type SalesCustomerOption = {
  label: string;
  value: string;
  keyword: string;
  name: string;
  code: string;
};

export type SalesCreateCustomerDetail = {
  customerId: string;
  alamat: string;
  npwp: string;
};

export const mapCustomerToSalesOption = (item: Customer): SalesCustomerOption => {
  const code = item.code ?? '-';
  const name = item.name ?? '-';
  return {
    label: `${code} - ${name}`,
    value: String(item.id),
    keyword: `${code} ${name}`.toLowerCase(),
    name,
    code,
  };
};

export const mapCustomerDetailToSalesForm = (item: Customer): SalesCreateCustomerDetail => ({
  customerId: String(item.id ?? ''),
  alamat: item.address ?? '',
  npwp: item.npwp ?? '',
});
