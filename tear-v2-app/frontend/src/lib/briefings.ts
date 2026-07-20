import { isAxiosError } from 'axios';
import { apiClient } from './apiClient';

export type Briefing = {
  id: number;
  participacao_id: number;
  orientacoes: string;
  prazo: string;
  entregaveis_esperados: string | null;
};

export type BriefingFormValues = {
  orientacoes: string;
  prazo: string;
  entregaveis_esperados: string;
};

type BriefingResponse = { data: Briefing };

export async function getBriefing(participacaoId: string | number): Promise<Briefing | null> {
  try {
    const response = await apiClient.get<BriefingResponse>(
      `/participacoes/${participacaoId}/briefing`,
    );
    return response.data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createBriefing(
  participacaoId: string | number,
  values: BriefingFormValues,
): Promise<Briefing> {
  const response = await apiClient.post<BriefingResponse>(
    `/participacoes/${participacaoId}/briefing`,
    values,
  );
  return response.data.data;
}

export async function updateBriefing(
  id: string | number,
  values: BriefingFormValues,
): Promise<Briefing> {
  const response = await apiClient.patch<BriefingResponse>(`/briefings/${id}`, values);
  return response.data.data;
}
