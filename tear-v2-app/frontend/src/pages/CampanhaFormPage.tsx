import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  createCampanha,
  getCampanha,
  updateCampanha,
  type CampanhaFormValues,
  type CampanhaStatus,
} from '../lib/campanhas';
import { listMarcas, type Marca } from '../lib/marcas';
import TextField from '../components/TextField';
import SelectField from '../components/SelectField';
import Button from '../components/Button';
import styles from './CampanhaFormPage.module.css';

const EMPTY_FORM: CampanhaFormValues = {
  marca_id: '',
  nome: '',
  descricao: '',
  data_inicio: '',
  data_fim: '',
  status: 'PLANEJADA',
};

const STATUS_OPTIONS: CampanhaStatus[] = ['PLANEJADA', 'ATIVA', 'ENCERRADA', 'CANCELADA'];

type FieldErrors = Partial<Record<keyof CampanhaFormValues, string>>;

export default function CampanhaFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<CampanhaFormValues>(EMPTY_FORM);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listMarcas().then(setMarcas).catch(() => setMarcas([]));
  }, []);

  useEffect(() => {
    if (mode === 'edit' && id) {
      getCampanha(id)
        .then((campanha) => {
          setForm({
            marca_id: campanha.marca_id,
            nome: campanha.nome,
            descricao: campanha.descricao ?? '',
            data_inicio: campanha.data_inicio,
            data_fim: campanha.data_fim ?? '',
            status: campanha.status,
          });
        })
        .catch(() => setFormError('Não foi possível carregar os dados da campanha.'))
        .finally(() => setIsLoading(false));
    }
  }, [mode, id]);

  function updateField<K extends keyof CampanhaFormValues>(field: K, value: CampanhaFormValues[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const campanha =
        mode === 'edit' && id ? await updateCampanha(id, form) : await createCampanha(form);
      navigate(`/campanhas/${campanha.id}`);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]>;
        const mapped: FieldErrors = {};
        for (const key of Object.keys(errors)) {
          mapped[key as keyof CampanhaFormValues] = errors[key][0];
        }
        setFieldErrors(mapped);
      } else {
        setFormError('Não foi possível salvar a campanha. Tente novamente.');
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
        <h2 className={styles.title}>{mode === 'edit' ? 'Editar campanha' : 'Nova campanha'}</h2>
      </header>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.group}>
          <SelectField
            label="Marca"
            value={form.marca_id}
            onChange={(event) => updateField('marca_id', Number(event.target.value))}
            error={fieldErrors.marca_id}
            required
          >
            <option value="" disabled>
              selecione uma marca
            </option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nome}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Nome"
            value={form.nome}
            onChange={(event) => updateField('nome', event.target.value)}
            error={fieldErrors.nome}
            required
          />
          <TextField
            label="Descrição"
            value={form.descricao}
            onChange={(event) => updateField('descricao', event.target.value)}
            error={fieldErrors.descricao}
          />
        </section>

        <section className={styles.group}>
          <div className={styles.row}>
            <TextField
              label="Início"
              type="date"
              value={form.data_inicio}
              onChange={(event) => updateField('data_inicio', event.target.value)}
              error={fieldErrors.data_inicio}
              required
            />
            <TextField
              label="Fim"
              type="date"
              value={form.data_fim}
              onChange={(event) => updateField('data_fim', event.target.value)}
              error={fieldErrors.data_fim}
            />
          </div>

          {mode === 'edit' && (
            <SelectField
              label="Status"
              value={form.status}
              onChange={(event) => updateField('status', event.target.value as CampanhaStatus)}
              error={fieldErrors.status}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>
          )}
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
