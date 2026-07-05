import { useState } from 'react';
import { useLayout } from '../../context/LayoutContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function ChangePasswordModal() {
  const { isChangePasswordModalOpen, closeChangePasswordModal } = useLayout();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isChangePasswordModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Passwort ändern fehlgeschlagen');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => closeChangePasswordModal(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2f2b26]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[#2f2b26] font-medium text-lg tracking-tight">Passwort ändern</h2>
          <button
            type="button"
            onClick={closeChangePasswordModal}
            className="p-2 text-[#756b62] hover:text-[#2f2b26] transition-colors rounded-full"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              Passwort erfolgreich geändert.
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-[#756b62] mb-1">Aktuelles Passwort</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#756b62] mb-1">Neues Passwort</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#756b62] mb-1">Neues Passwort bestätigen</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeChangePasswordModal}>
              Abbrechen
            </Button>
            <Button type="submit">
              Ändern
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
