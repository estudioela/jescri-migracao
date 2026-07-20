import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  createBriefing,
  getBriefing,
  updateBriefing,
  type Briefing,
  type BriefingFormValues,
} from '../lib/briefings';
import TextField from '../components/TextField';
import TextareaField from '../components/TextareaField';
import Button from '../components/Button';
import styles from './BriefingFormPage.module.css';

const EMPTY_FORM: BriefingFormValues = {
  orientacoes: '',
  prazo: '',
  entregaveis_esperados: '',
};

type FieldErrors = Partial<Record<keyof BriefingFormValues, string>>;

export default function BriefingFormPage() {
  const { participacaoId } = useParams<{ participacaoId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<BriefingFormValues>(EMPTY_FORM);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!participacaoId) return;
    getBriefing(participacaoId)
      .then((existing) => {
        setBriefing(existing);
        if (existing) {
          setForm({
            orientacoes: existing.orientacoes,
            prazo: existing.prazo,
            entregaveis_esperados: existing.entregaveis_esperados ?? '',
          });
        }
      })
      .catch(() => setFormError('Não foi possível carregar o briefing.'))
      .finally(() => setIsLoading(false));
  }, [participacaoId]);

  function updateField<K extends keyof BriefingFormValues>(
    field: K,
    value: BriefingFormValues[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!participacaoId) return;
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (briefing) {
        await updateBriefing(briefing.id, form);
      } else {
        await createBriefing(participacaoId, form);
      }
      navigate(-1);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]>;
        const mapped: FieldErrors = {};
        for (const key of Object.keys(errors)) {
          if (key === 'participacao_id') {
            setFormError(errors[key][0]);
            continue;
          }
          mapped[key as keyof BriefingFormValues] = errors[key][0];
        }
        setFieldErrors(mapped);
      } else {
        setFormError('Não foi possível salvar o briefing. Tente novamente.');
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
        <h2 className={styles.title}>{briefing ? 'Editar briefing' : 'Novo briefing'}</h2>
      </header>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextareaField
          label="Orientações"
          value={form.orientacoes}
          onChange={(event) => updateField('orientacoes', event.target.value)}
          error={fieldErrors.orientacoes}
          rows={5}
          required
        />
        <TextField
          label="Prazo"
          type="date"
          value={form.prazo}
          onChange={(event) => updateField('prazo', event.target.value)}
          error={fieldErrors.prazo}
          required
        />
        <TextareaField
          label="Entregáveis esperados"
          value={form.entregaveis_esperados}
          onChange={(event) => updateField('entregaveis_esperados', event.target.value)}
          error={fieldErrors.entregaveis_esperados}
          rows={3}
        />

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          isLoading={isSubmitting}
          loadingText="salvando…"
          className={styles.submit}
        >
          salvar
        </Button>
      </form>
    </div>
  );
}
