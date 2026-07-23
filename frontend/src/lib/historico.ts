import { apiClient } from './apiClient';

export type HistoricoAlteracao = {
  id: number;
  campo: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  autor: string | null;
  ip: string | null;
  criado_em: string | null;
};

type HistoricoListResponse = { data: HistoricoAlteracao[] };

export async function listHistorico(parceiraId: string | number): Promise<HistoricoAlteracao[]> {
  const response = await apiClient.get<HistoricoListResponse>(`/parceiras/${parceiraId}/historico`);
  return response.data.data;
}
