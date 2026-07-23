import { apiClient } from './apiClient';
import type { Parceira } from './parceiras';
import type { TipoConteudo } from './briefings';

type ParceiraResponse = { data: Parceira };

export async function getMeParceira(): Promise<Parceira> {
  const response = await apiClient.get<ParceiraResponse>('/me/parceira');
  return response.data.data;
}

export type MeParticipacao = {
  id: number;
  campanha: {
    id: number;
    nome: string;
    status: 'PLANEJADA' | 'ATIVA' | 'ENCERRADA' | 'CANCELADA';
    data_inicio: string | null;
    data_fim: string | null;
    marca: { nome: string };
  };
  valor_contratado: number | null;
  entregaveis_contratados: Record<TipoConteudo, number>;
  proximo_prazo_briefing: string | null;
  pagamento_status: 'PENDENTE' | 'APROVADO' | 'PAGO' | null;
  status: 'ATIVA' | 'CANCELADA';
};

type MeParticipacaoResponse = { data: MeParticipacao };
type MeParticipacaoListResponse = { data: MeParticipacao[] };

export async function getMeParticipacoes(): Promise<MeParticipacao[]> {
  const response = await apiClient.get<MeParticipacaoListResponse>('/me/participacoes');
  return response.data.data;
}

export async function getMeParticipacao(id: string | number): Promise<MeParticipacao> {
  const response = await apiClient.get<MeParticipacaoResponse>(`/me/participacoes/${id}`);
  return response.data.data;
}

export async function getMeHistorico(): Promise<MeParticipacao[]> {
  const response = await apiClient.get<MeParticipacaoListResponse>('/me/historico');
  return response.data.data;
}
