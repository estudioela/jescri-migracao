import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { campanhaStatusTone, getCampanha, type Campanha } from '../lib/campanhas';
import { listParceiras, type Parceira } from '../lib/parceiras';
import {
  createParticipacao,
  participacaoStatusTone,
  updateParticipacao,
  type Participacao,
} from '../lib/participacoes';
import Badge from '../components/Badge';
import TextField from '../components/TextField';
import SelectField from '../components/SelectField';
import Button, { LinkButton } from '../components/Button';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../lib/auth';
import styles from './CampanhaDetailPage.module.css';

type VincularForm = {
  parceira_id: string;
  valor_contratado: string;
  reels_qtd: string;
  carrossel_qtd: string;
  stories_qtd: string;
};

const EMPTY_VINCULAR_FORM: VincularForm = {
  parceira_id: '',
  valor_contratado: '',
  reels_qtd: '0',
  carrossel_qtd: '0',
  stories_qtd: '0',
};

export default function CampanhaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [parceirasAtivas, setParceirasAtivas] = useState<Parceira[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [vincularForm, setVincularForm] = useState<VincularForm>(EMPTY_VINCULAR_FORM);
  const [vincularErrors, setVincularErrors] = useState<Partial<Record<keyof VincularForm, string>>>({});
  const [vincularError, setVincularError] = useState<string | null>(null);
  const [isVinculando, setIsVinculando] = useState(false);

  function carregarCampanha() {
    if (!id) return;
    getCampanha(id)
      .then(setCampanha)
      .catch(() => setError('Não foi possível carregar esta campanha.'));
  }

  useEffect(carregarCampanha, [id]);

  useEffect(() => {
    listParceiras({ status: 'Ativa' })
      .then(setParceirasAtivas)
      .catch(() => setParceirasAtivas([]));
  }, []);

  function updateVincularField(field: keyof VincularForm, value: string) {
    setVincularForm((current) => ({ ...current, [field]: value }));
  }

  async function handleVincular(event: FormEvent) {
    event.preventDefault();
    if (!campanha) return;
    setVincularError(null);
    setVincularErrors({});
    setIsVinculando(true);

    try {
      await createParticipacao(campanha.id, {
        parceira_id: Number(vincularForm.parceira_id),
        valor_contratado: vincularForm.valor_contratado,
        reels_qtd: Number(vincularForm.reels_qtd),
        carrossel_qtd: Number(vincularForm.carrossel_qtd),
        stories_qtd: Number(vincularForm.stories_qtd),
      });
      setVincularForm(EMPTY_VINCULAR_FORM);
      carregarCampanha();
    } catch (submitError) {
      if (isAxiosError(submitError) && submitError.response?.status === 422) {
        const errors = submitError.response.data.errors as Record<string, string[]>;
        const mapped: Partial<Record<keyof VincularForm, string>> = {};
        for (const key of Object.keys(errors)) {
          mapped[key as keyof VincularForm] = errors[key][0];
        }
        setVincularErrors(mapped);
      } else {
        setVincularError('Não foi possível vincular a parceira. Tente novamente.');
      }
    } finally {
      setIsVinculando(false);
    }
  }

  async function handleCancelar(participacao: Participacao) {
    await updateParticipacao(participacao.id, { status: 'CANCELADA' });
    carregarCampanha();
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!campanha) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  const vinculadas = new Set(campanha.participacoes.map((participacao) => participacao.parceira_id));
  const parceirasDisponiveis = parceirasAtivas.filter((parceira) => !vinculadas.has(parceira.id));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{campanha.nome}</h2>
          <p className={styles.subtitle}>{campanha.marca.nome}</p>
          <div className={styles.statusRow}>
            <Badge label={campanha.status} tone={campanhaStatusTone(campanha.status)} />
          </div>
        </div>
        {isAdmin && (
          <LinkButton to={`/campanhas/${campanha.id}/editar`} variant="secondary">
            editar
          </LinkButton>
        )}
      </header>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Período</h3>
        <p className={styles.periodo}>
          {campanha.data_inicio}
          {campanha.data_fim ? ` – ${campanha.data_fim}` : ' (sem data de fim definida)'}
        </p>
        {campanha.descricao && <p className={styles.descricao}>{campanha.descricao}</p>}
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Parceiras vinculadas</h3>

        {campanha.participacoes.length === 0 && (
          <EmptyState
            title="Nenhuma parceira vinculada"
            message="Vincule uma parceira ativa a esta campanha usando o formulário abaixo."
          />
        )}

        {campanha.participacoes.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Parceira</th>
                <th>Valor</th>
                <th>Reels</th>
                <th>Carrossel</th>
                <th>Stories</th>
                <th>Status</th>
                <th aria-hidden="true" />
                <th aria-hidden="true" />
                <th aria-hidden="true" />
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {campanha.participacoes.map((participacao) => (
                <tr key={participacao.id}>
                  <td>
                    <Link to={`/parceiras/${participacao.parceira.id}`}>
                      {participacao.parceira.nome}
                    </Link>
                  </td>
                  <td>
                    {participacao.valor_contratado === null
                      ? '—'
                      : `R$ ${participacao.valor_contratado.toFixed(2)}`}
                  </td>
                  <td>{participacao.reels_qtd}</td>
                  <td>{participacao.carrossel_qtd}</td>
                  <td>{participacao.stories_qtd}</td>
                  <td>
                    <Badge
                      label={participacao.status}
                      tone={participacaoStatusTone(participacao.status)}
                    />
                  </td>
                  <td className={styles.actionCell}>
                    <Link
                      to={`/participacoes/${participacao.id}/briefing`}
                      className={styles.actionLink}
                    >
                      briefing
                    </Link>
                  </td>
                  <td className={styles.actionCell}>
                    <Link
                      to={`/participacoes/${participacao.id}/materiais`}
                      className={styles.actionLink}
                    >
                      materiais
                    </Link>
                  </td>
                  <td className={styles.actionCell}>
                    <Link
                      to={`/participacoes/${participacao.id}/pagamento`}
                      className={styles.actionLink}
                    >
                      pagamento
                    </Link>
                  </td>
                  <td className={styles.actionCell}>
                    {isAdmin && participacao.status === 'ATIVA' && (
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => handleCancelar(participacao)}
                      >
                        cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isAdmin && (
      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Vincular parceira</h3>

        {parceirasDisponiveis.length === 0 ? (
          <p className={styles.semParceiras}>
            Não há parceiras ativas disponíveis para vincular a esta campanha.
          </p>
        ) : (
          <form className={styles.vincularForm} onSubmit={handleVincular} noValidate>
            <SelectField
              label="Parceira"
              value={vincularForm.parceira_id}
              onChange={(event) => updateVincularField('parceira_id', event.target.value)}
              error={vincularErrors.parceira_id}
              required
            >
              <option value="" disabled>
                selecione uma parceira ativa
              </option>
              {parceirasDisponiveis.map((parceira) => (
                <option key={parceira.id} value={parceira.id}>
                  {parceira.nome}
                </option>
              ))}
            </SelectField>

            <TextField
              label="Valor contratado (R$)"
              type="number"
              step="0.01"
              min="0"
              value={vincularForm.valor_contratado}
              onChange={(event) => updateVincularField('valor_contratado', event.target.value)}
              error={vincularErrors.valor_contratado}
            />

            <div className={styles.row}>
              <TextField
                label="Reels"
                type="number"
                min="0"
                value={vincularForm.reels_qtd}
                onChange={(event) => updateVincularField('reels_qtd', event.target.value)}
                error={vincularErrors.reels_qtd}
              />
              <TextField
                label="Carrossel"
                type="number"
                min="0"
                value={vincularForm.carrossel_qtd}
                onChange={(event) => updateVincularField('carrossel_qtd', event.target.value)}
                error={vincularErrors.carrossel_qtd}
              />
              <TextField
                label="Stories"
                type="number"
                min="0"
                value={vincularForm.stories_qtd}
                onChange={(event) => updateVincularField('stories_qtd', event.target.value)}
                error={vincularErrors.stories_qtd}
              />
            </div>

            {vincularError && (
              <p className={styles.formError} role="alert">
                {vincularError}
              </p>
            )}

            <Button
              type="submit"
              isLoading={isVinculando}
              loadingText="vinculando…"
              className={styles.submit}
            >
              vincular parceira
            </Button>
          </form>
        )}
      </section>
      )}

      <Link to="/campanhas" className={styles.backLink}>
        ← voltar para a lista
      </Link>
    </div>
  );
}
