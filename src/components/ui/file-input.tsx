import React from 'react';
import { Crop, Upload, X } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop as CropArea, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { cn } from '@/lib/utils';
import { TextTruncate } from './text-truncate';

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: File | null;
  onFileChange: (file: File | null) => void;
  helperText?: string;
  triggerClassName?: string;
  triggerContent?: React.ReactNode;
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
  triggerClassName,
  triggerContent,
  ...props
}: FileInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [cropOpen, setCropOpen] = React.useState(false);
  const [crop, setCrop] = React.useState<CropArea>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();

  const isImage = Boolean(value && (/^image\/(png|jpe?g)$/i.test(value.type) || /\.(png|jpe?g)$/i.test(value.name)));

  React.useEffect(() => {
    if (!isImage || !value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isImage, value]);

  React.useEffect(() => {
    if (!value && inputRef.current) inputRef.current.value = '';
  }, [value]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileChange(file);
  };

  const handleCropSave = async () => {
    const image = imageRef.current;
    if (!image || !completedCrop || !value) return;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(completedCrop.width * scaleX);
    canvas.height = Math.round(completedCrop.height * scaleY);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, value.type || 'image/jpeg', 0.92));
    if (!blob) return;
    const cropped = new File([blob], value.name, { type: blob.type, lastModified: Date.now() });
    onFileChange(cropped);
    setCropOpen(false);
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
          value && "border-solid border-[#1e3a5f]/20 bg-[#1e3a5f]/5",
          triggerClassName,
        )}
      >
        {triggerContent ?? (
          <>
            <Upload className="mb-2 h-6 w-6 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">
              {value ? <TextTruncate text={value.name} maxLength={25} /> : 'Klik untuk upload gambar'}
            </span>
            <span className="mt-1 text-xs text-slate-400">
              {helperText}
            </span>
          </>
        )}
      </button>
      {isImage && previewUrl ? (
        <div className="mt-3 flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3">
          <img src={previewUrl} alt={`Preview ${value?.name ?? 'gambar'}`} className="h-20 w-20 rounded object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">{value?.name}</p>
            <p className="mt-1 text-xs text-slate-500">Preview gambar yang akan diunggah</p>
            <button type="button" disabled={disabled} onClick={() => { setCropOpen(true); setCrop(undefined); }} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 hover:text-orange-800 disabled:opacity-50">
              <Crop className="h-3.5 w-3.5" /> Crop gambar
            </button>
          </div>
        </div>
      ) : null}
      {cropOpen && previewUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Crop gambar">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Crop gambar</h2>
              <button type="button" onClick={() => setCropOpen(false)} aria-label="Tutup crop" className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[65vh] overflow-auto text-center">
              <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}>
                <img ref={imageRef} src={previewUrl} alt="Gambar untuk dicrop" className="mx-auto max-h-[60vh] max-w-full" onLoad={(event) => {
                  const { width, height } = event.currentTarget;
                  setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 80 }, width / height, width, height), width, height));
                }} />
              </ReactCrop>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setCropOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Batal</button>
              <button type="button" onClick={() => void handleCropSave()} disabled={!completedCrop?.width || !completedCrop?.height} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Terapkan crop</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
