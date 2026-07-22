import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { aprovarParceira, getParceira, reenviarConvite, type Parceira } from '../lib/parceiras';
import { useAuth } from '../lib/auth';
import StatusBadge from '../components/StatusBadge';
import Button, { LinkButton } from '../components/Button';
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

  useEffect(() => {
    if (!id) return;
    getParceira(id)
      .then(setParceira)
      .catch(() => setError('Não foi possível carregar esta parceira.'));
  }, [id]);

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

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!parceira) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  const isAdmin = user?.role === 'ADMIN';
  const podeAprovar = isAdmin && parceira.status === 'Inativa';
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

      <Link to="/parceiras" className={styles.backLink}>
        ← voltar para a lista
      </Link>
    </div>
  );
}
