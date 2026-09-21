'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { format, isValid } from 'date-fns';

interface Props {
  data: {
    noPenerimaan: string;
    tanggal: Date | string | undefined;
    supplier?: string;
    keterangan?: string;
  };
  onChange?: (field: string, value: any) => void;
  onBlur?: (field: string, value: any) => void;
  disabled?: boolean;
  mode?: 'create' | 'edit';
}

// Reusable Inline Edit Component
function InlineEditField({
  value,
  displayValue,
  onSave,
  disabled,
  renderInput,
}: {
  value: any;
  displayValue: React.ReactNode;
  onSave: (val: any) => void;
  disabled?: boolean;
  renderInput: (props: { onBlur: () => void; autoFocus: boolean }) => React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    setIsEditing(false);
    onSave(value);
  };

  if (disabled) {
    return <div className="py-2 text-gray-700 min-h-[40px] px-3 bg-gray-50/50 rounded-md border border-transparent">{displayValue}</div>;
  }

  if (isEditing) {
    return <div className="relative animate-in fade-in zoom-in-95 duration-200">{renderInput({ onBlur: handleBlur, autoFocus: true })}</div>;
  }

  return (
    <div onDoubleClick={() => setIsEditing(true)} className="py-2 px-3 min-h-[40px] text-gray-700 rounded-md border border-transparent hover:border-gray-200 hover:bg-gray-50/50 cursor-text transition-colors" title="Double click to edit">
      {displayValue || <span className="text-gray-400 italic">Empty - double click to add</span>}
    </div>
  );
}

export default function PenerimaanUnitHeaderCard({ data, onChange, onBlur, disabled, mode = 'edit' }: Props) {
  const isCreate = mode === 'create';

  // Normalize date
  const parsedDate = typeof data.tanggal === 'string' ? new Date(data.tanggal) : data.tanggal;

  const handleSave = (field: string) => {
    if (onBlur) {
      onBlur(field, data[field as keyof typeof data]);
    }
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Informasi Penerimaan</h2>
        {!disabled && !isCreate && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Double-click fields to edit</span>}
      </div>
      <hr className="border-gray-100" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[15px]">
        <div className="space-y-1">
          <label className={isCreate ? 'text-gray-900 font-medium tracking-tight' : 'text-black font-bold text-xs uppercase tracking-wider'}>No Pemesanan</label>
          {isCreate ? (
            <Input value={data.noPenerimaan} disabled={true} readOnly className="bg-gray-50 text-gray-500 rounded-md h-10 border-gray-200" />
          ) : (
            <InlineEditField value={data.noPenerimaan} displayValue={<span className="font-semibold">{data.noPenerimaan}</span>} onSave={() => { }} disabled={true} renderInput={() => null} />
          )}
        </div>

        <div className="space-y-1">
          <label className={isCreate ? 'text-gray-900 font-medium tracking-tight' : 'text-black font-bold text-xs uppercase tracking-wider'}>Tanggal Terima</label>
          {isCreate ? (
            <DatePicker value={parsedDate} onChange={(date) => onChange?.('tanggal', date)} disabled={disabled} placeholder="Pick a date" className="h-10 rounded-md border-gray-200 text-gray-900" />
          ) : (
            <InlineEditField
              value={parsedDate}
              displayValue={parsedDate && isValid(parsedDate) ? format(parsedDate, 'd MMMM yyyy') : ''}
              onSave={() => handleSave('tanggal')}
              disabled={disabled}
              renderInput={({ onBlur: closeEditor }) => (
                <DatePicker
                  value={parsedDate}
                  onChange={(date) => {
                    onChange?.('tanggal', date);
                    setTimeout(() => {
                      if (onBlur) onBlur('tanggal', date);
                      closeEditor();
                    }, 100);
                  }}
                  disabled={disabled}
                  className="h-10 rounded-md border-blue-500 ring-2 ring-blue-500/20 text-gray-900 shadow-sm"
                />
              )}
            />
          )}
        </div>

        <div className="space-y-1">
          <label className={isCreate ? 'text-gray-900 font-medium tracking-tight' : 'text-black font-bold text text-xs uppercase tracking-wider'}>Supplier</label>
          {isCreate ? (
            <Input value={data.supplier || ''} disabled={disabled} onChange={(e) => onChange?.('supplier', e.target.value)} placeholder="Masukkan nama supplier" className="bg-white text-gray-900 rounded-md h-10 border-gray-200" />
          ) : (
            <InlineEditField
              value={data.supplier}
              displayValue={data.supplier}
              onSave={() => handleSave('supplier')}
              disabled={disabled}
              renderInput={({ onBlur, autoFocus }) => (
                <Input
                  autoFocus={autoFocus}
                  value={data.supplier || ''}
                  onChange={(e) => onChange?.('supplier', e.target.value)}
                  onBlur={onBlur}
                  onKeyDown={(e) => e.key === 'Enter' && onBlur()}
                  className="bg-white text-gray-900 rounded-md h-10 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                />
              )}
            />
          )}
        </div>
      </div>

      <div className={isCreate ? 'space-y-2 text-sm mt-4' : 'space-y-1 text-[15px] mt-2'}>
        <label className={isCreate ? 'text-gray-900 font-medium tracking-tight' : 'text-black font-bold text text-xs uppercase tracking-wider'}>Keterangan</label>
        {isCreate ? (
          <Textarea
            value={data.keterangan || ''}
            disabled={disabled}
            onChange={(e) => onChange?.('keterangan', e.target.value)}
            placeholder="Type your message here."
            className="bg-white text-gray-900 rounded-md min-h-[100px] border-gray-200 resize-y"
          />
        ) : (
          <InlineEditField
            value={data.keterangan}
            displayValue={<div className="whitespace-pre-wrap">{data.keterangan}</div>}
            onSave={() => handleSave('keterangan')}
            disabled={disabled}
            renderInput={({ onBlur, autoFocus }) => (
              <Textarea
                autoFocus={autoFocus}
                value={data.keterangan || ''}
                onChange={(e) => onChange?.('keterangan', e.target.value)}
                onBlur={onBlur}
                className="bg-white text-gray-900 rounded-md min-h-[100px] border-blue-500 ring-2 ring-blue-500/20 shadow-sm resize-y"
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
