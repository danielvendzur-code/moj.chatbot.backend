type MascotSpeechPromptProps = {
  visible: boolean;
  onOpen: () => void;
  onDismiss: () => void;
};

export function MascotSpeechPrompt({
  visible,
  onOpen,
  onDismiss,
}: MascotSpeechPromptProps): JSX.Element | null {
  if (!visible) return null;

  return (
    <aside className="mascot-prompt" aria-label="Tip od asistenta">
      <button
        className="mascot-prompt__close"
        type="button"
        onClick={onDismiss}
        aria-label="Zavrieť tip"
      >
        <span aria-hidden="true">×</span>
      </button>
      <p>Pomôžem vám vyskladať vhodný nástroj.</p>
      <button className="mascot-prompt__action" type="button" onClick={onOpen}>
        Pozrieť možnosti
        <span aria-hidden="true">↗</span>
      </button>
    </aside>
  );
}
