import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplate';

const EMPTY_VALUE = '__none__';

interface DocumentTemplateSelectProps {
  value?: string | number | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
}

export function DocumentTemplateSelect({ value, onValueChange, disabled }: DocumentTemplateSelectProps) {
  const { data, isLoading, isError } = useDocumentTemplates({ page: 1, perPage: 100 });
  const templates = data?.data ?? [];

  return (
    <Select
      value={value == null || value === '' ? EMPTY_VALUE : String(value)}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_VALUE ? null : nextValue)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full bg-white">
        <SelectValue placeholder={isLoading ? 'Memuat template...' : 'Pilih document template'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_VALUE}>Tanpa Document Template</SelectItem>
        {templates.map((template) => (
          <SelectItem key={template.id} value={String(template.id)}>
            {template.name}
          </SelectItem>
        ))}
        {isError && (
          <div className="px-2 py-1.5 text-xs text-destructive">Gagal memuat document template.</div>
        )}
      </SelectContent>
    </Select>
  );
}
