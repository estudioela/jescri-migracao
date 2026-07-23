import { useState, type FocusEvent, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { createParceiraPublica, type ParceiraFormValues } from '../lib/parceiras';
import { formatarCep, formatarCnpj, formatarTelefone } from '../lib/mascaras';
import { buscarEnderecoPorCep } from '../lib/cep';
import AuthSplitLayout from '../components/AuthSplitLayout';
import TextField from '../components/TextField';
import Button from '../components/Button';
import styles from './PublicCadastroPage.module.css';

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

type FieldErrors = Partial<Record<keyof ParceiraFormValues | 'consentimento_aceito', string>>;

export default function PublicCadastroPage() {
  const [form, setForm] = useState<ParceiraFormValues>(EMPTY_FORM);
  const [consentimentoAceito, setConsentimentoAceito] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  function updateField(field: keyof ParceiraFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCepBlur(event: FocusEvent<HTMLInputElement>) {
    const endereco = await buscarEnderecoPorCep(event.target.value);
    if (!endereco) return;

    setForm((current) =>
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await createParceiraPublica({
        ...form,
        consentimento_aceito: consentimentoAceito,
      } as Partial<ParceiraFormValues> & { consentimento_aceito: boolean });
      setIsDone(true);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]>;
        const mapped: FieldErrors = {};
        for (const key of Object.keys(errors)) {
          mapped[key as keyof ParceiraFormValues | 'consentimento_aceito'] = errors[key][0];
        }
        setFieldErrors(mapped);
      } else {
        setFormError('Não foi possível enviar seu cadastro. Tente novamente em instantes.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <AuthSplitLayout>
        <div className={styles.confirmation}>
          <h2 className={styles.confirmationTitle}>Cadastro enviado</h2>
          <p className={styles.confirmationText}>
            Recebemos seus dados. Nossa equipe vai analisar e entrar em contato em breve.
          </p>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <header className={styles.header}>
        <h2 className={styles.title}>Cadastro de parceira</h2>
        <p className={styles.subtitle}>Preencha seus dados para se cadastrar como influenciadora.</p>
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
            onChange={(event) => updateField('telefone', formatarTelefone(event.target.value))}
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
            onChange={(event) => updateField('cnpj', formatarCnpj(event.target.value))}
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
          <h3 className={styles.groupTitle}>Endereço</h3>
          <div className={styles.row}>
            <TextField
              label="CEP"
              value={form.cep}
              onChange={(event) => updateField('cep', formatarCep(event.target.value))}
              onBlur={handleCepBlur}
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
            Concordo expressamente com o tratamento dos meus dados pessoais, incluindo
            dados sensíveis (medidas corporais, quando informadas), para fins de
            participação em campanhas de moda e avaliação de fitting.
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

        <Button type="submit" isLoading={isSubmitting} loadingText="enviando…" className={styles.submit}>
          enviar cadastro
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
