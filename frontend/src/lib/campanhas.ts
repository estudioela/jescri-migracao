import { apiClient } from './apiClient';
import type { BadgeTone } from '../components/Badge';
import type { Marca } from './marcas';
import type { Participacao } from './participacoes';

export type CampanhaStatus = 'PLANEJADA' | 'ATIVA' | 'ENCERRADA' | 'CANCELADA';

const CAMPANHA_STATUS_TONE: Record<CampanhaStatus, BadgeTone> = {
  PLANEJADA: 'neutral',
  ATIVA: 'success',
  ENCERRADA: 'neutral',
  CANCELADA: 'error',
};

export function campanhaStatusTone(status: CampanhaStatus): BadgeTone {
  return CAMPANHA_STATUS_TONE[status];
}

export type Campanha = {
  id: number;
  marca_id: number;
  marca: Marca;
  nome: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  status: CampanhaStatus;
  participacoes: Participacao[];
};

export type CampanhaFormValues = {
  marca_id: number | '';
  nome: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  status: CampanhaStatus;
};

type CampanhaResponse = { data: Campanha };
type PageMeta = { current_page: number; last_page: number; total: number };
type CampanhasListResponse = { data: Campanha[]; meta?: PageMeta };

export type ListCampanhasParams = {
  marca_id?: number;
  status?: CampanhaStatus;
  page?: number;
};

export async function listCampanhas(params?: ListCampanhasParams): Promise<Campanha[]> {
  const response = await apiClient.get<CampanhasListResponse>('/campanhas', { params });
  return response.data.data;
}

export async function listCampanhasPage(
  params?: ListCampanhasParams,
): Promise<{ data: Campanha[]; meta?: PageMeta }> {
  const response = await apiClient.get<CampanhasListResponse>('/campanhas', { params });
  return response.data;
}

export async function countCampanhas(params?: ListCampanhasParams): Promise<number> {
  const response = await apiClient.get<CampanhasListResponse>('/campanhas', { params });
  return response.data.meta?.total ?? response.data.data.length;
}

export async function getCampanha(id: string | number): Promise<Campanha> {
  const response = await apiClient.get<CampanhaResponse>(`/campanhas/${id}`);
  return response.data.data;
}

export async function createCampanha(values: Partial<CampanhaFormValues>): Promise<Campanha> {
  const response = await apiClient.post<CampanhaResponse>('/campanhas', values);
  return response.data.data;
}

export async function updateCampanha(
  id: string | number,
  values: Partial<CampanhaFormValues>,
): Promise<Campanha> {
  const response = await apiClient.patch<CampanhaResponse>(`/campanhas/${id}`, values);
  return response.data.data;
}
