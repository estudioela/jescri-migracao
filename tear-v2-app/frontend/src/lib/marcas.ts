import { apiClient } from './apiClient';

export type MarcaStatus = 'Ativa' | 'Inativa';

export type Marca = {
  id: number;
  nome: string;
  status: MarcaStatus;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  cnpj: string | null;
};

export type MarcaFormValues = {
  nome: string;
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  cnpj: string;
};

type MarcaResponse = { data: Marca };
type MarcasListResponse = { data: Marca[]; meta?: { total: number } };

export type ListMarcasParams = {
  status?: MarcaStatus;
};

export async function listMarcas(params?: ListMarcasParams): Promise<Marca[]> {
  const response = await apiClient.get<MarcasListResponse>('/marcas', { params });
  return response.data.data;
}

export async function getMarca(id: string | number): Promise<Marca> {
  const response = await apiClient.get<MarcaResponse>(`/marcas/${id}`);
  return response.data.data;
}

export async function createMarca(values: Partial<MarcaFormValues>): Promise<Marca> {
  const response = await apiClient.post<MarcaResponse>('/marcas', values);
  return response.data.data;
}

export async function updateMarca(
  id: string | number,
  values: Partial<MarcaFormValues>,
): Promise<Marca> {
  const response = await apiClient.patch<MarcaResponse>(`/marcas/${id}`, values);
  return response.data.data;
}
