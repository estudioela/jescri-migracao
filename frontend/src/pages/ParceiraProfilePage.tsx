import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  aprovarParceira,
  getParceira,
  reenviarConvite,
  reprovarParceira,
  type Parceira,
} from '../lib/parceiras';
import { listHistorico, type HistoricoAlteracao } from '../lib/historico';
import { useAuth } from '../lib/auth';
import StatusBadge from '../components/StatusBadge';
import Button, { LinkButton } from '../components/Button';
import TextareaField from '../components/TextareaField';
import styles from './ParceiraProfilePage.module.css';

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value && value !== '' ? value : '—'}</span>
    </div>
  );
}

export default function ParceiraProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [parceira, setParceira] = useState<Parceira | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAprovando, setIsAprovando] = useState(false);
  const [aprovacaoErro, setAprovacaoErro] = useState<string | null>(null);
  const [isReenviando, setIsReenviando] = useState(false);
  const [reenvioErro, setReenvioErro] = useState<string | null>(null);
  const [reenvioSucesso, setReenvioSucesso] = useState(false);
  const [mostrarFormReprovar, setMostrarFormReprovar] = useState(false);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [isReprovando, setIsReprovando] = useState(false);
  const [reprovacaoErro, setReprovacaoErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoAlteracao[] | null>(null);
  const [historicoErro, setHistoricoErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getParceira(id)
      .then(setParceira)
      .catch(() => setError('Não foi possível carregar esta parceira.'));
  }, [id]);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!id || !isAdmin) return;
    listHistorico(id)
      .then(setHistorico)
      .catch(() => setHistoricoErro('Não foi possível carregar o histórico de alterações.'));
  }, [id, isAdmin]);

  async function handleAprovar() {
    if (!parceira) return;
    setIsAprovando(true);
    setAprovacaoErro(null);
    try {
      const atualizada = await aprovarParceira(parceira.id);
      setParceira(atualizada);
    } catch {
      setAprovacaoErro('Não foi possível aprovar esta parceira. Tente novamente.');
    } finally {
      setIsAprovando(false);
    }
  }

  async function handleReenviarConvite() {
    if (!parceira) return;
    setIsReenviando(true);
    setReenvioErro(null);
    setReenvioSucesso(false);
    try {
      await reenviarConvite(parceira.id);
      setReenvioSucesso(true);
    } catch {
      setReenvioErro('Não foi possível reenviar o convite. Tente novamente.');
    } finally {
      setIsReenviando(false);
    }
  }

  async function handleReprovar() {
    if (!parceira) return;
    setIsReprovando(true);
    setReprovacaoErro(null);
    try {
      const atualizada = await reprovarParceira(parceira.id, motivoReprovacao);
      setParceira(atualizada);
      setMostrarFormReprovar(false);
      setMotivoReprovacao('');
    } catch {
      setReprovacaoErro('Não foi possível reprovar esta parceira. Tente novamente.');
    } finally {
      setIsReprovando(false);
    }
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!parceira) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  const podeDecidir = isAdmin && parceira.status === 'Inativa';
  const podeAprovar = podeDecidir;
  const podeReprovar = podeDecidir && !parceira.reprovado_em;
  const podeReenviarConvite = isAdmin && parceira.status === 'Ativa';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{parceira.nome}</h2>
          <div className={styles.statusRow}>
            <StatusBadge status={parceira.status} />
          </div>
        </div>
        <div className={styles.headerActions}>
          {podeAprovar && (
            <Button onClick={handleAprovar} isLoading={isAprovando} loadingText="aprovando…">
              aprovar
            </Button>
          )}
          {podeReenviarConvite && (
            <Button
              onClick={handleReenviarConvite}
              isLoading={isReenviando}
              loadingText="reenviando…"
              variant="secondary"
            >
              reenviar convite
            </Button>
          )}
          {podeReprovar && !mostrarFormReprovar && (
            <Button variant="secondary" onClick={() => setMostrarFormReprovar(true)}>
              reprovar
            </Button>
          )}
          {isAdmin && (
            <LinkButton to={`/parceiras/${parceira.id}/editar`} variant="secondary">
              editar
            </LinkButton>
          )}
        </div>
      </header>

      {aprovacaoErro && <p className={styles.error}>{aprovacaoErro}</p>}
      {reenvioErro && <p className={styles.error}>{reenvioErro}</p>}
      {reenvioSucesso && <p className={styles.success}>Convite reenviado com sucesso.</p>}

      {parceira.reprovado_em && (
        <p className={styles.error} role="status">
          Solicitação reprovada em {new Date(parceira.reprovado_em).toLocaleDateString('pt-BR')}
          {parceira.motivo_reprovacao ? `: ${parceira.motivo_reprovacao}` : '.'}
        </p>
      )}

      {mostrarFormReprovar && (
        <div className={styles.group}>
          <TextareaField
            label="Motivo da reprovação (opcional)"
            value={motivoReprovacao}
            onChange={(event) => setMotivoReprovacao(event.target.value)}
            rows={3}
          />
          {reprovacaoErro && <p className={styles.error}>{reprovacaoErro}</p>}
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              onClick={handleReprovar}
              isLoading={isReprovando}
              loadingText="reprovando…"
            >
              confirmar reprovação
            </Button>
            <Button variant="secondary" onClick={() => setMostrarFormReprovar(false)}>
              cancelar
            </Button>
          </div>
        </div>
      )}

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Identificação</h3>
        <Field label="Email" value={parceira.email} />
        <Field label="Telefone" value={parceira.telefone} />
        <Field label="Instagram" value={parceira.instagram} />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Documentos</h3>
        <Field label="CNPJ" value={parceira.cnpj} />
        <Field label="Chave PIX" value={parceira.chave_pix} />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Endereço</h3>
        <Field label="Endereço completo" value={parceira.endereco_completo} />
        <Field label="CEP" value={parceira.cep} />
      </section>

      {isAdmin && (
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Histórico de alterações</h3>
          {historicoErro && <p className={styles.error}>{historicoErro}</p>}
          {historico === null && !historicoErro && (
            <p className={styles.loading}>Carregando…</p>
          )}
          {historico?.length === 0 && (
            <p className={styles.fieldValue}>Nenhuma alteração registrada.</p>
          )}
          {historico !== null && historico.length > 0 && (
            <ul className={styles.historicoList}>
              {historico.map((item) => (
                <li key={item.id} className={styles.historicoItem}>
                  <span className={styles.fieldLabel}>
                    {item.campo}
                    {item.criado_em
                      ? ` — ${new Date(item.criado_em).toLocaleString('pt-BR')}`
                      : ''}
                    {item.autor ? ` — ${item.autor}` : ''}
                  </span>
                  <span className={styles.fieldValue}>
                    {item.valor_anterior ?? '—'} → {item.valor_novo ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Link to="/parceiras" className={styles.backLink}>
        ← voltar para a lista
      </Link>
    </div>
  );
}
