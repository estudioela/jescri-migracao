import { apiClient } from './apiClient';
import type { Parceira } from './parceiras';

type ParceiraResponse = { data: Parceira };

export async function getMeParceira(): Promise<Parceira> {
  const response = await apiClient.get<ParceiraResponse>('/me/parceira');
  return response.data.data;
}
