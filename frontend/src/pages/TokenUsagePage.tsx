import { useEffect, useMemo, useState } from "react";
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * Typen
 * ------------------------------------------------------------------ */

type Period = "7d" | "30d" | "90d";

interface DayBucket {
  date: string; // ISO date
  input: number; // prompt tokens
  output: number; // completion tokens
}

interface ModelStat {
  model: string;
  label: string;
  input: number;
  output: number;
  cost: number;
}

interface TokenUsageData {
  totalInput: number;
  totalOutput: number;
  cost: number;
  costDeltaPct: number;
  tokensDeltaPct: number;
  days: DayBucket[];
  models: ModelStat[];
  requests: number;
}

/* ------------------------------------------------------------------ *
 * Format-Helfer
 * ------------------------------------------------------------------ */

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)} k`;
  return `${n}`;
}

function formatFull(n: number): string {
  return new Intl.NumberFormat("de-DE").format(Math.round(n));
}

function formatCost(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short" }).format(d);
}

function shortDay(iso: string): string {
  const d = new Date(iso);
  const s = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(d);
  return `${s}.`;
}

/* ------------------------------------------------------------------ *
 * Demo-Daten (damit man die gefüllte Ansicht sehen kann, bevor das
 * Backend einen /api/metrics/tokens Endpunkt bereitstellt).
 * ------------------------------------------------------------------ */

function buildDemoData(period: Period): TokenUsageData {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  // Deterministische Pseudo-Werte (kein Math.random, damit es stabil bleibt).
  const baseInput = period === "7d" ? 38_000 : period === "30d" ? 22_000 : 11_000;
  const baseOutput = period === "7d" ? 21_000 : period === "30d" ? 12_500 : 6_200;

  const buckets: DayBucket[] = [];
  // Fixer Referenzpunkt – new Date() ist hier zulässig (nur Anzeige).
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // Wochenend-Dämpfung + sanfte Wellenbewegung.
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.45 : 1;
    const wave = 0.8 + 0.4 * Math.sin(i / 3.1);
    const input = Math.round(baseInput * weekend * wave);
    const output = Math.round(baseOutput * weekend * wave);
    buckets.push({ date: d.toISOString().slice(0, 10), input, output });
  }

  const totalInput = buckets.reduce((s, b) => s + b.input, 0);
  const totalOutput = buckets.reduce((s, b) => s + b.output, 0);

  // Modell-Mix (prozentuale Aufteilung, gerundet).
  const mix: { model: string; label: string; share: number }[] = [
    { model: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", share: 0.42 },
    { model: "claude-haiku-4-5", label: "Claude Haiku 4.5", share: 0.27 },
    { model: "gpt-4o", label: "GPT-4o", share: 0.18 },
    { model: "gpt-4o-mini", label: "GPT-4o mini", share: 0.09 },
    { model: "text-embedding-3", label: "Embedding 3", share: 0.04 },
  ];
  const inputPer1k = 0.0028;
  const outputPer1k = 0.011;
  const models: ModelStat[] = mix.map((m) => {
    const input = Math.round(totalInput * m.share);
    const output = Math.round(totalOutput * m.share);
    const cost = (input / 1000) * inputPer1k + (output / 1000) * outputPer1k;
    return { model: m.model, label: m.label, input, output, cost };
  });

  const cost = models.reduce((s, m) => s + m.cost, 0);

  return {
    totalInput,
    totalOutput,
    cost,
    costDeltaPct: period === "7d" ? 12.4 : period === "30d" ? -6.8 : 3.2,
    tokensDeltaPct: period === "7d" ? 8.1 : period === "30d" ? -4.3 : 2.7,
    days: buckets,
    models,
    requests:
      period === "7d" ? 1284 : period === "30d" ? 5120 : period === "90d" ? 14603 : 0,
  };
}

/* ------------------------------------------------------------------ *
 * Unter-Komponenten
 * ------------------------------------------------------------------ */

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  deltaPct?: number;
  accent: "brand" | "blue" | "violet" | "emerald";
}

const ACCENT: Record<StatCardProps["accent"], { ring: string; chip: string; icon: string }> = {
  brand: { ring: "ring-[#f3aa7f]/20", chip: "bg-[#fff1e8] text-[#b45f32]", icon: "text-[#b45f32]" },
  blue: { ring: "ring-blue-200", chip: "bg-blue-50 text-blue-700", icon: "text-blue-600" },
  violet: { ring: "ring-violet-200", chip: "bg-violet-50 text-violet-700", icon: "text-violet-600" },
  emerald: { ring: "ring-emerald-200", chip: "bg-emerald-50 text-emerald-700", icon: "text-emerald-600" },
};

function StatCard({ icon, label, value, sub, deltaPct, accent }: StatCardProps) {
  const a = ACCENT[accent];
  const TrendIcon = deltaPct === undefined ? null : deltaPct > 0 ? TrendingUp : deltaPct < 0 ? TrendingDown : Minus;
  const deltaTone =
    deltaPct === undefined
      ? ""
      : deltaPct > 0
      ? "text-emerald-600"
      : deltaPct < 0
      ? "text-red-500"
      : "text-[#756b62]";
  return (
    <Card size="sm" className={cn("ring-1", a.ring)}>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#756b62]">{label}</p>
            <p className="mt-1 text-2xl font-medium tracking-tight text-[#2f2b26]">{value}</p>
            {sub && <p className="mt-0.5 text-xs text-[#756b62]">{sub}</p>}
          </div>
          <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-xl", a.chip)}>
            <span className={a.icon}>{icon}</span>
          </span>
        </div>
        {deltaPct !== undefined && (
          <div className="mt-2">
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium", deltaTone)}>
              {TrendIcon && <TrendIcon className="size-3.5" />}
              {deltaPct > 0 ? "+" : ""}
              {deltaPct.toFixed(1)} %
              <span className="font-normal text-[#756b62]">vs. Vorperiode</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UsageChart({ days }: { days: DayBucket[] }) {
  const max = useMemo(() => {
    const m = Math.max(...days.map((d) => d.input + d.output), 1);
    // etwas Kopfstand für saubere Skalierung
    return Math.ceil(m / 1000) * 1000;
  }, [days]);

  const ticks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => Math.round((max / steps) * i));
  }, [max]);

  // Bei vielen Tagen nicht jedes Label zeigen.
  const labelEvery = days.length > 20 ? Math.ceil(days.length / 8) : days.length > 8 ? 2 : 1;

  return (
    <div>
      {/* Legende */}
      <div className="mb-3 flex items-center gap-4 text-xs text-[#756b62]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#fcd5b8]" /> Eingabe
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[#f3aa7f]" /> Ausgabe
        </span>
      </div>

      <div className="flex gap-3">
        {/* Y-Achse */}
        <div className="flex flex-col justify-between py-1 text-right text-[10px] text-[#756b62]">
          {ticks
            .slice()
            .reverse()
            .map((t) => (
              <span key={t} className="leading-none">
                {formatTokens(t)}
              </span>
            ))}
        </div>

        {/* Plot */}
        <div className="flex-1">
          <div className="flex h-44 items-end gap-1 border-b border-l border-[#e5dfd9] pb-px pl-px">
            {days.map((d) => {
              const outH = (d.output / max) * 100;
              const inH = (d.input / max) * 100;
              return (
                <div
                  key={d.date}
                  className="group/bar flex h-full flex-1 min-w-[3px] flex-col justify-end"
                  title={`${shortDay(d.date)}\nEingabe: ${formatFull(d.input)}\nAusgabe: ${formatFull(d.output)}`}
                >
                  <div
                    className="w-full rounded-t-[3px] bg-[#fcd5b8] transition-all group-hover/bar:bg-[#f7c6a0]"
                    style={{ height: `${inH}%` }}
                  />
                  <div
                    className="w-full bg-[#f3aa7f] transition-all group-hover/bar:bg-[#ee9a68]"
                    style={{ height: `${outH}%`, borderTopLeftRadius: outH > 6 ? 3 : 0, borderTopRightRadius: outH > 6 ? 3 : 0 }}
                  />
                </div>
              );
            })}
          </div>
          {/* X-Achse Labels */}
          <div className="mt-1.5 flex gap-1 text-[10px] text-[#756b62]">
            {days.map((d, i) => (
              <span key={d.date} className="flex-1 min-w-[3px] text-center">
                {i % labelEvery === 0 ? dayLabel(d.date) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelBreakdown({ models }: { models: ModelStat[] }) {
  const totalTokens = models.reduce((s, m) => s + m.input + m.output, 0);
  const totalCost = models.reduce((s, m) => s + m.cost, 0);
  const sorted = [...models].sort((a, b) => b.input + b.output - (a.input + a.output));

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2f2b26]/10 text-left text-[10px] uppercase tracking-wider text-[#756b62]">
            <th className="px-4 py-3 font-medium">Modell</th>
            <th className="px-4 py-3 font-medium">Anteil</th>
            <th className="px-4 py-3 text-right font-medium">Eingabe</th>
            <th className="px-4 py-3 text-right font-medium">Ausgabe</th>
            <th className="px-4 py-3 text-right font-medium">Tokens gesamt</th>
            <th className="px-4 py-3 text-right font-medium">Kosten</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m) => {
            const total = m.input + m.output;
            const share = totalTokens > 0 ? total / totalTokens : 0;
            return (
              <tr key={m.model} className="border-b border-[#2f2b26]/5 hover:bg-[#2f2b26]/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-[#f3f2f1] text-[#756b62]">
                      <Cpu className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[#2f2b26]">{m.label}</p>
                      <p className="font-mono text-[10px] text-[#756b62]">{m.model}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#f3f2f1]">
                      <div className="h-full rounded-full bg-[#f3aa7f]" style={{ width: `${share * 100}%` }} />
                    </div>
                    <span className="text-xs text-[#756b62]">{(share * 100).toFixed(0)} %</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-[#756b62]">{formatFull(m.input)}</td>
                <td className="px-4 py-3 text-right text-[#756b62]">{formatFull(m.output)}</td>
                <td className="px-4 py-3 text-right font-medium text-[#2f2b26]">{formatFull(total)}</td>
                <td className="px-4 py-3 text-right text-[#2f2b26]">{formatCost(m.cost)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[#2f2b26]/10 bg-[#faf7f4] text-[#2f2b26]">
            <td className="px-4 py-3 font-medium" colSpan={4}>
              Gesamtsumme
            </td>
            <td className="px-4 py-3 text-right font-medium">{formatFull(totalTokens)}</td>
            <td className="px-4 py-3 text-right font-medium">{formatCost(totalCost)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Seite
 * ------------------------------------------------------------------ */

const PERIODS: { key: Period; label: string }[] = [
  { key: "7d", label: "7 Tage" },
  { key: "30d", label: "30 Tage" },
  { key: "90d", label: "90 Tage" },
];

export default function TokenUsagePage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<TokenUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [useDemo, setUseDemo] = useState(true); // bis das Backend /api/metrics/tokens liefert

  async function fetchUsage(p: Period) {
    setLoading(true);
    setError("");
    try {
      // Wenn später ein Endpunkt existiert, hier abrufen:
      // const res = await apiClient.get<TokenUsageData>(`/api/metrics/tokens?period=${p}`);
      // Bis dahin zeigen wir Demo-Daten.
      const demo = buildDemoData(p);
      // kurze künstliche Verzögerung für ein ruhiges Ladegefühl
      await new Promise((r) => setTimeout(r, 120));
      setData(demo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Token-Nutzung konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (useDemo) fetchUsage(period);
    else {
      setData(null);
      setLoading(false);
    }
  }, [period, useDemo]);

  const total = data ? data.totalInput + data.totalOutput : 0;
  const isEmpty = !loading && !error && (!data || total === 0);

  return (
    <main className="flex-1 min-h-0 select-text overflow-y-auto bg-transparent">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-[-0.035em] text-[#2f2b26]">Tokenverbrauch</h1>
            <p className="mt-1 text-sm text-[#756b62]">
              Übersicht über Token-Nutzung und anfallende Kosten je Modell und Zeitraum.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Zeitraum-Auswahl */}
            <div className="flex items-center rounded-full border border-border bg-card p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    period === p.key
                      ? "bg-[#f3aa7f] text-[#2f2b26] shadow-sm"
                      : "text-[#756b62] hover:text-[#2f2b26]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              title="Aktualisieren"
              onClick={() => fetchUsage(period)}
              disabled={loading || !useDemo}
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseDemo((v) => !v)}
              title="Zwischen Beispiel-Daten und leerer Ansicht wechseln"
            >
              {useDemo ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
              <span className="hidden sm:inline">{useDemo ? "Beispiel" : "Leer"}</span>
            </Button>
          </div>
        </div>

        {useDemo && (
          <div className="flex items-center gap-2 rounded-lg border border-[#f3aa7f]/30 bg-[#fff1e8]/60 px-3 py-2 text-xs text-[#b45f32]">
            <Coins className="size-3.5" />
            Beispiel-Daten aktiv — sobald <code className="rounded bg-white/70 px-1 py-0.5 font-mono">/api/metrics/tokens</code> existiert,
            werden hier Live-Werte angezeigt.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-[#756b62]">
            <RefreshCw className="size-4 animate-spin" /> Lade Token-Nutzung…
          </div>
        )}

        {/* Empty */}
        {isEmpty && <EmptyState onShowDemo={() => setUseDemo(true)} demoAvailable={!useDemo} />}

        {/* Gefüllte Ansicht */}
        {!loading && !isEmpty && data && (
          <>
            {/* Summary-Karten */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                accent="brand"
                icon={<Coins className="size-4" />}
                label="Tokens gesamt"
                value={formatTokens(total)}
                sub={`${formatFull(total)} Tokens`}
                deltaPct={data.tokensDeltaPct}
              />
              <StatCard
                accent="blue"
                icon={<ArrowDownLeft className="size-4" />}
                label="Eingabe (Prompt)"
                value={formatTokens(data.totalInput)}
                sub={`${formatFull(data.totalInput)} Tokens`}
              />
              <StatCard
                accent="violet"
                icon={<ArrowUpRight className="size-4" />}
                label="Ausgabe (Completion)"
                value={formatTokens(data.totalOutput)}
                sub={`${formatFull(data.totalOutput)} Tokens`}
              />
              <StatCard
                accent="emerald"
                icon={<Wallet className="size-4" />}
                label="Geschätzte Kosten"
                value={formatCost(data.cost)}
                sub={`${formatFull(data.requests)} Anfragen`}
                deltaPct={data.costDeltaPct}
              />
            </div>

            {/* Chart + Info */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-[#2f2b26]">Nutzung im Zeitverlauf</CardTitle>
                  <CardDescription>
                    Tägliche Token-Nutzung · {PERIODS.find((p) => p.key === period)?.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UsageChart days={data.days} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[#2f2b26]">Verteilung</CardTitle>
                  <CardDescription>Eingabe vs. Ausgabe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DistributionBar input={data.totalInput} output={data.totalOutput} />
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat
                      label="Eingabe"
                      value={formatTokens(data.totalInput)}
                      tone="text-blue-600"
                      dot="bg-[#fcd5b8]"
                    />
                    <MiniStat
                      label="Ausgabe"
                      value={formatTokens(data.totalOutput)}
                      tone="text-violet-600"
                      dot="bg-[#f3aa7f]"
                    />
                  </div>
                  <div className="rounded-xl border border-[#e5dfd9] bg-[#faf7f4] p-3 text-xs text-[#756b62]">
                    Durchschnittlich{" "}
                    <span className="font-medium text-[#2f2b26]">
                      {formatTokens(total / data.days.length)}
                    </span>{" "}
                    Tokens/Tag über {data.days.length} Tage.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Modell-Aufschlüsselung */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-[#2f2b26]">Aufschlüsselung nach Modell</h2>
                <Badge variant="outline" className="text-[#756b62]">
                  {data.models.length} Modelle
                </Badge>
              </div>
              <ModelBreakdown models={data.models} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Kleine Helfer-Komponenten
 * ------------------------------------------------------------------ */

function DistributionBar({ input, output }: { input: number; output: number }) {
  const total = input + output || 1;
  const inPct = (input / total) * 100;
  const outPct = (output / total) * 100;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div className="bg-[#fcd5b8]" style={{ width: `${inPct}%` }} />
        <div className="bg-[#f3aa7f]" style={{ width: `${outPct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-[#756b62]">
        <span>{inPct.toFixed(0)} %</span>
        <span>{outPct.toFixed(0)} %</span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
  dot,
}: {
  label: string;
  value: string;
  tone: string;
  dot: string;
}) {
  return (
    <div className="rounded-xl border border-[#e5dfd9] bg-white p-3">
      <div className="flex items-center gap-1.5 text-xs text-[#756b62]">
        <span className={cn("size-2 rounded-sm", dot)} />
        {label}
      </div>
      <p className={cn("mt-1 text-lg font-medium tracking-tight", tone)}>{value}</p>
    </div>
  );
}

function EmptyState({ onShowDemo, demoAvailable }: { onShowDemo: () => void; demoAvailable: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#e5dfd9] bg-white/60 py-20 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#b45f32]">
        <Coins className="size-7" />
      </span>
      <div className="space-y-1.5">
        <h3 className="text-base font-medium text-[#2f2b26]">Noch keine Token-Nutzung erfasst</h3>
        <p className="max-w-md text-sm text-[#756b62]">
          Sobald Anfragen über die Modelle laufen, erscheinen hier die Verbrauchs- und
          Kostenkennzahlen. Wähle "Beispiel", um eine Vorschau der gefüllten Ansicht zu sehen.
        </p>
      </div>
      {demoAvailable && (
        <button
          type="button"
          onClick={onShowDemo}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-primary text-primary-foreground"
        >
          <Eye className="size-4" /> Beispiel-Daten anzeigen
        </button>
      )}
    </div>
  );
}
