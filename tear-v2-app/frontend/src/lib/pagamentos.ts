import { isAxiosError } from 'axios';
import { apiClient } from './apiClient';
import type { BadgeTone } from '../components/Badge';

export type PagamentoStatus = 'PENDENTE' | 'APROVADO' | 'PAGO';

const PAGAMENTO_STATUS_TONE: Record<PagamentoStatus, BadgeTone> = {
  PENDENTE: 'neutral',
  APROVADO: 'success',
  PAGO: 'success',
};

export function pagamentoStatusTone(status: PagamentoStatus): BadgeTone {
  return PAGAMENTO_STATUS_TONE[status];
}

export type Pagamento = {
  id: number;
  participacao_id: number;
  valor: number;
  status: PagamentoStatus;
  aprovado_por: number | null;
  aprovado_em: string | null;
};

type PagamentoResponse = { data: Pagamento };

export async function getPagamento(participacaoId: string | number): Promise<Pagamento | null> {
  try {
    const response = await apiClient.get<PagamentoResponse>(
      `/participacoes/${participacaoId}/pagamento`,
    );
    return response.data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createPagamento(
  participacaoId: string | number,
  valor: string,
): Promise<Pagamento> {
  const response = await apiClient.post<PagamentoResponse>(
    `/participacoes/${participacaoId}/pagamento`,
    { valor },
  );
  return response.data.data;
}

export async function updatePagamentoStatus(
  id: string | number,
  status: PagamentoStatus,
): Promise<Pagamento> {
  const response = await apiClient.patch<PagamentoResponse>(`/pagamentos/${id}`, { status });
  return response.data.data;
}
