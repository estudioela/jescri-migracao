import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMarcas, type Marca } from '../lib/marcas';
import EmptyState from '../components/EmptyState';
import { LinkButton } from '../components/Button';
import styles from './MarcasListPage.module.css';

export default function MarcasListPage() {
  const [marcas, setMarcas] = useState<Marca[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMarcas()
      .then(setMarcas)
      .catch(() => setError('Não foi possível carregar as marcas. Tente novamente.'));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Marcas</h2>
          <p className={styles.subtitle}>Clientes para quem a equipe roda campanhas.</p>
        </div>
        <LinkButton to="/marcas/nova">nova marca</LinkButton>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {marcas === null && !error && <p className={styles.loading}>Carregando…</p>}

      {marcas?.length === 0 && (
        <EmptyState
          title="Nenhuma marca cadastrada"
          message="Você ainda não possui marcas cadastradas."
          action={<LinkButton to="/marcas/nova">cadastrar primeira marca</LinkButton>}
        />
      )}

      {marcas !== null && marcas.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th>Contato</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {marcas.map((marca) => (
              <tr key={marca.id}>
                <td>{marca.nome}</td>
                <td>{marca.status}</td>
                <td>{marca.contato_email ?? '—'}</td>
                <td className={styles.actionCell}>
                  <Link to={`/marcas/${marca.id}/editar`} className={styles.actionLink}>
                    editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
