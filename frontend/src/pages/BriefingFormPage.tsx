import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  createBriefing,
  listBriefings,
  updateBriefing,
  type Briefing,
  type BriefingFormValues,
  type TipoConteudo,
} from '../lib/briefings';
import TextField from '../components/TextField';
import TextareaField from '../components/TextareaField';
import SelectField from '../components/SelectField';
import Button from '../components/Button';
import { useAuth } from '../lib/auth';
import styles from './BriefingFormPage.module.css';

// TIKTOK/UGC removidos das opções selecionáveis: StoreParticipacaoRequest/
// UpdateParticipacaoRequest não aceitam tiktok_qtd/ugc_qtd, então
// quantidadeContratadaPara() sempre resolve 0 para esses tipos e a criação
// do Briefing falha 100% das vezes (RN-06). Reintroduzir quando o backend
// aceitar essas quantidades na participação.
const TIPOS: TipoConteudo[] = ['FEED', 'REELS', 'STORIES'];

const EMPTY_FORM: BriefingFormValues = {
  tipo: 'FEED',
  orientacoes: '',
  prazo: '',
  entregaveis_esperados: '',
};

type FieldErrors = Partial<Record<keyof BriefingFormValues, string>>;

export default function BriefingFormPage() {
  const { participacaoId } = useParams<{ participacaoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [form, setForm] = useState<BriefingFormValues>(EMPTY_FORM);
  const [existentes, setExistentes] = useState<Briefing[]>([]);
  const [editando, setEditando] = useState<Briefing | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!participacaoId) return;
    listBriefings(participacaoId)
      .then(setExistentes)
      .catch(() => setFormError('Não foi possível carregar os briefings desta participação.'))
      .finally(() => setIsLoading(false));
  }, [participacaoId]);

  function iniciarEdicao(item: Briefing) {
    setEditando(item);
    setForm({
      tipo: item.tipo,
      orientacoes: item.orientacoes,
      prazo: item.prazo,
      entregaveis_esperados: item.entregaveis_esperados ?? '',
    });
    setFieldErrors({});
    setFormError(null);
  }

  function iniciarNovo() {
    setEditando(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
  }

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
      if (editando) {
        const atualizado = await updateBriefing(editando.id, form);
        setExistentes((atual) => atual.map((b) => (b.id === atualizado.id ? atualizado : b)));
      } else {
        const criado = await createBriefing(participacaoId, form);
        setExistentes((atual) => [...atual, criado]);
      }
      iniciarNovo();
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]>;
        const mapped: FieldErrors = {};
        for (const key of Object.keys(errors)) {
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
        <h2 className={styles.title}>Briefing da participação</h2>
      </header>

      {existentes.length > 0 && (
        <ul className={styles.list}>
          {existentes.map((item) =>
            isAdmin ? (
              <li key={item.id}>
                <button type="button" onClick={() => iniciarEdicao(item)}>
                  {item.tipo} — {item.orientacoes.slice(0, 60)}
                </button>
              </li>
            ) : (
              <li key={item.id}>
                {item.tipo} — {item.orientacoes.slice(0, 60)}
              </li>
            ),
          )}
        </ul>
      )}

      {!isAdmin && (
        <Button type="button" onClick={() => navigate(-1)}>
          voltar
        </Button>
      )}

      {isAdmin && (
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h3>{editando ? `Editar briefing (${editando.tipo})` : 'Novo briefing'}</h3>

        {!editando && (
          <SelectField
            label="Tipo de conteúdo"
            value={form.tipo}
            onChange={(event) => updateField('tipo', event.target.value as TipoConteudo)}
            error={fieldErrors.tipo}
            required
          >
            {TIPOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </SelectField>
        )}

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
        {editando?.data_aprovacao_interna && (
          <p className={styles.derivedInfo}>
            Aprovação interna calculada: {editando.data_aprovacao_interna} (sempre −7 dias do
            prazo, nunca editável diretamente)
          </p>
        )}
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

        <div className={styles.actions}>
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="salvando…"
            className={styles.submit}
          >
            salvar
          </Button>
          <Button type="button" onClick={() => navigate(-1)}>
            voltar
          </Button>
        </div>
      </form>
      )}
    </div>
  );
}
