import { useState, type FormEvent } from 'react';
import { forgotPassword } from '../lib/passwordReset';
import AuthSplitLayout from '../components/AuthSplitLayout';
import TextField from '../components/TextField';
import Button, { LinkButton } from '../components/Button';
import styles from './Login.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await forgotPassword(email);
    } finally {
      // Resposta sempre genérica de propósito: não revelamos se o e-mail
      // existe na base (mesma decisão de segurança do backend).
      setIsSubmitting(false);
      setIsDone(true);
    }
  }

  if (isDone) {
    return (
      <AuthSplitLayout>
        <header className={styles.header}>
          <h2 className={styles.title}>Verifique seu e-mail</h2>
          <p className={styles.subtitle}>
            Se houver uma conta para {email}, enviamos um link para redefinir a senha.
          </p>
        </header>
        <LinkButton to="/login" className={styles.submit}>
          voltar para o login
        </LinkButton>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <header className={styles.header}>
        <h2 className={styles.title}>Esqueci minha senha</h2>
        <p className={styles.subtitle}>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
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
        <Button type="submit" isLoading={isSubmitting} loadingText="enviando…" className={styles.submit}>
          enviar link
        </Button>
      </form>
    </AuthSplitLayout>
  );
}
