'use client';

type OptionState = 'idle' | 'correct' | 'wrong' | 'dimmed';

interface Props {
  label: string;
  state: OptionState;
  onClick: () => void;
}

const stateStyles: Record<OptionState, string> = {
  idle: 'bg-card border-border text-ink hover:border-accent hover:bg-cream cursor-pointer',
  correct: 'bg-success-bg border-success text-success font-bold cursor-default',
  wrong: 'bg-error-bg border-error text-error font-bold cursor-default',
  dimmed: 'bg-card border-border text-ink opacity-40 cursor-default',
};

export default function OptionButton({ label, state, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== 'idle'}
      className={`w-full py-4 px-6 rounded-xl border text-lg font-medium text-center transition-all active:scale-[0.98] shadow-sm ${stateStyles[state]}`}
    >
      {label}
    </button>
  );
}
