import { Check, FileText, Loader2 } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getObjectStorageUrl } from '@/components/ui/storage-image';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplate';
import { cn } from '@/lib/utils';

const EMPTY_VALUE = '__none__';

export interface DocumentTemplateSelectProps {
  value?: string | number | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  allowEmpty?: boolean;
  placeholder?: string;
  variant?: 'select' | 'cards';
  className?: string;
}

export function DocumentTemplateSelect({
  value,
  onValueChange,
  disabled,
  allowEmpty = true,
  placeholder = 'Pilih document template',
  variant = 'select',
  className,
}: DocumentTemplateSelectProps) {
  const { data, isLoading, isError } = useDocumentTemplates({ page: 1, perPage: 100 });
  const templates = data?.data ?? [];

  if (variant === 'cards') {
    if (isLoading) {
      return (
        <div className={cn('flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-slate-500', className)}>
          <Loader2 className="h-5 w-5 animate-spin" />
          Memuat template dokumen...
        </div>
      );
    }

    if (isError) {
      return (
        <div className={cn('flex min-h-48 items-center justify-center rounded-md border border-dashed border-rose-200 bg-rose-50 px-6 text-center text-sm text-rose-700', className)}>
          Template dokumen gagal dimuat. Tutup modal lalu coba kembali.
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className={cn('flex min-h-48 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500', className)}>
          Belum ada template dokumen yang dapat digunakan.
        </div>
      );
    }

    return (
      <div className={cn('grid gap-3 sm:grid-cols-2', className)} role="radiogroup" aria-label={placeholder}>
        {templates.map((template) => {
          const templateId = String(template.id);
          const isSelected = String(value ?? '') === templateId;
          const previewUrl = getObjectStorageUrl(template.documentTemplate);
          const tableColor = /^#[0-9a-f]{6}$/i.test(template.tableColor) ? template.tableColor : '#1f4163';

          return (
            <button
              key={templateId}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onValueChange(templateId)}
              className={cn(
                'group relative overflow-hidden rounded-md border bg-white text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                isSelected
                  ? 'border-slate-700 ring-1 ring-slate-700'
                  : 'border-slate-200 hover:border-slate-400 hover:shadow-sm',
              )}
            >
              <div className="relative h-28 overflow-hidden border-b border-slate-100 bg-slate-50">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" className="h-full w-full object-cover object-top" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                <span
                  className="absolute bottom-2 left-2 h-3 w-10 rounded-full border border-white/70 shadow-sm"
                  style={{ backgroundColor: tableColor }}
                  aria-hidden="true"
                />
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white shadow">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="truncate text-sm font-semibold text-slate-900">{template.name}</p>
                <p className="truncate text-xs text-slate-500">{template.subject || 'Tanpa subject'}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Select
      value={value == null || value === '' ? (allowEmpty ? EMPTY_VALUE : undefined) : String(value)}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_VALUE ? null : nextValue)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={cn('w-full bg-white', className)}>
        <SelectValue placeholder={isLoading ? 'Memuat template...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && <SelectItem value={EMPTY_VALUE}>Tanpa Document Template</SelectItem>}
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
