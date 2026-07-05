// Circular progress ring component for upload progress

interface CircularProgressRingProps {
  progress: number;
}

export function CircularProgressRing({ progress }: CircularProgressRingProps) {
  const size = 28;
  const stroke = 2.75;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const dashOffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative h-7 w-7" role="img" aria-label={`Upload-Fortschritt ${safeProgress} Prozent`}>
      <svg className="h-7 w-7 -rotate-90" viewBox={`0 0 ${size} ${size}`} fill="none">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-zinc-200/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-zinc-100"
          style={{ transition: 'stroke-dashoffset 150ms ease' }}
        />
      </svg>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-zinc-100">
        {safeProgress}
      </span>
    </div>
  );
}
