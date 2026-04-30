'use client';

interface Props {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function PrimaryButton({ label, onClick, variant = 'primary', disabled }: Props) {
  const base =
    'w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-sm transition-all active:scale-[0.98]';
  const styles = {
    primary: 'bg-accent text-white hover:bg-accent-dark',
    secondary: 'bg-card text-ink border border-border',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );
}
