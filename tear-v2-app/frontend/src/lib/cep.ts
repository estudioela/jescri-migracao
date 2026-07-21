export type EnderecoPorCep = {
  rua: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
};

/**
 * Consulta direta ao ViaCEP a partir do navegador — mesma fonte já usada
 * pelo backend (CepLookupService) como fallback no salvamento. Nunca
 * lança: falha de rede ou CEP inexistente apenas retornam null.
 */
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoPorCep | null> {
  const digitos = cep.replace(/\D/g, '');
  if (digitos.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.erro) return null;

    return {
      rua: data.logradouro || null,
      bairro: data.bairro || null,
      cidade: data.localidade || null,
      uf: data.uf || null,
    };
  } catch {
    return null;
  }
}
