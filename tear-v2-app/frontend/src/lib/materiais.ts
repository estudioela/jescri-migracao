import { apiClient } from './apiClient';
import type { BadgeTone } from '../components/Badge';

export type MaterialTipo = 'REELS' | 'STORIES' | 'FOTOS' | 'OUTROS';
export type MaterialStatus = 'PENDENTE' | 'APROVADO' | 'REPROVADO';

const MATERIAL_STATUS_TONE: Record<MaterialStatus, BadgeTone> = {
  PENDENTE: 'neutral',
  APROVADO: 'success',
  REPROVADO: 'error',
};

export function materialStatusTone(status: MaterialStatus): BadgeTone {
  return MATERIAL_STATUS_TONE[status];
}

export type Material = {
  id: number;
  participacao_id: number;
  tipo: MaterialTipo;
  nome_arquivo: string;
  drive_file_url: string | null;
  status: MaterialStatus;
  aprovado_por: number | null;
  aprovado_em: string | null;
  motivo_reprovacao: string | null;
};

type MaterialResponse = { data: Material };
type MateriaisListResponse = { data: Material[] };

export async function listMateriais(participacaoId: string | number): Promise<Material[]> {
  const response = await apiClient.get<MateriaisListResponse>(
    `/participacoes/${participacaoId}/materiais`,
  );
  return response.data.data;
}

export async function uploadMaterial(
  participacaoId: string | number,
  tipo: MaterialTipo,
  arquivo: File,
): Promise<Material> {
  const formData = new FormData();
  formData.append('tipo', tipo);
  formData.append('arquivo', arquivo);

  const response = await apiClient.post<MaterialResponse>(
    `/participacoes/${participacaoId}/materiais`,
    formData,
  );
  return response.data.data;
}

export async function aprovarMaterial(id: string | number): Promise<Material> {
  const response = await apiClient.patch<MaterialResponse>(`/materiais/${id}/aprovar`);
  return response.data.data;
}

export async function reprovarMaterial(id: string | number, motivo: string): Promise<Material> {
  const response = await apiClient.patch<MaterialResponse>(`/materiais/${id}/reprovar`, {
    motivo,
  });
  return response.data.data;
}
