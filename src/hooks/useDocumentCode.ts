import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaginationParams } from '@/@types/pagination.types';
import type { DocumentCodeUpdatePayload } from '@/@types/document-archive.types';
import { getDocumentCodes, updateDocumentCode } from '@/services/document-code.service';

const key = 'document-codes';

export function useDocumentCodes(params?: PaginationParams) {
  return useQuery({
    queryKey: [key, params],
    queryFn: () => getDocumentCodes(params),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateDocumentCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: DocumentCodeUpdatePayload }) =>
      updateDocumentCode(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
