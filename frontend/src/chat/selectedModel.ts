// Geteilte Auswahl des aktiven Chat-Modells (model_id aus app_models).
// Geschrieben von useChatModels (ModelSelector), gelesen von useChat beim Senden,
// damit das gewählte Modell in den Stream fließt, ohne Prop-Drilling durch ChatPage.
const KEY = "ws-copilot-selected-chat-model";
const EVENT = "ws-selected-model-changed";

export function getSelectedModelEventName(): string {
  return EVENT;
}

export function getSelectedModelId(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setSelectedModelId(id: string | null): void {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // localStorage nicht verfügbar — Store aktualisiert nur den React-State des Selectors.
  }
}
