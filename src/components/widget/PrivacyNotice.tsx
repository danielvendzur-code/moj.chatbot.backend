export function PrivacyNotice({ chat = false }: { chat?: boolean }) {
  return (
    <p className="cw-privacy-notice">
      {chat
        ? "AI odpovede spracúva Anthropic. Chat uchováme v prehliadači najviac 24 hodín a na serveri najviac 90 dní. Neposielajte citlivé údaje. "
        : "Údaje použijeme na vybavenie vášho dopytu. "}
      <a href="https://mojchatbot.sk/ochrana-udajov" target="_blank" rel="noopener noreferrer">
        Ochrana osobných údajov
      </a>
    </p>
  );
}
