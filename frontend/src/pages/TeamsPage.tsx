import { useEffect, useState } from "react";
import { apiClient } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

interface Team {
  id: string;
  name: string;
  slug: string;
  lead_id: string;
  users?: { email: string; display_name: string } | { email: string; display_name: string }[];
}
interface UserRow {
  id: string;
  email: string;
  display_name: string;
  role: string;
  tier?: string;
}
interface Member {
  user_id: string;
  users?: { email: string; display_name: string } | { email: string; display_name: string }[];
}

function emailOf(u: unknown): string {
  if (!u) return "?";
  if (Array.isArray(u)) return u[0]?.email ?? "?";
  return (u as { email?: string }).email ?? "?";
}

export default function TeamsPage() {
  const { user } = useAuth();
  const isAdmin = user?.tier === "admin";

  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [membersByTeam, setMembersByTeam] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [leadId, setLeadId] = useState("");
  const [addUserId, setAddUserId] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTeams();
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function fetchTeams() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get<{ teams: Team[] }>("/api/rbac/teams");
      setTeams(res.teams || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Teams");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await apiClient.get<{ users: UserRow[] }>("/api/auth/users");
      setUsers(res.users || []);
    } catch {
      /* non-fatal */
    }
  }

  async function fetchMembers(teamId: string) {
    try {
      const res = await apiClient.get<{ members: Member[] }>(`/api/rbac/teams/${teamId}/members`);
      setMembersByTeam((prev) => ({ ...prev, [teamId]: res.members || [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden der Mitglieder");
    }
  }

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !leadId) return;
    try {
      await apiClient.post("/api/rbac/teams", { name, slug, lead_id: leadId });
      setName("");
      setSlug("");
      setLeadId("");
      fetchTeams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Team konnte nicht angelegt werden");
    }
  }

  async function addMember(teamId: string) {
    const uid = addUserId[teamId];
    if (!uid) return;
    try {
      await apiClient.post(`/api/rbac/teams/${teamId}/members`, { user_id: uid });
      setAddUserId((prev) => ({ ...prev, [teamId]: "" }));
      fetchMembers(teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hinzufuegen fehlgeschlagen");
    }
  }

  async function removeMember(teamId: string, uid: string) {
    try {
      await apiClient.delete(`/api/rbac/teams/${teamId}/members/${uid}`);
      fetchMembers(teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Entfernen fehlgeschlagen");
    }
  }

  function toggle(teamId: string) {
    const next = expanded === teamId ? null : teamId;
    setExpanded(next);
    if (next && !membersByTeam[teamId]) fetchMembers(teamId);
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-0 bg-transparent select-text">
        <p className="text-sm text-[#756b62]">Lade Teams...</p>
      </main>
    );
  }

  const teamLeads = users.filter((u) => u.tier === "team_lead" || u.tier === "admin");

  return (
    <main className="flex-1 min-h-0 bg-transparent select-text overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-light tracking-[-0.035em] text-[#2f2b26]">Teams</h1>
          <p className="mt-1 text-sm text-[#756b62]">
            {isAdmin ? "Alle Teams verwalten, Mitglieder hinzufuegen/entfernen." : "Deine Teams — Mitglieder verwalten."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {isAdmin && (
          <form onSubmit={createTeam} className="rounded-xl border border-[#e5dfd9] bg-white p-4 space-y-3">
            <h2 className="text-sm font-medium text-[#2f2b26]">Neues Team anlegen</h2>
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <select className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
                <option value="">Team-Lead waehlen...</option>
                {teamLeads.map((u) => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Anlegen</Button>
            </div>
          </form>
        )}

        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#e5dfd9] bg-white/60 py-16 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f3f2f1] text-[#756b62]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#2f2b26]">Noch keine Teams vorhanden</p>
              <p className="text-xs text-[#756b62]">
                {isAdmin
                  ? "Lege oben das erste Team an, um Mitglieder zu verwalten."
                  : "Du bist noch keinem Team zugeordnet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map((t) => (
              <div key={t.id} className="rounded-xl border border-[#e5dfd9] bg-white">
                <button
                  onClick={() => toggle(t.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-[#2f2b26]">{t.name}</p>
                    <p className="text-xs text-[#756b62]">Lead: {emailOf(t.users)}</p>
                  </div>
                  <span className="text-xs text-[#756b62]">{expanded === t.id ? "Schliessen" : "Oeffnen"}</span>
                </button>

                {expanded === t.id && (
                  <div className="border-t border-[#e5dfd9] px-4 py-3 space-y-3">
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-lg border border-input bg-transparent px-2 py-1 text-xs flex-1"
                        value={addUserId[t.id] || ""}
                        onChange={(e) => setAddUserId((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      >
                        <option value="">Mitglied hinzufuegen...</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                      </select>
                      <Button onClick={() => addMember(t.id)} size="xs">Hinzufuegen</Button>
                    </div>

                    <div className="space-y-1">
                      {(membersByTeam[t.id] || []).map((m) => (
                        <div key={m.user_id} className="flex items-center justify-between text-sm">
                          <span className="text-[#2f2b26]">{emailOf(m.users)}</span>
                          <button onClick={() => removeMember(t.id, m.user_id)} className="text-xs text-red-600 hover:underline">Entfernen</button>
                        </div>
                      ))}
                      {(membersByTeam[t.id] || []).length === 0 && (
                        <p className="text-xs text-[#756b62]">Noch keine Mitglieder.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
