import { apiClient } from './apiClient';

export type ParceiraStatus = 'Ativa' | 'Inativa';

export type Parceira = {
  id: number;
  nome: string;
  status: ParceiraStatus;
  email: string | null;
  cnpj: string | null;
  chave_pix: string | null;
  cep: string | null;
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  numero: string | null;
  complemento: string | null;
  endereco_completo: string | null;
};

export type ParceiraFormValues = {
  nome: string;
  email: string;
  cnpj: string;
  chave_pix: string;
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  numero: string;
  complemento: string;
};

type ParceiraResponse = { data: Parceira };
type ParceirasListResponse = { data: Parceira[] };

export async function listParceiras(): Promise<Parceira[]> {
  const response = await apiClient.get<ParceirasListResponse>('/parceiras');
  return response.data.data;
}

export async function getParceira(id: string): Promise<Parceira> {
  const response = await apiClient.get<ParceiraResponse>(`/parceiras/${id}`);
  return response.data.data;
}

export async function createParceira(values: Partial<ParceiraFormValues>): Promise<Parceira> {
  const response = await apiClient.post<ParceiraResponse>('/parceiras', values);
  return response.data.data;
}

export async function updateParceira(
  id: string,
  values: Partial<ParceiraFormValues>,
): Promise<Parceira> {
  const response = await apiClient.put<ParceiraResponse>(`/parceiras/${id}`, values);
  return response.data.data;
}
