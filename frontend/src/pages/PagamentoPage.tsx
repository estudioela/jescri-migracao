import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  createPagamento,
  getPagamento,
  pagamentoStatusTone,
  updatePagamentoStatus,
  uploadComprovante,
  type Pagamento,
  type PagamentoStatus,
} from '../lib/pagamentos';
import { useAuth } from '../lib/auth';
import Badge from '../components/Badge';
import TextField from '../components/TextField';
import Button from '../components/Button';
import styles from './PagamentoPage.module.css';

const PROXIMO_STATUS: Partial<Record<PagamentoStatus, PagamentoStatus>> = {
  PENDENTE: 'APROVADO',
  APROVADO: 'PAGO',
};

const ACAO_LABEL: Partial<Record<PagamentoStatus, string>> = {
  PENDENTE: 'aprovar',
  APROVADO: 'marcar como pago',
};

export default function PagamentoPage() {
  const { participacaoId } = useParams<{ participacaoId: string }>();
  const { user } = useAuth();
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [valor, setValor] = useState('');
  const [valorError, setValorError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isAvancando, setIsAvancando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEnviandoComprovante, setIsEnviandoComprovante] = useState(false);
  const [comprovanteError, setComprovanteError] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  function carregarPagamento() {
    if (!participacaoId) return;
    getPagamento(participacaoId)
      .then(setPagamento)
      .catch(() => setLoadError('Não foi possível carregar o pagamento.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(carregarPagamento, [participacaoId]);

  async function handleCriar(event: FormEvent) {
    event.preventDefault();
    if (!participacaoId) return;
    setFormError(null);
    setValorError(undefined);
    setIsSubmitting(true);

    try {
      const criado = await createPagamento(participacaoId, valor);
      setPagamento(criado);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]>;
        setValorError(errors.valor?.[0]);
      } else {
        setFormError('Não foi possível criar o pagamento. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAvancar() {
    if (!pagamento) return;
    const proximo = PROXIMO_STATUS[pagamento.status];
    if (!proximo) return;

    setIsAvancando(true);
    setFormError(null);
    try {
      const atualizado = await updatePagamentoStatus(pagamento.id, proximo);
      setPagamento(atualizado);
    } catch {
      setFormError('Não foi possível atualizar o pagamento.');
    } finally {
      setIsAvancando(false);
    }
  }

  async function handleEnviarComprovante(event: FormEvent) {
    event.preventDefault();
    if (!pagamento) return;
    const arquivo = fileInputRef.current?.files?.[0];
    if (!arquivo) {
      setComprovanteError('Selecione um arquivo.');
      return;
    }

    setComprovanteError(null);
    setIsEnviandoComprovante(true);
    try {
      const atualizado = await uploadComprovante(pagamento.id, arquivo);
      setPagamento(atualizado);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setComprovanteError('Não foi possível enviar o comprovante. Tente novamente.');
    } finally {
      setIsEnviandoComprovante(false);
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
        <h2 className={styles.title}>Pagamento</h2>
      </header>

      {pagamento ? (
        <section className={styles.group}>
          <div className={styles.statusRow}>
            <Badge label={pagamento.status} tone={pagamentoStatusTone(pagamento.status)} />
          </div>
          <p className={styles.valor}>R$ {pagamento.valor.toFixed(2)}</p>

          {isAdmin && PROXIMO_STATUS[pagamento.status] && (
            <Button onClick={handleAvancar} isLoading={isAvancando} loadingText="atualizando…" className={styles.submit}>
              {ACAO_LABEL[pagamento.status]}
            </Button>
          )}

          {pagamento.comprovante_url && (
            <a
              href={pagamento.comprovante_url}
              target="_blank"
              rel="noreferrer"
              className={styles.comprovanteLink}
            >
              ver comprovante de pagamento
            </a>
          )}

          {isAdmin && (
            <form className={styles.form} onSubmit={handleEnviarComprovante} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="comprovante">
                  {pagamento.comprovante_url ? 'Substituir comprovante' : 'Anexar comprovante'}
                </label>
                <input id="comprovante" type="file" ref={fileInputRef} className={styles.fileInput} />
              </div>

              {comprovanteError && (
                <p className={styles.formError} role="alert">
                  {comprovanteError}
                </p>
              )}

              <Button
                type="submit"
                isLoading={isEnviandoComprovante}
                loadingText="enviando…"
                className={styles.submit}
              >
                enviar comprovante
              </Button>
            </form>
          )}
        </section>
      ) : isAdmin ? (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Criar pagamento</h3>
          <form className={styles.form} onSubmit={handleCriar} noValidate>
            <TextField
              label="Valor (R$)"
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              error={valorError}
              required
            />

            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}

            <Button type="submit" isLoading={isSubmitting} loadingText="salvando…" className={styles.submit}>
              criar pagamento
            </Button>
          </form>
        </section>
      ) : null}

      {formError && pagamento && (
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
