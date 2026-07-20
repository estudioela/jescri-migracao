import { apiClient } from './apiClient';
import type { BadgeTone } from '../components/Badge';
import type { Parceira } from './parceiras';

export type ParticipacaoStatus = 'ATIVA' | 'CANCELADA';

const PARTICIPACAO_STATUS_TONE: Record<ParticipacaoStatus, BadgeTone> = {
  ATIVA: 'success',
  CANCELADA: 'error',
};

export function participacaoStatusTone(status: ParticipacaoStatus): BadgeTone {
  return PARTICIPACAO_STATUS_TONE[status];
}

export type Participacao = {
  id: number;
  campanha_id: number;
  parceira_id: number;
  parceira: Parceira;
  valor_contratado: number | null;
  reels_qtd: number;
  carrossel_qtd: number;
  stories_qtd: number;
  status: ParticipacaoStatus;
};

export type ParticipacaoFormValues = {
  parceira_id: number;
  valor_contratado: string;
  reels_qtd: number;
  carrossel_qtd: number;
  stories_qtd: number;
};

export type UpdateParticipacaoValues = Partial<
  Pick<ParticipacaoFormValues, 'valor_contratado' | 'reels_qtd' | 'carrossel_qtd' | 'stories_qtd'>
> & {
  status?: ParticipacaoStatus;
};

type ParticipacaoResponse = { data: Participacao };
type ParticipacoesListResponse = { data: Participacao[] };

export async function listParticipacoes(campanhaId: string | number): Promise<Participacao[]> {
  const response = await apiClient.get<ParticipacoesListResponse>(
    `/campanhas/${campanhaId}/participacoes`,
  );
  return response.data.data;
}

export async function createParticipacao(
  campanhaId: string | number,
  values: Partial<ParticipacaoFormValues>,
): Promise<Participacao> {
  const response = await apiClient.post<ParticipacaoResponse>(
    `/campanhas/${campanhaId}/participacoes`,
    values,
  );
  return response.data.data;
}

export async function updateParticipacao(
  id: string | number,
  values: UpdateParticipacaoValues,
): Promise<Participacao> {
  const response = await apiClient.patch<ParticipacaoResponse>(`/participacoes/${id}`, values);
  return response.data.data;
}
