import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';

function extractErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const match = error.message.match(/^HTTP\s+\d+:\s*(.*)$/s);
  if (!match) return error.message;
  const payload = match[1].trim();
  try {
    const parsed = JSON.parse(payload) as { detail?: unknown };
    if (typeof parsed.detail === 'string' && parsed.detail.trim()) return parsed.detail;
  } catch {
    // keep raw payload
  }
  return payload || error.message;
}

export default function LoginPage() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from || '/', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
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
                Willkommen zurück.
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756b62]">
                Melde dich mit deinem Benutzerkonto an.
              </p>
            </div>
          </div>

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

            <label className="block space-y-1">
              <span className="text-xs text-[#756b62]">Passwort</span>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#756b62] hover:text-[#2f2b26]"
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
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

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-[#756b62] underline underline-offset-2 hover:text-[#2f2b26]">
                Passwort vergessen?
              </Link>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <Button type="submit" disabled={isLoading} className="w-full rounded-full">
              {isLoading ? 'Anmeldung...' : 'Einloggen'}
            </Button>
          </form>

          <p className="text-center text-xs text-[#756b62]">
            Noch kein Konto?{' '}
            <Link to="/register" className="underline underline-offset-2 hover:text-[#2f2b26]">
              Registrieren
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
