import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { createMarca, getMarca, updateMarca, type MarcaFormValues } from '../lib/marcas';
import TextField from '../components/TextField';
import Button from '../components/Button';
import styles from './MarcaFormPage.module.css';

const EMPTY_FORM: MarcaFormValues = {
  nome: '',
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  cnpj: '',
};

type FieldErrors = Partial<Record<keyof MarcaFormValues, string>>;

export default function MarcaFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<MarcaFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && id) {
      getMarca(id)
        .then((marca) => {
          setForm({
            nome: marca.nome,
            contato_nome: marca.contato_nome ?? '',
            contato_email: marca.contato_email ?? '',
            contato_telefone: marca.contato_telefone ?? '',
            cnpj: marca.cnpj ?? '',
          });
        })
        .catch(() => setFormError('Não foi possível carregar os dados da marca.'))
        .finally(() => setIsLoading(false));
    }
  }, [mode, id]);

  function updateField(field: keyof MarcaFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const marca = mode === 'edit' && id ? await updateMarca(id, form) : await createMarca(form);
      navigate(`/marcas/${marca.id}/editar`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]>;
        const mapped: FieldErrors = {};
        for (const key of Object.keys(errors)) {
          mapped[key as keyof MarcaFormValues] = errors[key][0];
        }
        setFieldErrors(mapped);
      } else {
        setFormError('Não foi possível salvar a marca. Tente novamente.');
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
        <h2 className={styles.title}>{mode === 'edit' ? 'Editar marca' : 'Nova marca'}</h2>
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
            label="CNPJ"
            value={form.cnpj}
            onChange={(event) => updateField('cnpj', event.target.value)}
            error={fieldErrors.cnpj}
          />
        </section>

        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Contato</h3>
          <TextField
            label="Nome do contato"
            value={form.contato_nome}
            onChange={(event) => updateField('contato_nome', event.target.value)}
            error={fieldErrors.contato_nome}
          />
          <TextField
            label="Email do contato"
            type="email"
            value={form.contato_email}
            onChange={(event) => updateField('contato_email', event.target.value)}
            error={fieldErrors.contato_email}
          />
          <TextField
            label="Telefone do contato"
            value={form.contato_telefone}
            onChange={(event) => updateField('contato_telefone', event.target.value)}
            error={fieldErrors.contato_telefone}
          />
        </section>

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
