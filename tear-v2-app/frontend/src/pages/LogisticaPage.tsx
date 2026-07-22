import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCampanhas } from '../lib/campanhas';
import { participacaoStatusTone } from '../lib/participacoes';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import styles from './LogisticaPage.module.css';

type EnvioRow = {
  participacaoId: number;
  campanhaNome: string;
  parceiraNome: string;
  status: 'ATIVA' | 'CANCELADA';
};

export default function LogisticaPage() {
  const [rows, setRows] = useState<EnvioRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCampanhas({ status: 'ATIVA' })
      .then((campanhas) => {
        const flattened = campanhas.flatMap((campanha) =>
          campanha.participacoes
            .filter((participacao) => participacao.status === 'ATIVA')
            .map((participacao) => ({
              participacaoId: participacao.id,
              campanhaNome: campanha.nome,
              parceiraNome: participacao.parceira.nome,
              status: participacao.status,
            })),
        );
        setRows(flattened);
      })
      .catch(() => setError('Não foi possível carregar as participações. Tente novamente.'));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Logística</h2>
          <p className={styles.subtitle}>Envios das participações ativas, por campanha.</p>
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {rows === null && !error && <p className={styles.loading}>Carregando…</p>}

      {rows?.length === 0 && (
        <EmptyState
          title="Nenhuma participação ativa"
          message="Não há campanhas ativas com participações no momento."
        />
      )}

      {rows !== null && rows.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Campanha</th>
              <th>Parceira</th>
              <th>Status</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.participacaoId}>
                <td>{row.campanhaNome}</td>
                <td>{row.parceiraNome}</td>
                <td>
                  <Badge label={row.status} tone={participacaoStatusTone(row.status)} />
                </td>
                <td className={styles.actionCell}>
                  <Link
                    to={`/participacoes/${row.participacaoId}/envio`}
                    className={styles.actionLink}
                  >
                    ver envio
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
