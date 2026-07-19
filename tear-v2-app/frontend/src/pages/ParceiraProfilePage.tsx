import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getParceira, type Parceira } from '../lib/parceiras';
import StatusBadge from '../components/StatusBadge';
import { LinkButton } from '../components/Button';
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
  const [parceira, setParceira] = useState<Parceira | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getParceira(id)
      .then(setParceira)
      .catch(() => setError('Não foi possível carregar esta parceira.'));
  }, [id]);

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!parceira) {
    return <p className={styles.loading}>Carregando…</p>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{parceira.nome}</h2>
          <div className={styles.statusRow}>
            <StatusBadge status={parceira.status} />
          </div>
        </div>
        <LinkButton to={`/parceiras/${parceira.id}/editar`} variant="secondary">
          editar
        </LinkButton>
      </header>

      <section className={styles.group}>
        <h3 className={styles.groupTitle}>Identificação</h3>
        <Field label="Email" value={parceira.email} />
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
