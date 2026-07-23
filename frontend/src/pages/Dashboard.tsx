import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/auth';
import { countParceiras } from '../lib/parceiras';
import { countCampanhas } from '../lib/campanhas';
import styles from './Dashboard.module.css';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador(a)',
  GESTOR_MARCA: 'Gestor(a) de Marca',
  INFLUENCIADORA: 'Influenciadora',
};

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [pendentes, setPendentes] = useState<number | null>(null);
  const [totalCampanhas, setTotalCampanhas] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    countParceiras({ status: 'Inativa' })
      .then(setPendentes)
      .catch(() => setPendentes(null));
  }, [user?.role]);

  useEffect(() => {
    countCampanhas({ status: 'ATIVA' })
      .then(setTotalCampanhas)
      .catch(() => setTotalCampanhas(null));
  }, []);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];
  const greeting = greetingForHour(new Date().getHours());
  const roleLabel = user.role ? ROLE_LABELS[user.role] : 'Sem papel atribuído';

  return (
    <>
      <section className={styles.greeting}>
        <h2 className={styles.greetingTitle}>
          {greeting}, {firstName}.
        </h2>
        <p className={styles.greetingSubtitle}>{roleLabel} — este é o seu painel ELÃ | influência.</p>
      </section>
      <section className={styles.cards}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Campanhas</h3>
          {totalCampanhas ? (
            <>
              <p className={styles.cardMessage}>
                {totalCampanhas} {totalCampanhas === 1 ? 'campanha ativa' : 'campanhas ativas'}.
              </p>
              <Link to="/campanhas?status=ATIVA" className={styles.cardLink}>
                ver campanhas
              </Link>
            </>
          ) : (
            <p className={styles.cardMessage}>Nenhuma campanha ativa no momento.</p>
          )}
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Colaborações</h3>
          <p className={styles.cardMessage}>Em breve — indicador ainda não implementado.</p>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Aprovações</h3>
          {pendentes ? (
            <>
              <p className={styles.cardMessage}>
                {pendentes} {pendentes === 1 ? 'inscrição aguardando' : 'inscrições aguardando'}{' '}
                aprovação.
              </p>
              <Link to="/parceiras?status=Inativa" className={styles.cardLink}>
                ver novas inscrições
              </Link>
            </>
          ) : (
            <p className={styles.cardMessage}>Nenhuma aprovação pendente.</p>
          )}
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Financeiro</h3>
          <p className={styles.cardMessage}>Em breve — indicador ainda não implementado.</p>
        </article>
      </section>
    </>
  );
}
