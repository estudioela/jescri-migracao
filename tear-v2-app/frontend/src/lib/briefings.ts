import { apiClient } from './apiClient';

export type TipoConteudo = 'FEED' | 'REELS' | 'STORIES' | 'TIKTOK' | 'UGC';

export type Briefing = {
  id: number;
  participacao_id: number;
  tipo: TipoConteudo;
  orientacoes: string;
  prazo: string;
  data_aprovacao_interna: string | null;
  referencias: string[] | null;
  entregaveis_esperados: string | null;
  observacoes: string | null;
};

export type BriefingFormValues = {
  tipo: TipoConteudo;
  orientacoes: string;
  prazo: string;
  entregaveis_esperados: string;
};

type BriefingResponse = { data: Briefing };
type BriefingListResponse = { data: Briefing[] };

export async function listBriefings(participacaoId: string | number): Promise<Briefing[]> {
  const response = await apiClient.get<BriefingListResponse>(
    `/participacoes/${participacaoId}/briefings`,
  );
  return response.data.data;
}

export async function createBriefing(
  participacaoId: string | number,
  values: BriefingFormValues,
): Promise<Briefing> {
  const response = await apiClient.post<BriefingResponse>(
    `/participacoes/${participacaoId}/briefings`,
    values,
  );
  return response.data.data;
}

export async function updateBriefing(
  id: string | number,
  values: Omit<BriefingFormValues, 'tipo'>,
): Promise<Briefing> {
  const response = await apiClient.patch<BriefingResponse>(`/briefings/${id}`, values);
  return response.data.data;
}
