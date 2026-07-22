import { apiClient } from './apiClient';

export type ParceiraStatus = 'Ativa' | 'Inativa';

export type Parceira = {
  id: number;
  nome: string;
  razao_social: string | null;
  status: ParceiraStatus;
  aprovado_em: string | null;
  reprovado_em: string | null;
  motivo_reprovacao: string | null;
  email: string | null;
  telefone: string | null;
  instagram: string | null;
  cnpj: string | null;
  chave_pix: string | null;
  canais_uso_imagem: string | null;
  prazo_uso_imagem: string | null;
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
  razao_social: string;
  email: string;
  telefone: string;
  instagram: string;
  cnpj: string;
  chave_pix: string;
  canais_uso_imagem: string;
  prazo_uso_imagem: string;
  cep: string;
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
  numero: string;
  complemento: string;
};

type ParceiraResponse = { data: Parceira };
type PageMeta = { current_page: number; last_page: number; total: number };
type ParceirasListResponse = { data: Parceira[]; meta?: PageMeta };

export type ListParceirasParams = {
  status?: ParceiraStatus;
  page?: number;
};

export async function listParceiras(params?: ListParceirasParams): Promise<Parceira[]> {
  const response = await apiClient.get<ParceirasListResponse>('/parceiras', { params });
  return response.data.data;
}

export async function listParceirasPage(
  params?: ListParceirasParams,
): Promise<{ data: Parceira[]; meta?: PageMeta }> {
  const response = await apiClient.get<ParceirasListResponse>('/parceiras', { params });
  return response.data;
}

export async function countParceiras(params?: ListParceirasParams): Promise<number> {
  const response = await apiClient.get<ParceirasListResponse>('/parceiras', { params });
  return response.data.meta?.total ?? response.data.data.length;
}

export async function aprovarParceira(id: number): Promise<Parceira> {
  const response = await apiClient.patch<ParceiraResponse>(`/parceiras/${id}/aprovar`);
  return response.data.data;
}

export async function reenviarConvite(id: number): Promise<void> {
  await apiClient.post(`/parceiras/${id}/reenviar-convite`);
}

export async function reprovarParceira(id: number, motivo?: string): Promise<Parceira> {
  const response = await apiClient.patch<ParceiraResponse>(`/parceiras/${id}/reprovar`, {
    motivo: motivo || undefined,
  });
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

export async function createParceiraPublica(
  values: Partial<ParceiraFormValues>,
): Promise<Parceira> {
  const response = await apiClient.post<ParceiraResponse>('/parceiras/cadastro', values);
  return response.data.data;
}
