import { useId, type TextareaHTMLAttributes } from 'react';
import styles from './TextField.module.css';

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export default function TextareaField({ label, error, id, ...rest }: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      </div>
      <textarea
        id={inputId}
        className={[styles.input, styles.textarea, error && styles.inputError]
          .filter(Boolean)
          .join(' ')}
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
