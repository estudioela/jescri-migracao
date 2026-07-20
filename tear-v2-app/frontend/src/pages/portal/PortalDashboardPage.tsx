import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { getMeParceira } from '../../lib/me';
import type { Parceira } from '../../lib/parceiras';
import StatusBadge from '../../components/StatusBadge';
import styles from '../Dashboard.module.css';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function perfilEstaCompleto(parceira: Parceira): boolean {
  return Boolean(parceira.cep && parceira.rua && parceira.cidade && parceira.uf);
}

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const [parceira, setParceira] = useState<Parceira | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeParceira()
      .then(setParceira)
      .catch(() => setError('Não foi possível carregar os dados da sua conta.'));
  }, []);

  if (!user) return null;

  const firstName = user.name.split(' ')[0];
  const greeting = greetingForHour(new Date().getHours());

  return (
    <>
      <section className={styles.greeting}>
        <h2 className={styles.greetingTitle}>
          {greeting}, {firstName}.
        </h2>
        <p className={styles.greetingSubtitle}>Este é o seu painel no Portal TEAR.</p>
      </section>

      {error && <p role="alert">{error}</p>}

      {parceira && (
        <section className={styles.cards}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Status da conta</h3>
            <p className={styles.cardMessage}>
              <StatusBadge status={parceira.status} />
            </p>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Próximos passos</h3>
            {perfilEstaCompleto(parceira) ? (
              <p className={styles.cardMessage}>
                Seu perfil está completo. Em breve suas campanhas aparecerão por aqui.
              </p>
            ) : (
              <>
                <p className={styles.cardMessage}>Complete seu endereço e medidas no seu perfil.</p>
                <Link to="/perfil" className={styles.cardLink}>
                  ir para o perfil
                </Link>
              </>
            )}
          </article>
        </section>
      )}
    </>
  );
}
