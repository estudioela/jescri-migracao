import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { resetPassword } from '../lib/passwordReset';
import AuthSplitLayout from '../components/AuthSplitLayout';
import TextField from '../components/TextField';
import Button, { LinkButton } from '../components/Button';
import styles from './Login.module.css';

type FieldErrors = Partial<Record<'password' | 'password_confirmation', string>>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isTokenError, setIsTokenError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!token || !email) {
    return (
      <AuthSplitLayout>
        <header className={styles.header}>
          <h2 className={styles.title}>Link inválido</h2>
          <p className={styles.subtitle}>
            Este link de definição de senha está incompleto. Solicite um novo convite.
          </p>
        </header>
      </AuthSplitLayout>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsTokenError(false);
    setIsSubmitting(true);

    try {
      await resetPassword({
        token: token as string,
        email: email as string,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsDone(true);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data.errors as Record<string, string[]> | undefined;
        if (errors?.password) {
          setFieldErrors({ password: errors.password[0] });
        } else {
          setFormError(
            errors?.email?.[0] ??
              'Não foi possível concluir a redefinição de senha. Verifique o link enviado por e-mail.',
          );
          setIsTokenError(true);
        }
      } else {
        setFormError('Não foi possível definir sua senha. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <AuthSplitLayout>
        <header className={styles.header}>
          <h2 className={styles.title}>Senha definida</h2>
          <p className={styles.subtitle}>Sua senha foi criada com sucesso. Você já pode entrar.</p>
        </header>
        <LinkButton to="/login" className={styles.submit}>
          ir para o login
        </LinkButton>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <header className={styles.header}>
        <h2 className={styles.title}>Definir senha</h2>
        <p className={styles.subtitle}>Escolha uma senha para acessar o Portal da Influenciadora.</p>
      </header>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Nova senha"
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          autoComplete="new-password"
          required
        />
        <TextField
          label="Confirmar senha"
          id="password_confirmation"
          type="password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          error={fieldErrors.password_confirmation}
          autoComplete="new-password"
          required
        />
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting} loadingText="salvando…" className={styles.submit}>
          definir senha
        </Button>
        {isTokenError && (
          <Link to="/esqueci-senha" className={styles.forgotLink}>
            solicitar novo link
          </Link>
        )}
      </form>
    </AuthSplitLayout>
  );
}
