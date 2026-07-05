import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { modelsApi, type AppModel, type ModelCreateInput } from "../lib/api/models";
import type { LlmPurpose } from "../lib/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";

const PURPOSE_META: Record<LlmPurpose, { label: string; badge: string }> = {
  chat: { label: "Chat", badge: "bg-[#fff1e8] text-[#b45f32]" },
  mini: { label: "Mini", badge: "bg-[#eef2ff] text-[#4338ca]" },
  embeddings: { label: "Embeddings", badge: "bg-[#ecfdf5] text-[#047857]" },
  embeddings_llm: { label: "Embedding-LLM", badge: "bg-[#f3f2f1] text-[#756b62]" },
};

const EMPTY_FORM: ModelCreateInput = { label: "", model_id: "", purpose: "chat", enabled: true, sort_order: 0 };

export default function SettingsPage() {
  const [models, setModels] = useState<AppModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const data = await modelsApi.listAll();
      setModels(data.models);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Modelle konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleCreated = (model: AppModel) => {
    setModels((prev) => [...prev, model].sort(sortModels));
    setShowForm(false);
    toast.success("Modell hinzugefügt");
  };

  const handleUpdated = (updated: AppModel) => {
    setModels((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleDeleted = (id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-transparent select-text p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-[#2f2b26]">Einstellungen</h1>
          <p className="text-sm text-[#756b62] mt-1">
            Verfügbare Requesty-Modelle verwalten — hinzufügen, aktivieren, entfernen.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="rounded-full">
          <Plus className="w-4 h-4" />
          {showForm ? "Abbrechen" : "Modell hinzufügen"}
        </Button>
      </div>

      {showForm && <AddModelForm onCreate={handleCreated} onCancel={() => setShowForm(false)} />}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#756b62]">
            <Loader2 className="w-4 h-4 animate-spin" /> Lade Modelle…
          </div>
        ) : models.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#756b62]">
            Noch keine Modelle. Klicke auf „Modell hinzufügen".
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2f2b26]/10 text-left text-[10px] uppercase tracking-wider text-[#756b62]">
                <th className="px-4 py-3 font-medium">Bezeichnung</th>
                <th className="px-4 py-3 font-medium">Modell-ID</th>
                <th className="px-4 py-3 font-medium">Zweck</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <ModelRow
                  key={m.id}
                  model={m}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </main>
  );
}

function sortModels(a: AppModel, b: AppModel): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.label.localeCompare(b.label);
}

interface AddModelFormProps {
  onCreate: (model: AppModel) => void;
  onCancel: () => void;
}

function AddModelForm({ onCreate, onCancel }: AddModelFormProps) {
  const [form, setForm] = useState<ModelCreateInput>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.model_id.trim()) return;
    setSaving(true);
    try {
      const res = await modelsApi.create(form);
      onCreate(res.model);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 rounded-xl border border-[#e5dfd9] bg-white p-4 space-y-3">
      <h2 className="text-sm font-medium text-[#2f2b26]">Neues Requesty-Modell</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="Bezeichnung">
          <Input
            type="text"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="z. B. GPT-4o"
            required
          />
        </Field>
        <Field label="Modell-ID (Requesty)">
          <Input
            type="text"
            value={form.model_id}
            onChange={(e) => setForm((f) => ({ ...f, model_id: e.target.value }))}
            placeholder="z. B. gpt-4o"
            required
          />
        </Field>
        <Field label="Zweck">
          <select
            value={form.purpose}
            onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value as LlmPurpose }))}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
          >
            {(Object.keys(PURPOSE_META) as LlmPurpose[]).map((p) => (
              <option key={p} value={p}>{PURPOSE_META[p].label}</option>
            ))}
          </select>
        </Field>
        <Field label="Reihenfolge">
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
          />
        </Field>
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-[#756b62]">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
          className="rounded"
        />
        Aktiviert
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Wird gespeichert…" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-[#756b62]">{label}</span>
      {children}
    </label>
  );
}

interface ModelRowProps {
  model: AppModel;
  onUpdated: (model: AppModel) => void;
  onDeleted: (id: string) => void;
}

function ModelRow({ model, onUpdated, onDeleted }: ModelRowProps) {
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(model.label);
  const [draftModelId, setDraftModelId] = useState(model.model_id);
  const [busy, setBusy] = useState(false);

  const toggleEnabled = async () => {
    setBusy(true);
    try {
      const res = await modelsApi.update(model.id, { enabled: !model.enabled });
      onUpdated(res.model);
      toast.success(res.model.enabled ? "Modell aktiviert" : "Modell deaktiviert");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Aktion fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!draftLabel.trim() || !draftModelId.trim()) return;
    setBusy(true);
    try {
      const res = await modelsApi.update(model.id, { label: draftLabel, model_id: draftModelId });
      onUpdated(res.model);
      setEditing(false);
      toast.success("Aktualisiert");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Modell „${model.label}" wirklich entfernen?`)) return;
    setBusy(true);
    try {
      await modelsApi.remove(model.id);
      onDeleted(model.id);
      toast.success("Modell entfernt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const [testing, setTesting] = useState(false);
  const testModel = async () => {
    setTesting(true);
    try {
      const res = await modelsApi.test(model.id);
      if (res.ok) toast.success(`Ping OK (${res.latency_ms ?? '?'} ms)`);
      else toast.error(`Ping fehlgeschlagen: ${res.error ?? 'unbekannt'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ping fehlgeschlagen");
    } finally {
      setTesting(false);
    }
  };

  const meta = PURPOSE_META[model.purpose] ?? PURPOSE_META.chat;

  if (editing) {
    return (
      <tr className="border-b border-[#2f2b26]/5 bg-[#2f2b26]/[0.02]">
        <td className="px-4 py-3">
          <Input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} />
        </td>
        <td className="px-4 py-3">
          <Input value={draftModelId} onChange={(e) => setDraftModelId(e.target.value)} />
        </td>
        <td className="px-4 py-3" colSpan={2}><span className={["inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", meta.badge].join(" ")}>{meta.label}</span></td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex gap-1">
            <IconBtn title="Speichern" onClick={saveEdit} disabled={busy}><Check className="w-4 h-4" /></IconBtn>
            <IconBtn title="Abbrechen" onClick={() => { setEditing(false); setDraftLabel(model.label); setDraftModelId(model.model_id); }}><X className="w-4 h-4" /></IconBtn>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-[#2f2b26]/5 hover:bg-[#2f2b26]/[0.02]">
      <td className="px-4 py-3 text-[#2f2b26]">{model.label}</td>
      <td className="px-4 py-3 font-mono text-xs text-[#756b62]">{model.model_id}</td>
      <td className="px-4 py-3">
        <span className={["inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", meta.badge].join(" ")}>{meta.label}</span>
      </td>
      <td className="px-4 py-3">
        <span className={["inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", model.enabled ? "bg-[#ecfdf5] text-[#047857]" : "bg-[#f3f2f1] text-[#756b62]"].join(" ")}>
          {model.enabled ? "Aktiv" : "Inaktiv"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex gap-1">
          <IconBtn title={model.enabled ? "Deaktivieren" : "Aktivieren"} onClick={toggleEnabled} disabled={busy}>
            <span className={["inline-block w-2 h-2 rounded-full", model.enabled ? "bg-emerald-500" : "bg-slate-300"].join(" ")} />
          </IconBtn>
          <IconBtn title={testing ? 'Ping läuft…' : 'Ping-Test'} onClick={testModel} disabled={busy || testing}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </IconBtn>
          <IconBtn title="Bearbeiten" onClick={() => setEditing(true)} disabled={busy}><Pencil className="w-4 h-4" /></IconBtn>
          <IconBtn title="Löschen" onClick={remove} disabled={busy} danger><Trash2 className="w-4 h-4" /></IconBtn>
        </div>
      </td>
    </tr>
  );
}

function IconBtn({
  children, onClick, title, disabled, danger,
}: {
  children: React.ReactNode; onClick: () => void; title: string; disabled?: boolean; danger?: boolean;
}) {
  const base = "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40";
  const tone = danger
    ? "text-[#b45f32] hover:bg-[#fff1e8]"
    : "text-[#756b62] hover:bg-[#2f2b26]/5 hover:text-[#2f2b26]";
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={[base, tone].join(" ")}>
      {children}
    </button>
  );
}
