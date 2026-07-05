import { SettingsRerankerSection } from '@/features/settings/components/SettingsRerankerSection';
import { SettingsSearchRuntimeSection } from '@/features/settings/components/SettingsSearchRuntimeSection';
import { SettingsVisionSummarySection } from '@/features/settings/components/SettingsVisionSummarySection';
import { SettingsContextualPrefixSection } from '@/features/settings/components/SettingsContextualPrefixSection';
import { SettingsHydeSection } from '@/features/settings/components/SettingsHydeSection';
import type { SettingsAdminRuntimeSectionProps } from '@/features/settings/components/settingsAdminRuntimeShared';

export default function SettingsAdminRuntimeSection(props: SettingsAdminRuntimeSectionProps) {
  return (
    <div className="space-y-4">
      <SettingsSearchRuntimeSection
        settings={props.settings}
        updateSettings={props.updateSettings}
      />
      <SettingsContextualPrefixSection
        settings={props.settings}
        updateSettings={props.updateSettings}
      />
      <SettingsHydeSection
        settings={props.settings}
        updateSettings={props.updateSettings}
      />
      <SettingsRerankerSection {...props} />
      <SettingsVisionSummarySection
        settings={props.settings}
        updateSettings={props.updateSettings}
        customProfiles={props.customProfiles}
        activeCustomProfile={props.activeCustomProfile}
        setActiveCustomProfile={props.setActiveCustomProfile}
        updateCustomProfile={props.updateCustomProfile}
      />
    </div>
  );
}
