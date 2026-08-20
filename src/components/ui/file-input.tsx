import React from 'react';
import { Input } from '@/components/ui/input';

interface FileInputProps extends Omit<React.ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> {
  value?: File | null;
  onFileChange: (file: File | null) => void;
}

/** File input ringan yang mengikuti pola input file pada modal import. */
export function FileInput({ value, onFileChange, id, ...props }: FileInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!value && inputRef.current) inputRef.current.value = '';
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Input
        {...props}
        id={id}
        ref={inputRef}
        type="file"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      {value ? <p className="text-xs text-slate-500">File dipilih: {value.name}</p> : null}
    </div>
  );
}
