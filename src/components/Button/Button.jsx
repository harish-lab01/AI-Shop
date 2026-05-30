import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  icon,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        'btn-press',
        className,
      ].join(' ')}
    >
      {icon && <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>}
      {children}
    </button>
  );
}
