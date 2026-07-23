import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import styles from './TextField.module.css';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
};

export default function SelectField({ label, error, id, children, ...rest }: SelectFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      </div>
      <select
        id={inputId}
        className={[styles.input, error && styles.inputError].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={`${inputId}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
