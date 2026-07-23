import { Link } from 'react-router-dom';
import AuthSplitLayout from '../components/AuthSplitLayout';
import { LinkButton } from '../components/Button';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  return (
    <AuthSplitLayout>
      <header className={styles.header}>
        <h2 className={styles.title}>Quero ser Parceira</h2>
        <p className={styles.subtitle}>
          Cadastre seus dados para participar das campanhas do TEAR. Nossa equipe analisa cada
          solicitação e retorna por e-mail.
        </p>
      </header>
      <LinkButton to="/cadastro" className={styles.cta}>
        quero ser parceira
      </LinkButton>
      <p className={styles.loginHint}>
        Já tem cadastro aprovado? <Link to="/login">entrar</Link>
      </p>
    </AuthSplitLayout>
  );
}
