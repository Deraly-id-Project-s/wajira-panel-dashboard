import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentTemplateListParams, DocumentTemplatePayload } from '@/@types/document-template.types';
import { createDocumentTemplate, deleteDocumentTemplate, getDocumentTemplateById, getDocumentTemplates, updateDocumentTemplate } from '@/services/document-template.service';

const key = 'document-templates';

export function useDocumentTemplates(params: DocumentTemplateListParams) {
  return useQuery({ queryKey: [key, params], queryFn: () => getDocumentTemplates(params), placeholderData: (previous) => previous });
}

export function useDocumentTemplate(id: string | number | null) {
  return useQuery({ queryKey: [key, id], queryFn: () => getDocumentTemplateById(id as string | number), enabled: Boolean(id) });
}

export function useCreateDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createDocumentTemplate, onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }) });
}

export function useUpdateDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: DocumentTemplatePayload }) => updateDocumentTemplate(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useDeleteDocumentTemplate() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: deleteDocumentTemplate, onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }) });
}
