import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import AuthSplitLayout from '../components/AuthSplitLayout';
import TextField from '../components/TextField';
import Button from '../components/Button';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch {
      setError('Email ou senha inválidos. Verifique e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout>
      <header className={styles.header}>
        <h2 className={styles.title}>Entrar</h2>
        <p className={styles.subtitle}>Informe suas credenciais para continuar.</p>
      </header>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          id="email"
          type="email"
          placeholder="nome@estudioela.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          label="Senha"
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting} loadingText="entrando…" className={styles.submit}>
          entrar
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
