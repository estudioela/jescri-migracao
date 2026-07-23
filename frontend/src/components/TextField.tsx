import { useId, type InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  action?: { label: string; onClick: () => void };
};

export default function TextField({ label, error, action, id, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        {action && (
          <button type="button" className={styles.action} onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
      <input
        id={inputId}
        className={[styles.input, error && styles.inputError].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
