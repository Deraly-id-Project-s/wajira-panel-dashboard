import { StockStatus } from '@/@types/stock-unit.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StockUnitFilterTabsProps {
  active: StockStatus | 'all';
  onChange: (value: StockStatus | 'all') => void;
}

export default function StockUnitFilterDropdown({ active, onChange }: StockUnitFilterTabsProps) {
  return (
    <Select value={active} onValueChange={(value) => onChange(value as StockStatus | 'all')}>
      <SelectTrigger className="h-10 w-[200px] border-gray-300 bg-white text-gray-900 rounded-md shadow-sm">
        <SelectValue placeholder="Semua Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua Status</SelectItem>
        <SelectItem value="inbound_receipt">Available</SelectItem>
        <SelectItem value="inbound_incoming_goods">On Delivery</SelectItem>
        <SelectItem value="outbound_delivered">Out/Archived</SelectItem>
      </SelectContent>
    </Select>
  );
}