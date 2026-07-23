import { useEffect, useState, type FocusEvent, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { getMeParceira } from '../../lib/me';
import { updateParceira, type Parceira, type ParceiraFormValues } from '../../lib/parceiras';
import { createMedida, listMedidas, type Medida, type MedidaFormValues } from '../../lib/medidas';
import { formatarCep, formatarTelefone } from '../../lib/mascaras';
import { buscarEnderecoPorCep } from '../../lib/cep';
import TextField from '../../components/TextField';
import SelectField from '../../components/SelectField';
import Button from '../../components/Button';
import styles from './PortalPerfilPage.module.css';

const EMPTY_PERFIL: ParceiraFormValues = {
  nome: '',
  razao_social: '',
  email: '',
  telefone: '',
  instagram: '',
  cnpj: '',
  chave_pix: '',
  canais_uso_imagem: '',
  prazo_uso_imagem: '',
  cep: '',
  rua: '',
  bairro: '',
  cidade: '',
  uf: '',
  numero: '',
  complemento: '',
};

const EMPTY_MEDIDA: MedidaFormValues = {
  sutia_tamanho: '',
  sutia_numeracao: '',
  sutia_taca: '',
  calcinha_tamanho: '',
  linha_noite_tamanho: '',
};

type PerfilFieldErrors = Partial<Record<keyof ParceiraFormValues | 'consentimento_aceito', string>>;

function parceiraParaForm(parceira: Parceira): ParceiraFormValues {
  return {
    nome: parceira.nome,
    // razao_social/canais_uso_imagem/prazo_uso_imagem não têm campo editável
    // aqui (dado contratual gerido pela equipe) — precisam ir e voltar
    // intactos no form para não serem apagados ao salvar o perfil.
    razao_social: parceira.razao_social ?? '',
    email: parceira.email ?? '',
    telefone: parceira.telefone ?? '',
    instagram: parceira.instagram ?? '',
    cnpj: parceira.cnpj ?? '',
    chave_pix: parceira.chave_pix ?? '',
    canais_uso_imagem: parceira.canais_uso_imagem ?? '',
    prazo_uso_imagem: parceira.prazo_uso_imagem ?? '',
    cep: parceira.cep ?? '',
    rua: parceira.rua ?? '',
    bairro: parceira.bairro ?? '',
    cidade: parceira.cidade ?? '',
    uf: parceira.uf ?? '',
    numero: parceira.numero ?? '',
    complemento: parceira.complemento ?? '',
  };
}

function medidaParaForm(medida: Medida | null): MedidaFormValues {
  return {
    sutia_tamanho: medida?.sutia_tamanho ?? '',
    sutia_numeracao: medida?.sutia_numeracao ?? '',
    sutia_taca: medida?.sutia_taca ?? '',
    calcinha_tamanho: medida?.calcinha_tamanho ?? '',
    linha_noite_tamanho: medida?.linha_noite_tamanho ?? '',
  };
}

export default function PortalPerfilPage() {
  const [parceiraId, setParceiraId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [perfilForm, setPerfilForm] = useState<ParceiraFormValues>(EMPTY_PERFIL);
  const [consentimentoAceito, setConsentimentoAceito] = useState(false);
  const [perfilFieldErrors, setPerfilFieldErrors] = useState<PerfilFieldErrors>({});
  const [perfilError, setPerfilError] = useState<string | null>(null);
  const [perfilSucesso, setPerfilSucesso] = useState(false);
  const [isSavingPerfil, setIsSavingPerfil] = useState(false);

  const [medidaForm, setMedidaForm] = useState<MedidaFormValues>(EMPTY_MEDIDA);
  const [medidaError, setMedidaError] = useState<string | null>(null);
  const [medidaSucesso, setMedidaSucesso] = useState(false);
  const [isSavingMedida, setIsSavingMedida] = useState(false);

  useEffect(() => {
    getMeParceira()
      .then((parceira) => {
        setParceiraId(parceira.id);
        setPerfilForm(parceiraParaForm(parceira));
        return listMedidas(parceira.id);
      })
      .then((medidas) => setMedidaForm(medidaParaForm(medidas[0] ?? null)))
      .catch(() => setLoadError('Não foi possível carregar os dados do seu perfil.'))
      .finally(() => setIsLoading(false));
  }, []);

  function updatePerfilField(field: keyof ParceiraFormValues, value: string) {
    setPerfilForm((current) => ({ ...current, [field]: value }));
    setPerfilSucesso(false);
  }

  async function handleCepBlur(event: FocusEvent<HTMLInputElement>) {
    const endereco = await buscarEnderecoPorCep(event.target.value);
    if (!endereco) return;

    setPerfilForm((current) =>
      current.rua
        ? current
        : {
            ...current,
            rua: endereco.rua ?? current.rua,
            bairro: endereco.bairro ?? current.bairro,
            cidade: endereco.cidade ?? current.cidade,
            uf: endereco.uf ?? current.uf,
          },
    );
  }

  function updateMedidaField(field: keyof MedidaFormValues, value: string) {
    setMedidaForm((current) => ({ ...current, [field]: value }));
    setMedidaSucesso(false);
  }

  useEffect(() => {
    if (!perfilSucesso) return;
    const timer = window.setTimeout(() => setPerfilSucesso(false), 4000);
    return () => window.clearTimeout(timer);
  }, [perfilSucesso]);

  useEffect(() => {
    if (!medidaSucesso) return;
    const timer = window.setTimeout(() => setMedidaSucesso(false), 4000);
    return () => window.clearTimeout(timer);
  }, [medidaSucesso]);

  async function handleSubmitPerfil(event: FormEvent) {
    event.preventDefault();
    if (!parceiraId) return;

    setPerfilError(null);
    setPerfilFieldErrors({});
    setPerfilSucesso(false);
    setIsSavingPerfil(true);

    try {
      const atualizada = await updateParceira(String(parceiraId), {
        ...perfilForm,
        consentimento_aceito: consentimentoAceito,
      } as Partial<ParceiraFormValues> & { consentimento_aceito: boolean });
      setPerfilForm(parceiraParaForm(atualizada));
      setConsentimentoAceito(false);
      setPerfilSucesso(true);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]>;
        const mapped: PerfilFieldErrors = {};
        for (const key of Object.keys(errors)) {
          mapped[key as keyof PerfilFieldErrors] = errors[key][0];
        }
        setPerfilFieldErrors(mapped);
      } else {
        setPerfilError('Não foi possível salvar seus dados. Tente novamente.');
      }
    } finally {
      setIsSavingPerfil(false);
    }
  }

  async function handleSubmitMedida(event: FormEvent) {
    event.preventDefault();
    if (!parceiraId) return;

    setMedidaError(null);
    setMedidaSucesso(false);
    setIsSavingMedida(true);

    try {
      const nova = await createMedida(parceiraId, medidaForm);
      setMedidaForm(medidaParaForm(nova));
      setMedidaSucesso(true);
    } catch {
      setMedidaError('Não foi possível salvar suas medidas. Tente novamente.');
    } finally {
      setIsSavingMedida(false);
    }
  }

  if (isLoading) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  if (loadError || !parceiraId) {
    return <p role="alert">{loadError ?? 'Perfil indisponível.'}</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Meu perfil</h2>
      </header>

      <form className={styles.form} onSubmit={handleSubmitPerfil} noValidate>
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Contato e recebimento</h3>
          <TextField
            label="Chave PIX"
            value={perfilForm.chave_pix}
            onChange={(event) => updatePerfilField('chave_pix', event.target.value)}
            error={perfilFieldErrors.chave_pix}
            required
          />
          <p className={styles.fieldHint}>
            confira com atenção — é para aqui que o pagamento vai.
          </p>
          <TextField
            label="Nome"
            value={perfilForm.nome}
            onChange={(event) => updatePerfilField('nome', event.target.value)}
            error={perfilFieldErrors.nome}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={perfilForm.email}
            onChange={(event) => updatePerfilField('email', event.target.value)}
            error={perfilFieldErrors.email}
            required
          />
          <TextField
            label="Telefone"
            value={perfilForm.telefone}
            onChange={(event) => updatePerfilField('telefone', formatarTelefone(event.target.value))}
            error={perfilFieldErrors.telefone}
            required
          />
          <TextField
            label="Instagram"
            value={perfilForm.instagram}
            onChange={(event) => updatePerfilField('instagram', event.target.value)}
            error={perfilFieldErrors.instagram}
            required
          />
        </section>

        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Endereço</h3>
          <div className={styles.row}>
            <TextField
              label="CEP"
              value={perfilForm.cep}
              onChange={(event) => updatePerfilField('cep', formatarCep(event.target.value))}
              onBlur={handleCepBlur}
              error={perfilFieldErrors.cep}
            />
            <TextField
              label="UF"
              value={perfilForm.uf}
              onChange={(event) => updatePerfilField('uf', event.target.value.toUpperCase())}
              error={perfilFieldErrors.uf}
              maxLength={2}
              required
            />
          </div>
          <TextField
            label="Rua"
            value={perfilForm.rua}
            onChange={(event) => updatePerfilField('rua', event.target.value)}
            error={perfilFieldErrors.rua}
          />
          <div className={styles.row}>
            <TextField
              label="Número"
              value={perfilForm.numero}
              onChange={(event) => updatePerfilField('numero', event.target.value)}
              error={perfilFieldErrors.numero}
            />
            <TextField
              label="Complemento"
              value={perfilForm.complemento}
              onChange={(event) => updatePerfilField('complemento', event.target.value)}
              error={perfilFieldErrors.complemento}
            />
          </div>
          <TextField
            label="Bairro"
            value={perfilForm.bairro}
            onChange={(event) => updatePerfilField('bairro', event.target.value)}
            error={perfilFieldErrors.bairro}
          />
          <TextField
            label="Cidade"
            value={perfilForm.cidade}
            onChange={(event) => updatePerfilField('cidade', event.target.value)}
            error={perfilFieldErrors.cidade}
            required
          />
        </section>

        <section className={styles.consentRow}>
          <input
            id="consentimento_aceito"
            type="checkbox"
            checked={consentimentoAceito}
            onChange={(event) => setConsentimentoAceito(event.target.checked)}
          />
          <label htmlFor="consentimento_aceito" className={styles.consentLabel}>
            Confirmo que os dados acima estão corretos e autorizo sua atualização.
          </label>
        </section>
        {perfilFieldErrors.consentimento_aceito && (
          <p className={styles.formError} role="alert">
            {perfilFieldErrors.consentimento_aceito}
          </p>
        )}

        {perfilError && (
          <p className={styles.formError} role="alert">
            {perfilError}
          </p>
        )}
        {perfilSucesso && <p className={styles.formSuccess}>Dados atualizados com sucesso.</p>}

        <Button
          type="submit"
          isLoading={isSavingPerfil}
          loadingText="salvando…"
          className={styles.submit}
        >
          salvar dados pessoais
        </Button>
      </form>

      <form className={styles.form} onSubmit={handleSubmitMedida} noValidate>
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Medidas</h3>
          <div className={styles.row}>
            <SelectField
              label="Sutiã — tamanho"
              value={medidaForm.sutia_tamanho}
              onChange={(event) => updateMedidaField('sutia_tamanho', event.target.value)}
            >
              <option value="">—</option>
              <option value="P">P</option>
              <option value="M">M</option>
              <option value="G">G</option>
              <option value="GG">GG</option>
            </SelectField>
            <SelectField
              label="Sutiã — numeração"
              value={medidaForm.sutia_numeracao}
              onChange={(event) => updateMedidaField('sutia_numeracao', event.target.value)}
            >
              <option value="">—</option>
              <option value="42">42</option>
              <option value="44">44</option>
              <option value="46">46</option>
              <option value="48">48</option>
            </SelectField>
          </div>
          <SelectField
            label="Sutiã — taça"
            value={medidaForm.sutia_taca}
            onChange={(event) => updateMedidaField('sutia_taca', event.target.value)}
          >
            <option value="">—</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </SelectField>
          <SelectField
            label="Calcinha — tamanho"
            value={medidaForm.calcinha_tamanho}
            onChange={(event) => updateMedidaField('calcinha_tamanho', event.target.value)}
          >
            <option value="">—</option>
            <option value="P">P</option>
            <option value="M">M</option>
            <option value="G">G</option>
            <option value="GG">GG</option>
          </SelectField>
          <SelectField
            label="Linha noite — tamanho"
            value={medidaForm.linha_noite_tamanho}
            onChange={(event) => updateMedidaField('linha_noite_tamanho', event.target.value)}
          >
            <option value="">—</option>
            <option value="P">P</option>
            <option value="M">M</option>
            <option value="G">G</option>
            <option value="GG">GG</option>
          </SelectField>
        </section>

        {medidaError && (
          <p className={styles.formError} role="alert">
            {medidaError}
          </p>
        )}
        {medidaSucesso && <p className={styles.formSuccess}>Medidas atualizadas com sucesso.</p>}

        <Button
          type="submit"
          isLoading={isSavingMedida}
          loadingText="salvando…"
          className={styles.submit}
        >
          salvar medidas
        </Button>
      </form>
    </div>
  );
}
