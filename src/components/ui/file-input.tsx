import React from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: File | null;
  onFileChange: (file: File | null) => void;
  helperText?: string;
}

/** File input yang memiliki style drag & click box premium (seperti uploader avatar profile) */
export function FileInput({
  value,
  onFileChange,
  id,
  className,
  disabled,
  accept,
  required,
  helperText = 'Format PNG, JPG maksimal 2MB',
  ...props
}: FileInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!value && inputRef.current) inputRef.current.value = '';
  }, [value]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileChange(file);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <input
        {...props}
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        required={required}
        disabled={disabled}
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-5 py-5 text-center hover:bg-slate-100/70 transition disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          value && "border-solid border-[#1e3a5f]/20 bg-[#1e3a5f]/5"
        )}
      >
        <Upload className="mb-2 h-6 w-6 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">
          {value ? value.name : 'Klik untuk upload gambar'}
        </span>
        <span className="mt-1 text-xs text-slate-400">
          {helperText}
        </span>
      </button>
    </div>
  );
}
