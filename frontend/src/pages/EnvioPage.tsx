import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  createEnvio,
  envioStatusTone,
  getEnvio,
  updateEnvioStatus,
  type Envio,
  type EnvioStatus,
} from '../lib/envios';
import { useAuth } from '../lib/auth';
import Badge from '../components/Badge';
import TextField from '../components/TextField';
import Button from '../components/Button';
import styles from './PagamentoPage.module.css';

const PROXIMO_STATUS: Partial<Record<EnvioStatus, EnvioStatus>> = {
  PENDENTE: 'EXPEDIDO',
  EXPEDIDO: 'ENTREGUE',
};

const ACAO_LABEL: Partial<Record<EnvioStatus, string>> = {
  PENDENTE: 'marcar como expedido',
  EXPEDIDO: 'marcar como entregue',
};

export default function EnvioPage() {
  const { participacaoId } = useParams<{ participacaoId: string }>();
  const { user } = useAuth();
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvancando, setIsAvancando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  function carregarEnvio() {
    if (!participacaoId) return;
    getEnvio(participacaoId)
      .then(setEnvio)
      .catch(() => setLoadError('Não foi possível carregar o envio.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(carregarEnvio, [participacaoId]);

  async function handleCriar() {
    if (!participacaoId) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const criado = await createEnvio(participacaoId, codigoRastreio);
      setEnvio(criado);
    } catch {
      setFormError('Não foi possível criar o envio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAvancar() {
    if (!envio) return;
    const proximo = PROXIMO_STATUS[envio.status];
    if (!proximo) return;

    setIsAvancando(true);
    setFormError(null);
    try {
      const atualizado = await updateEnvioStatus(envio.id, proximo);
      setEnvio(atualizado);
    } catch {
      setFormError('Não foi possível atualizar o envio.');
    } finally {
      setIsAvancando(false);
    }
  }

  if (loadError) {
    return <p className={styles.error}>{loadError}</p>;
  }

  if (isLoading) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Envio</h2>
      </header>

      {envio ? (
        <section className={styles.group}>
          <div className={styles.statusRow}>
            <Badge label={envio.status} tone={envioStatusTone(envio.status)} />
          </div>
          <p className={styles.valor}>Endereço: {envio.endereco_completo ?? '—'}</p>
          <p className={styles.valor}>Rastreio: {envio.codigo_rastreio ?? '—'}</p>

          {isAdmin && PROXIMO_STATUS[envio.status] && (
            <Button
              onClick={handleAvancar}
              isLoading={isAvancando}
              loadingText="atualizando…"
              className={styles.submit}
            >
              {ACAO_LABEL[envio.status]}
            </Button>
          )}
        </section>
      ) : (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Criar envio</h3>
          <TextField
            label="Código de rastreio (opcional)"
            value={codigoRastreio}
            onChange={(event) => setCodigoRastreio(event.target.value)}
          />
          <Button
            onClick={handleCriar}
            isLoading={isSubmitting}
            loadingText="salvando…"
            className={styles.submit}
          >
            criar envio
          </Button>
        </section>
      )}

      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      <Link to="/campanhas" className={styles.backLink}>
        ← voltar para campanhas
      </Link>
    </div>
  );
}
