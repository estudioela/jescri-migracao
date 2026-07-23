import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  createParceira,
  getParceira,
  updateParceira,
  type ParceiraFormValues,
} from '../lib/parceiras';
import TextField from '../components/TextField';
import Button from '../components/Button';
import styles from './ParceiraFormPage.module.css';

const EMPTY_FORM: ParceiraFormValues = {
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

type FieldErrors = Partial<Record<keyof ParceiraFormValues, string>>;

export default function ParceiraFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<ParceiraFormValues>(EMPTY_FORM);
  const [consentimentoAceito, setConsentimentoAceito] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors & { consentimento_aceito?: string }
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && id) {
      getParceira(id)
        .then((parceira) => {
          setForm({
            nome: parceira.nome,
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
          });
        })
        .catch(() => setFormError('Não foi possível carregar os dados da parceira.'))
        .finally(() => setIsLoading(false));
    }
  }, [mode, id]);

  function updateField(field: keyof ParceiraFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const parceira =
        mode === 'edit' && id
          ? await updateParceira(id, {
              ...form,
              consentimento_aceito: consentimentoAceito,
            } as Partial<ParceiraFormValues> & { consentimento_aceito: boolean })
          : await createParceira({
              ...form,
              consentimento_aceito: consentimentoAceito,
            } as Partial<ParceiraFormValues> & { consentimento_aceito: boolean });
      navigate(`/parceiras/${parceira.id}`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]>;
        const mapped: FieldErrors & { consentimento_aceito?: string } = {};
        for (const key of Object.keys(errors)) {
          mapped[key as keyof ParceiraFormValues | 'consentimento_aceito'] = errors[key][0];
        }
        setFieldErrors(mapped);
      } else {
        setFormError('Não foi possível salvar a parceira. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>{mode === 'edit' ? 'Editar parceira' : 'Nova parceira'}</h2>
      </header>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Identificação</h3>
          <TextField
            label="Nome"
            value={form.nome}
            onChange={(event) => updateField('nome', event.target.value)}
            error={fieldErrors.nome}
            required
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            error={fieldErrors.email}
            required
          />
          <TextField
            label="Telefone"
            value={form.telefone}
            onChange={(event) => updateField('telefone', event.target.value)}
            error={fieldErrors.telefone}
            required
          />
          <TextField
            label="Instagram"
            value={form.instagram}
            onChange={(event) => updateField('instagram', event.target.value)}
            error={fieldErrors.instagram}
            required
          />
        </section>

        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Documentos</h3>
          <TextField
            label="CNPJ"
            value={form.cnpj}
            onChange={(event) => updateField('cnpj', event.target.value)}
            error={fieldErrors.cnpj}
          />
          <TextField
            label="Chave PIX"
            value={form.chave_pix}
            onChange={(event) => updateField('chave_pix', event.target.value)}
            error={fieldErrors.chave_pix}
            required
          />
        </section>

        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Dados contratuais</h3>
          <TextField
            label="Razão social"
            value={form.razao_social}
            onChange={(event) => updateField('razao_social', event.target.value)}
            error={fieldErrors.razao_social}
          />
          <TextField
            label="Canais de uso de imagem"
            value={form.canais_uso_imagem}
            onChange={(event) => updateField('canais_uso_imagem', event.target.value)}
            error={fieldErrors.canais_uso_imagem}
          />
          <TextField
            label="Prazo de uso de imagem"
            value={form.prazo_uso_imagem}
            onChange={(event) => updateField('prazo_uso_imagem', event.target.value)}
            error={fieldErrors.prazo_uso_imagem}
          />
        </section>

        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Endereço</h3>
          <div className={styles.row}>
            <TextField
              label="CEP"
              value={form.cep}
              onChange={(event) => updateField('cep', event.target.value)}
              error={fieldErrors.cep}
            />
            <TextField
              label="UF"
              value={form.uf}
              onChange={(event) => updateField('uf', event.target.value.toUpperCase())}
              error={fieldErrors.uf}
              maxLength={2}
              required
            />
          </div>
          <TextField
            label="Rua"
            value={form.rua}
            onChange={(event) => updateField('rua', event.target.value)}
            error={fieldErrors.rua}
          />
          <div className={styles.row}>
            <TextField
              label="Número"
              value={form.numero}
              onChange={(event) => updateField('numero', event.target.value)}
              error={fieldErrors.numero}
            />
            <TextField
              label="Complemento"
              value={form.complemento}
              onChange={(event) => updateField('complemento', event.target.value)}
              error={fieldErrors.complemento}
            />
          </div>
          <TextField
            label="Bairro"
            value={form.bairro}
            onChange={(event) => updateField('bairro', event.target.value)}
            error={fieldErrors.bairro}
          />
          <TextField
            label="Cidade"
            value={form.cidade}
            onChange={(event) => updateField('cidade', event.target.value)}
            error={fieldErrors.cidade}
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
            {mode === 'edit'
              ? 'Confirmo que os dados acima estão corretos e autorizo sua atualização.'
              : 'Confirmo que a parceira formalizou consentimento para o tratamento de seus dados pessoais, incluindo dados sensíveis, para fins de participação em campanhas.'}
          </label>
        </section>
        {fieldErrors.consentimento_aceito && (
          <p className={styles.formError} role="alert">
            {fieldErrors.consentimento_aceito}
          </p>
        )}

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} loadingText="salvando…" className={styles.submit}>
          salvar
        </Button>
      </form>
    </div>
  );
}
