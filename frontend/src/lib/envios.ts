import { isAxiosError } from 'axios';
import { apiClient } from './apiClient';
import type { BadgeTone } from '../components/Badge';

export type EnvioStatus = 'PENDENTE' | 'EXPEDIDO' | 'ENTREGUE' | 'CANCELADO';

const ENVIO_STATUS_TONE: Record<EnvioStatus, BadgeTone> = {
  PENDENTE: 'neutral',
  EXPEDIDO: 'neutral',
  ENTREGUE: 'success',
  CANCELADO: 'error',
};

export function envioStatusTone(status: EnvioStatus): BadgeTone {
  return ENVIO_STATUS_TONE[status];
}

export type Envio = {
  id: number;
  participacao_id: number;
  status: EnvioStatus;
  codigo_rastreio: string | null;
  endereco_completo: string | null;
};

type EnvioResponse = { data: Envio };

export async function getEnvio(participacaoId: string | number): Promise<Envio | null> {
  try {
    const response = await apiClient.get<EnvioResponse>(`/participacoes/${participacaoId}/envio`);
    return response.data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createEnvio(
  participacaoId: string | number,
  codigoRastreio: string,
): Promise<Envio> {
  const response = await apiClient.post<EnvioResponse>(`/participacoes/${participacaoId}/envio`, {
    codigo_rastreio: codigoRastreio || undefined,
  });
  return response.data.data;
}

export async function updateEnvioStatus(id: string | number, status: EnvioStatus): Promise<Envio> {
  const response = await apiClient.patch<EnvioResponse>(`/envios/${id}`, { status });
  return response.data.data;
}
