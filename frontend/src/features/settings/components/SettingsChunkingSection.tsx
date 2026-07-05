import type { SettingsAdminRuntimeSectionProps } from './settingsAdminRuntimeShared';

export function SettingsChunkingSection({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <div className="ci-panel rounded-lg p-5 space-y-5">
      <p className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Chunking-Strategie</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400">Chunk-Größe</label>
          <span className="text-xs text-[#2563eb] font-mono bg-[#2563eb]/5 px-1.5 py-0.5 rounded">
            {settings.ingestionChunkSize}
          </span>
        </div>
        <input
          type="range"
          min={256}
          max={4096}
          step={128}
          value={settings.ingestionChunkSize}
          onChange={(e) =>
            updateSettings({
              ingestionChunkSize: Math.round(Number(e.target.value) / 128) * 128,
            })
          }
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400">Chunk-Überlappung</label>
          <span className="text-xs text-[#2563eb] font-mono bg-[#2563eb]/5 px-1.5 py-0.5 rounded">
            {settings.ingestionChunkOverlap}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={512}
          step={32}
          value={settings.ingestionChunkOverlap}
          onChange={(e) =>
            updateSettings({
              ingestionChunkOverlap: Math.round(Number(e.target.value) / 32) * 32,
            })
          }
          className="w-full"
        />
      </div>
    </div>
  );
}