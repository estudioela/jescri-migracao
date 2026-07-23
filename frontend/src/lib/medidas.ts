import { apiClient } from './apiClient';

export type Medida = {
  id: number;
  parceira_id: number;
  sutia_tamanho: string | null;
  sutia_numeracao: string | null;
  sutia_taca: string | null;
  calcinha_tamanho: string | null;
  linha_noite_tamanho: string | null;
  criado_em: string | null;
};

export type MedidaFormValues = {
  sutia_tamanho: string;
  sutia_numeracao: string;
  sutia_taca: string;
  calcinha_tamanho: string;
  linha_noite_tamanho: string;
};

type MedidaResponse = { data: Medida };
type MedidasListResponse = { data: Medida[] };

export async function listMedidas(parceiraId: number): Promise<Medida[]> {
  const response = await apiClient.get<MedidasListResponse>(`/parceiras/${parceiraId}/medidas`);
  return response.data.data;
}

export async function createMedida(
  parceiraId: number,
  values: Partial<MedidaFormValues>,
): Promise<Medida> {
  const response = await apiClient.post<MedidaResponse>(`/parceiras/${parceiraId}/medidas`, values);
  return response.data.data;
}
