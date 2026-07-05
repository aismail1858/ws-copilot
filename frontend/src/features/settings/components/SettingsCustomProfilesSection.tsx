import { useEffect, useState } from 'react';
import {
  Field,
  inputCls,
  selectCls,
  SecretInput,
  settingsAccentButtonCls,
  settingsDangerButtonCls,
  settingsSecondaryButtonCls,
  settingsToggleButtonActiveCls,
} from '@/features/settings/components/SettingsFields';
import { DEFAULT_CUSTOM_PROFILE_ID } from '@/features/settings/types';
import { isDefaultCustomProfileId } from '@/features/settings/utils/customProfiles';
import type { NewCustomProfileDraft } from '@/features/settings/types';
import type { CustomLlmProfile } from '@/types';

interface SettingsCustomProfilesSectionProps {
  newCustomProfileDraft: NewCustomProfileDraft;
  updateNewCustomProfileDraft: (
    patch: Partial<Pick<NewCustomProfileDraft, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
  canAddCustomProfile: boolean;
  addCustomProfile: () => void;
  discardNewCustomProfileDraft: () => void;
  duplicateCustomProfile: (profileId: string) => void;
  duplicatedCustomProfileLabel: string;
  editableCustomProfiles: CustomLlmProfile[];
  activeCustomProfileId: string;
  isDuplicatingCustomProfileDraft: boolean;
  isNewCustomProfileDraftActive: boolean;
  setActiveCustomProfile: (profileId: string) => void;
  updateCustomProfile: (
    profileId: string,
    patch: Partial<Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
  removeCustomProfile: (profileId: string) => void;
}

function CustomProfileHeader({
  profile,
  isActive,
  canRemoveProfile,
  setActiveCustomProfile,
  duplicateCustomProfile,
  removeCustomProfile,
}: {
  profile: CustomLlmProfile;
  isActive: boolean;
  canRemoveProfile: boolean;
  setActiveCustomProfile: (profileId: string) => void;
  duplicateCustomProfile: (profileId: string) => void;
  removeCustomProfile: (profileId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-[#2f2b26]">{profile.label || profile.model}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => duplicateCustomProfile(profile.id)}
          className={settingsSecondaryButtonCls}
        >
          Duplizieren
        </button>
        <button
          type="button"
          onClick={() => setActiveCustomProfile(profile.id)}
          className={`${isActive ? settingsToggleButtonActiveCls : settingsSecondaryButtonCls} ${
            isActive ? '' : ''
          }`}
        >
          {isActive ? 'Aktiv' : 'Aktiv setzen'}
        </button>
        {canRemoveProfile && (
          <button
            type="button"
            onClick={() => removeCustomProfile(profile.id)}
            className={settingsDangerButtonCls}
          >
            Entfernen
          </button>
        )}
      </div>
    </div>
  );
}

function CustomProfileFields({
  profile,
  updateCustomProfile,
}: {
  profile: CustomLlmProfile;
  updateCustomProfile: (
    profileId: string,
    patch: Partial<Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
}) {
  const isTemplateProfile = isDefaultCustomProfileId(profile.id);

  return (
    <>
      <Field label="Anzeigename">
        <input
          type="text"
          value={profile.label}
          onChange={(e) => updateCustomProfile(profile.id, { label: e.target.value })}
          className={inputCls}
          placeholder="z. B. Kimi K2"
          disabled={isTemplateProfile}
        />
      </Field>
      <Field label="Modellname" description="Wird direkt an den OpenAI-kompatiblen Endpoint gesendet">
        <input
          type="text"
          value={isTemplateProfile ? '' : profile.model}
          onChange={(e) => updateCustomProfile(profile.id, { model: e.target.value })}
          className={inputCls}
          placeholder="z. B. kimi-k2-instruct"
          disabled={isTemplateProfile}
        />
      </Field>
      <Field label="Endpunkt URL" description="Basis-URL (oft endend auf /v1)">
        <input
          type="url"
          value={isTemplateProfile ? '' : profile.url}
          onChange={(e) => updateCustomProfile(profile.id, { url: e.target.value })}
          className={inputCls}
          placeholder="http://localhost:1234/v1"
          disabled={isTemplateProfile}
        />
      </Field>
      <Field label="API Key" description='"none" oder leer wenn nicht benötigt'>
        <SecretInput
          value={isTemplateProfile ? '' : profile.apiKey}
          onChange={(value) => updateCustomProfile(profile.id, { apiKey: value })}
          placeholder="sk-... oder leer lassen"
          disabled={isTemplateProfile}
        />
      </Field>
    </>
  );
}

function CustomProfileCard({
  profile,
  isActive,
  canRemoveProfile,
  setActiveCustomProfile,
  duplicateCustomProfile,
  updateCustomProfile,
  removeCustomProfile,
}: {
  profile: CustomLlmProfile;
  isActive: boolean;
  canRemoveProfile: boolean;
  setActiveCustomProfile: (profileId: string) => void;
  duplicateCustomProfile: (profileId: string) => void;
  updateCustomProfile: (
    profileId: string,
    patch: Partial<Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
  removeCustomProfile: (profileId: string) => void;
}) {
  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        isActive ? 'border-[#f3aa7f]/45 bg-[#fff1e8]' : 'border-[#2f2b26]/10 bg-white'
      }`}
    >
      <CustomProfileHeader
        profile={profile}
        isActive={isActive}
        canRemoveProfile={canRemoveProfile}
        setActiveCustomProfile={setActiveCustomProfile}
        duplicateCustomProfile={duplicateCustomProfile}
        removeCustomProfile={removeCustomProfile}
      />
      <CustomProfileFields profile={profile} updateCustomProfile={updateCustomProfile} />
    </div>
  );
}

function NewCustomProfileFields({
  draft,
  updateDraft,
  canAddProfile,
  addProfile,
}: {
  draft: NewCustomProfileDraft;
  updateDraft: (
    patch: Partial<Pick<NewCustomProfileDraft, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
  canAddProfile: boolean;
  addProfile: () => Promise<void> | void;
}) {
  return (
    <>
      <Field label="Anzeigename">
        <input
          type="text"
          value={draft.label}
          onChange={(e) => updateDraft({ label: e.target.value })}
          className={inputCls}
          placeholder="z. B. Kimi K2"
        />
      </Field>
      <Field label="Modellname" description="Wird direkt an den OpenAI-kompatiblen Endpoint gesendet">
        <input
          type="text"
          value={draft.model}
          onChange={(e) => updateDraft({ model: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canAddProfile) {
              e.preventDefault();
              addProfile();
            }
          }}
          className={inputCls}
          placeholder="z. B. kimi-k2-instruct"
        />
      </Field>
      <Field label="Endpunkt URL" description="Basis-URL (oft endend auf /v1)">
        <input
          type="url"
          value={draft.url}
          onChange={(e) => updateDraft({ url: e.target.value })}
          className={inputCls}
          placeholder="http://localhost:1234/v1"
        />
      </Field>
      <Field label="API Key" description='"none" oder leer wenn nicht benötigt'>
        <SecretInput
          value={draft.apiKey}
          onChange={(value) => updateDraft({ apiKey: value })}
          placeholder="sk-... oder leer lassen"
        />
      </Field>
    </>
  );
}

function NewCustomProfileCard({
  draft,
  updateDraft,
  canAddProfile,
  addProfile,
  discardDraft,
  duplicatedProfileLabel,
  isDuplicatingDraft,
  validationError,
}: {
  draft: NewCustomProfileDraft;
  updateDraft: (
    patch: Partial<Pick<NewCustomProfileDraft, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
  canAddProfile: boolean;
  addProfile: () => Promise<void> | void;
  discardDraft: () => void;
  duplicatedProfileLabel: string;
  isDuplicatingDraft: boolean;
  validationError: string;
}) {
  return (
    <div className="rounded-lg border border-[#2f2b26]/10 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#2f2b26]">
          {isDuplicatingDraft
            ? `Duplikat von ${duplicatedProfileLabel || 'bestehendem Profil'}`
            : 'Neues Custom-Profil'}
        </span>
        <button
          type="button"
          onClick={discardDraft}
          className={settingsSecondaryButtonCls}
        >
          Verwerfen
        </button>
      </div>
      <NewCustomProfileFields
        draft={draft}
        updateDraft={updateDraft}
        canAddProfile={canAddProfile}
        addProfile={addProfile}
      />
      {validationError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {validationError}
        </div>
      ) : null}
      {isDuplicatingDraft ? (
        <p className="text-xs text-zinc-500">
          Dieses Duplikat bleibt ein lokaler Entwurf, bis du es gültig veränderst. Ohne Änderung
          wird es verworfen.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Wenn kein vorhandenes Modell ausgewählt ist, kannst du hier ein neues Custom-Profil
            anlegen. Den Live-Test führst du danach separat im Bereich Modelltest aus.
          </p>
          <button
            type="button"
            onClick={() => void addProfile()}
            className={settingsAccentButtonCls}
            disabled={!canAddProfile}
          >
            Als Profil hinzufügen
          </button>
        </div>
      )}
    </div>
  );
}

function CustomProfilesIntro() {
  return (
    <>
      <p className="text-xs text-zinc-500">
        Jedes Profil steht für ein festes Custom-Modell mit eigener URL und eigenem API-Key.
      </p>
      <p className="text-xs text-zinc-500">
        Wähle im Dropdown ein vorhandenes Modell, lege ein neues Profil an oder dupliziere ein
        bestehendes Profil für eine Variante.
      </p>
    </>
  );
}

function CustomProfilePicker({
  activeProfileId,
  editableProfiles,
  setActiveCustomProfile,
}: {
  activeProfileId: string;
  editableProfiles: CustomLlmProfile[];
  setActiveCustomProfile: (profileId: string) => void;
}) {
  return (
    <Field label="Custom-Modell" description="Bestehendes Modell auswählen oder neues Profil vorbereiten">
      <select
        value={activeProfileId}
        onChange={(e) => setActiveCustomProfile(e.target.value)}
        className={selectCls}
      >
        <option value={DEFAULT_CUSTOM_PROFILE_ID}>Neues Profil hinzufügen</option>
        {editableProfiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.label || profile.model}
          </option>
        ))}
      </select>
    </Field>
  );
}

export default function SettingsCustomProfilesSection({
  newCustomProfileDraft,
  updateNewCustomProfileDraft,
  canAddCustomProfile,
  addCustomProfile,
  discardNewCustomProfileDraft,
  duplicateCustomProfile,
  duplicatedCustomProfileLabel,
  editableCustomProfiles,
  activeCustomProfileId,
  isDuplicatingCustomProfileDraft,
  isNewCustomProfileDraftActive,
  setActiveCustomProfile,
  updateCustomProfile,
  removeCustomProfile,
}: SettingsCustomProfilesSectionProps) {
  const selectedEditableCustomProfile = isNewCustomProfileDraftActive
    ? null
    : editableCustomProfiles.find((profile) => profile.id === activeCustomProfileId) || null;
  const [draftValidationError, setDraftValidationError] = useState('');

  useEffect(() => {
    if (!draftValidationError) return;
    setDraftValidationError('');
  }, [
    draftValidationError,
    newCustomProfileDraft.label,
    newCustomProfileDraft.model,
    newCustomProfileDraft.url,
    newCustomProfileDraft.apiKey,
  ]);

  const handleAddProfile = async () => {
    const model = newCustomProfileDraft.model.trim();
    const url = newCustomProfileDraft.url.trim();

    if (!model) {
      setDraftValidationError('Bitte zuerst einen Modellnamen eingeben.');
      return;
    }
    if (!url) {
      setDraftValidationError('Bitte zuerst eine Endpoint-URL eingeben.');
      return;
    }

    setDraftValidationError('');
    addCustomProfile();
  };

  return (
    <div className="ci-panel rounded-xl p-5 space-y-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-[#2f2b26]">Custom / OpenAI-kompatibel</p>
      </div>
      <CustomProfilesIntro />
      <CustomProfilePicker
        activeProfileId={
          isNewCustomProfileDraftActive
            ? DEFAULT_CUSTOM_PROFILE_ID
            : selectedEditableCustomProfile?.id || DEFAULT_CUSTOM_PROFILE_ID
        }
        editableProfiles={editableCustomProfiles}
        setActiveCustomProfile={setActiveCustomProfile}
      />
      {selectedEditableCustomProfile ? (
        <CustomProfileCard
          profile={selectedEditableCustomProfile}
          isActive
          canRemoveProfile={editableCustomProfiles.length > 0}
          setActiveCustomProfile={setActiveCustomProfile}
          duplicateCustomProfile={duplicateCustomProfile}
          updateCustomProfile={updateCustomProfile}
          removeCustomProfile={removeCustomProfile}
        />
      ) : (
        <NewCustomProfileCard
          draft={newCustomProfileDraft}
          updateDraft={updateNewCustomProfileDraft}
          canAddProfile={canAddCustomProfile}
          addProfile={handleAddProfile}
          discardDraft={discardNewCustomProfileDraft}
          duplicatedProfileLabel={duplicatedCustomProfileLabel}
          isDuplicatingDraft={isDuplicatingCustomProfileDraft}
          validationError={draftValidationError}
        />
      )}
    </div>
  );
}
