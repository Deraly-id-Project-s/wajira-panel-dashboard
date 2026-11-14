import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateDocumentArchivePayload,
  DocumentArchiveListParams,
  DocumentArchiveType,
  UpdateDocumentArchivePayload,
} from '@/@types/document-archive.types';
import {
  createDocumentArchive,
  deleteDocumentArchive,
  getDocumentArchiveById,
  getDocumentArchives,
  getLatestDocumentNumber,
  updateArchiveFile,
  updateDocumentArchive,
} from '@/services/document-archive.service';

const key = 'document-archives';

export function useDocumentArchives(params: DocumentArchiveListParams) {
  return useQuery({
    queryKey: [key, params],
    queryFn: () => getDocumentArchives(params),
    placeholderData: (previous) => previous,
  });
}

export function useDocumentArchive(id: number | string | null) {
  return useQuery({
    queryKey: [key, id],
    queryFn: () => getDocumentArchiveById(id as number | string),
    enabled: Boolean(id),
  });
}

export function useLatestDocumentNumber(type: DocumentArchiveType, enabled = true) {
  return useQuery({
    queryKey: [key, 'latest-number', type],
    queryFn: () => getLatestDocumentNumber(type),
    enabled: Boolean(type) && enabled,
    staleTime: 0,
  });
}

export function useCreateDocumentArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDocumentArchivePayload) => createDocumentArchive(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdateDocumentArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateDocumentArchivePayload }) =>
      updateDocumentArchive(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdateArchiveFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: number | string; file: File }) =>
      updateArchiveFile(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}

export function useDeleteDocumentArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteDocumentArchive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
  });
}
