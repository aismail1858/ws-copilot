import { useState, useEffect } from "react";
import { apiClient } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchUsers = () => {
    fetch("/api/auth/users", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePromote = async () => {
    if (!promoteEmail.trim()) return;
    try {
      const res = await fetch("/api/auth/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: promoteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Benutzer ${data.email} wurde zum Admin gemacht.`);
        setUsers((prev) =>
          prev.map((u) => (u.email === promoteEmail ? { ...u, role: "admin" } : u))
        );
        setPromoteEmail("");
      } else {
        setMessage(data.detail || "Fehler");
      }
    } catch {
      setMessage("Netzwerkfehler");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) return;
    setCreating(true);
    setMessage("");
    try {
      await apiClient.post("/api/auth/users", {
        email: newEmail,
        password: newPassword,
        display_name: newName,
      });
      setMessage(`Benutzer ${newEmail} wurde erstellt.`);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowCreateForm(false);
      fetchUsers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-transparent select-text p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-[#2f2b26]">Benutzer</h1>
          <p className="text-sm text-[#756b62] mt-1">Benutzer verwalten und erstellen.</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="rounded-full">
          {showCreateForm ? "Abbrechen" : "Benutzer erstellen"}
        </Button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="mb-6 rounded-xl border border-border bg-white p-4 space-y-3">
          <h2 className="text-sm font-medium text-[#2f2b26]">Neuen Benutzer anlegen</h2>
          <div className="grid grid-cols-3 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-[#756b62]">Name</span>
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Max Mustermann"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#756b62]">E-Mail</span>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-[#756b62]">Passwort</span>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="********"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={creating}>
              {creating ? "Wird erstellt..." : "Benutzer anlegen"}
            </Button>
          </div>
        </form>
      )}

      <div className="mb-6 flex gap-2">
        <Input
          type="email"
          placeholder="E-Mail-Adresse eingeben..."
          value={promoteEmail}
          onChange={(e) => setPromoteEmail(e.target.value)}
          className="flex-1 max-w-xs"
        />
        <Button onClick={handlePromote}>
          Zum Admin machen
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2f2b26]/10 text-left text-[10px] uppercase tracking-wider text-[#756b62]">
              <th className="px-4 py-3 font-medium">E-Mail</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Rolle</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f3f2f1] text-[#756b62]">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM3 18.75a6 6 0 0 1 12 0v.75H3v-.75Z" />
                      </svg>
                    </span>
                    <p className="text-sm text-[#756b62]">Noch keine Benutzer angelegt.</p>
                    <p className="text-xs text-[#756b62]">Klicke oben auf „Benutzer erstellen", um den ersten Nutzer hinzuzufügen.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-[#2f2b26]/5 hover:bg-[#2f2b26]/[0.02]">
                  <td className="px-4 py-3 text-[#2f2b26]">{u.email}</td>
                  <td className="px-4 py-3 text-[#756b62]">{u.display_name}</td>
                  <td className="px-4 py-3">
                    <span className={"inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " + (u.role === "admin" ? "bg-[#fff1e8] text-[#b45f32]" : "bg-[#f3f2f1] text-[#756b62]")}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
