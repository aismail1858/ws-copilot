interface SourcePrivacyViewProps {
  heading: string;
  title: string;
  secondaryLabel: string | null;
  badges: string[];
  details: { label: string; value: string }[];
  note: string;
}

export function SourcePrivacyView({ heading, title, secondaryLabel, badges, details, note }: SourcePrivacyViewProps) {
  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-[#756b62]">{heading}</h3>
      <h2 className="text-sm font-medium text-[#2f2b26]">{title}</h2>
      {secondaryLabel && <p className="text-xs text-[#756b62]">{secondaryLabel}</p>}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge) => (
            <span key={badge} className="px-2 py-0.5 text-xs rounded-full bg-[#2f2b26]/5 text-[#756b62]">{badge}</span>
          ))}
        </div>
      )}
      {details.length > 0 && (
        <dl className="space-y-1">
          {details.map((d) => (
            <div key={d.label} className="flex justify-between text-xs">
              <dt className="text-[#756b62]">{d.label}</dt>
              <dd className="text-[#2f2b26] font-medium">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-xs text-[#756b62] italic">{note}</p>
    </div>
  );
}
