import { apiClient } from './apiClient';

export type ResetPasswordPayload = {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/password/forgot', { email });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post('/password/reset', payload);
}
