import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Fehler beim Senden" }));
        throw new Error(data.detail || "Fehler beim Senden");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

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
                Passwort vergessen
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756b62]">
                Gib deine E-Mail-Adresse ein, um einen Link zum Zurücksetzen zu erhalten.
              </p>
            </div>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-[#ecfdf5] border border-[#a7f3d0] px-4 py-3 text-sm text-[#047857]">
                Wenn ein Konto mit dieser E-Mail existiert, wurde eine E-Mail zum Zurücksetzen
                des Passworts gesendet.
              </div>
              <Link
                to="/login"
                className="block text-center text-xs text-[#756b62] underline underline-offset-2 hover:text-[#2f2b26]"
              >
                Zurück zum Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs text-[#756b62]">E-Mail</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                />
              </label>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? "Wird gesendet..." : "Link senden"}
              </Button>

              <p className="text-center text-xs text-[#756b62]">
                Zurück zum{" "}
                <Link
                  to="/login"
                  className="underline underline-offset-2 hover:text-[#2f2b26]"
                >
                  Login
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
