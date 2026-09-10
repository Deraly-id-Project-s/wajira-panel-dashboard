import React from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DoEkspedisi, DoEkspedisiClaim, DoEkspedisiClaimDocumentation } from '@/@types/do-ekspedisi.types';
import { Button } from '@/components/ui/button';
import { FileInput } from '@/components/ui/file-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils/currency';

const CLAIM_DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;
const CLAIM_DOCUMENT_ACCEPT = 'image/png,image/jpeg,.png,.jpg,.jpeg';
const CLAIM_DOCUMENT_ALLOWED_TYPES = new Set(['image/png', 'image/jpeg']);
const CLAIM_DOCUMENT_ALLOWED_EXTENSIONS = new Set(['png', 'jpg', 'jpeg']);

interface ClaimDocumentationForm {
  key: number;
  caption: string;
  image: File | null;
}

export interface DOEkspedisiClaimFormValues {
  subject: string;
  description: string;
  claimNominal: number;
  documentations: Array<{
    caption: string;
    image: File;
  }>;
}

interface DOEkspedisiClaimFormProps {
  expedition: DoEkspedisi;
  initialData?: DoEkspedisiClaim | null;
  onSubmit: (values: DOEkspedisiClaimFormValues) => void | Promise<void>;
  onDeleteDocumentation?: (documentation: DoEkspedisiClaimDocumentation) => void | Promise<void>;
  isSubmitting?: boolean;
  isDeletingDocumentation?: boolean;
}

const createDocumentationForm = (key: number): ClaimDocumentationForm => ({
  key,
  caption: '',
  image: null,
});

const isAllowedClaimDocument = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return CLAIM_DOCUMENT_ALLOWED_TYPES.has(file.type) || CLAIM_DOCUMENT_ALLOWED_EXTENSIONS.has(extension);
};

const validateClaimDocument = (file: File) => {
  if (file.size > CLAIM_DOCUMENT_MAX_SIZE) {
    toast.error('Ukuran file maksimal 10MB');
    return false;
  }

  if (!isAllowedClaimDocument(file)) {
    toast.error('Format file harus PNG, JPG, atau JPEG');
    return false;
  }

  return true;
};

export function DOEkspedisiClaimForm({
  expedition,
  initialData,
  onSubmit,
  onDeleteDocumentation,
  isSubmitting = false,
  isDeletingDocumentation = false,
}: DOEkspedisiClaimFormProps) {
  const documentationKeyRef = React.useRef(0);
  const [subject, setSubject] = React.useState(initialData?.subject ?? '');
  const [description, setDescription] = React.useState(initialData?.description ?? '');
  const [claimNominal, setClaimNominal] = React.useState(initialData?.claimNominal ?? 0);
  const [documentationForms, setDocumentationForms] = React.useState<ClaimDocumentationForm[]>(() => [
    createDocumentationForm(1),
  ]);

  React.useEffect(() => {
    documentationKeyRef.current = 1;
    setSubject(initialData?.subject ?? '');
    setDescription(initialData?.description ?? '');
    setClaimNominal(initialData?.claimNominal ?? 0);
    setDocumentationForms(initialData ? [] : [createDocumentationForm(1)]);
  }, [initialData]);

  const addDocumentationForm = () => {
    documentationKeyRef.current += 1;
    setDocumentationForms((old) => [...old, createDocumentationForm(documentationKeyRef.current)]);
  };

  const removeDocumentationForm = (key: number) => {
    setDocumentationForms((old) => old.filter((item) => item.key !== key));
  };

  const updateDocumentationForm = (key: number, patch: Partial<Omit<ClaimDocumentationForm, 'key'>>) => {
    setDocumentationForms((old) => old.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const handleDocumentationFileChange = (key: number, file: File | null) => {
    if (!file) {
      updateDocumentationForm(key, { image: null });
      return;
    }

    if (!validateClaimDocument(file)) {
      updateDocumentationForm(key, { image: null });
      return;
    }

    updateDocumentationForm(key, { image: file });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    const filledDocumentationForms = documentationForms.filter((item) => item.caption.trim() || item.image);
    const incompleteDocumentationForm = filledDocumentationForms.find((item) => !item.image);

    if (!expedition.driverId) {
      toast.error('Driver wajib tersedia untuk membuat claim');
      return;
    }

    if (!trimmedSubject) {
      toast.error('Subject claim wajib diisi');
      return;
    }

    if (!trimmedDescription) {
      toast.error('Deskripsi claim wajib diisi');
      return;
    }

    if (claimNominal <= 0) {
      toast.error('Nominal claim harus lebih dari 0');
      return;
    }

    if (incompleteDocumentationForm) {
      toast.error('File dokumentasi wajib diisi untuk setiap dokumentasi yang ditambahkan');
      return;
    }

    if (filledDocumentationForms.some((item) => item.image && !validateClaimDocument(item.image))) return;

    await onSubmit({
      subject: trimmedSubject,
      description: trimmedDescription,
      claimNominal,
      documentations: filledDocumentationForms.map((item) => ({
        caption: item.caption.trim(),
        image: item.image as File,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md border border-[#E5E7EB] bg-white px-5 py-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Driver</Label>
            <Input value={expedition.driver?.name || `Driver #${expedition.driverId ?? '-'}`} disabled className="h-12 rounded-md border-[#E5E7EB] bg-[#F8FAFC]" />
          </div>
          <div className="space-y-2">
            <Label>Nominal Claim <span className="text-red-500">*</span></Label>
            <MoneyInput
              value={claimNominal || null}
              onChangeValue={setClaimNominal}
              placeholder="Nominal klaim supir"
              disabled={isSubmitting}
              className="h-12 rounded-md border-[#E5E7EB]"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Subject <span className="text-red-500">*</span></Label>
            <Input
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subjek claim"
              disabled={isSubmitting}
              className="h-12 rounded-md border-[#E5E7EB]"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Deskripsi <span className="text-red-500">*</span></Label>
            <Textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Deskripsi perihal claim supir"
              disabled={isSubmitting}
              className="min-h-28 rounded-md border-[#E5E7EB]"
            />
          </div>
        </div>
      </div>

      {initialData && (initialData.documentations?.length ?? 0) > 0 && (
        <div className="rounded-md border border-[#E5E7EB] bg-white px-5 py-6 shadow-sm">
          <h2 className="text-[16px] font-semibold text-slate-900">Dokumentasi Tersimpan</h2>
          <div className="mt-4 space-y-2">
            {initialData.documentations.map((documentation) => (
              <div key={documentation.id} className="flex flex-col gap-3 rounded-md border border-slate-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{documentation.caption || '-'}</p>
                  <p className="truncate text-xs text-slate-500">{documentation.image || '-'}</p>
                </div>
                {onDeleteDocumentation && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting || isDeletingDocumentation}
                    className="justify-start text-red-600 hover:bg-red-50 hover:text-red-700 sm:justify-center"
                    onClick={() => void onDeleteDocumentation(documentation)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-md border border-[#E5E7EB] bg-white px-5 py-6 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-900">Dokumentasi Claim Baru</h2>
            <p className="mt-1 text-sm text-slate-500">Setiap claim dapat memiliki banyak dokumentasi. Caption bersifat opsional.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addDocumentationForm} disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Dokumentasi
          </Button>
        </div>

        {documentationForms.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
            Belum ada dokumentasi baru.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {documentationForms.map((documentation, index) => (
              <div key={documentation.key} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Input
                    value={documentation.caption}
                    onChange={(event) => updateDocumentationForm(documentation.key, { caption: event.target.value })}
                    placeholder={`Caption dokumentasi ${index + 1}`}
                    disabled={isSubmitting}
                    className="h-11 rounded-md border-[#E5E7EB]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>File Dokumentasi <span className="text-red-500">*</span></Label>
                  <FileInput
                    name={`claim_documentation_${documentation.key}`}
                    accept={CLAIM_DOCUMENT_ACCEPT}
                    value={documentation.image}
                    onFileChange={(file) => handleDocumentationFileChange(documentation.key, file)}
                    helperText="Format PNG, JPG, atau JPEG maksimal 10MB"
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 md:mt-8"
                  onClick={() => removeDocumentationForm(documentation.key)}
                  disabled={isSubmitting}
                  aria-label={`Hapus dokumentasi ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Total claim: <span className="font-semibold text-slate-900">{formatCurrency(claimNominal)}</span>
        </p>
        <Button type="submit" className="btn-primary-orange!" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Menyimpan...' : 'Simpan Claim'}
        </Button>
      </div>
    </form>
  );
}
