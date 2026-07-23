import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  loadingText?: string;
};

export default function Button({
  variant = 'primary',
  isLoading = false,
  loadingText,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || isLoading} {...rest}>
      {isLoading ? loadingText ?? children : children}
    </button>
  );
}

type LinkButtonProps = LinkProps & {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
};

export function LinkButton({ variant = 'primary', className, children, ...rest }: LinkButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');

  return (
    <Link className={classes} {...rest}>
      {children}
    </Link>
  );
}
