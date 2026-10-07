interface StatusPillProps {
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
}

const TONE_CLASSES: Record<StatusPillProps['tone'], string> = {
  positive: 'bg-green-100 text-green-800 border-green-300',
  neutral: 'bg-surface-container-high text-secondary border-outline-variant/30',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
};

export function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  );
}
