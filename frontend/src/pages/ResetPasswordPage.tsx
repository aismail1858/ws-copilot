import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    if (!token) {
      setError("Ungültiger oder fehlender Reset-Token.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Fehler beim Zurücksetzen" }));
        throw new Error(data.detail || "Fehler beim Zurücksetzen");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card size="sm" className="w-full max-w-sm">
          <CardContent className="space-y-5 pt-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-light text-[#2f2b26]">Ungültiger Link</h1>
            <p className="text-sm text-[#756b62]">
              Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
            </p>
            <Link to="/forgot-password" className="block text-xs text-[#b45f32] underline underline-offset-2 hover:no-underline">
              Neuen Link anfordern
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card size="sm" className="w-full max-w-sm">
          <CardContent className="space-y-5 pt-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#ecfdf5] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#047857]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-light text-[#2f2b26]">Passwort zurückgesetzt</h1>
            <p className="text-sm text-[#756b62]">
              Dein Passwort wurde erfolgreich geändert.
            </p>
            <Link to="/login" className="block text-xs text-[#b45f32] underline underline-offset-2 hover:no-underline">
              Zum Login
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card size="sm" className="w-full max-w-sm">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center">
              <img src="/logo.svg" alt="WS Copilot" className="h-10 w-10" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#756b62]">
                WS Copilot
              </p>
              <h1 className="mt-1 text-2xl font-light tracking-[-0.035em] text-[#2f2b26]">
                Passwort zurücksetzen
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756b62]">
                Gib ein neues Passwort für dein Konto ein.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-xs text-[#756b62]">Neues Passwort</span>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="********"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#756b62] hover:text-[#2f2b26]"
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-[#756b62]">Passwort bestätigen</span>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="********"
              />
            </label>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full rounded-full">
              {loading ? "Wird zurückgesetzt..." : "Passwort zurücksetzen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
