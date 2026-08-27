import { useEffect, useId, useRef, useState } from "react";
import { track } from "../../lib/analytics";
import { buildProposalNumber } from "../../lib/assistantFlow";
import { submitLead } from "../../lib/leadApi";
import type { LeadAttachment } from "../../lib/leadApi";
import {
  AttachmentFailure,
  MAX_ATTACHMENTS,
  toAttachment,
} from "../../lib/imageAttachment";
import { drawCheck } from "../../lib/motion";
import { WidgetIcon } from "./WidgetIcon";

type MessageSheetProps = {
  onClose: () => void;
};

type SendState = "idle" | "sending" | "done";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const readableSize = (base64Length: number): string => {
  const kilobytes = Math.round((base64Length * 0.75) / 1024);
  return kilobytes >= 1024
    ? `${(kilobytes / 1024).toFixed(1)} MB`
    : `${Math.max(1, kilobytes)} kB`;
};

/**
 * The e-mail action in the chat used to hand the visitor over to their own mail
 * client — on a phone that is a blank Gmail draft at best and nothing at all
 * when no client is set up. This is the same thing done in place: an address, a
 * message, optionally a photo, delivered by the same endpoint as every other
 * enquiry.
 */
export function MessageSheet({ onClose }: MessageSheetProps): JSX.Element {
  const titleId = useId();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<LeadAttachment[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [handedToMailClient, setHandedToMailClient] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const doneIconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    track("mail_form_open");
    window.requestAnimationFrame(() =>
      emailRef.current?.focus({ preventScroll: true }),
    );
  }, []);

  useEffect(() => {
    if (sendState === "done") drawCheck(doneIconRef.current);
  }, [sendState]);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_ATTACHMENTS - photos.length;
    if (room <= 0) {
      setError(`Naraz zvládnem ${MAX_ATTACHMENTS} fotky.`);
      return;
    }

    setPreparing(true);
    setError("");
    const accepted: LeadAttachment[] = [];
    let rejected = 0;

    for (const file of Array.from(files).slice(0, room)) {
      try {
        accepted.push(await toAttachment(file));
      } catch (failure) {
        rejected += 1;
        track("mail_form_attachment_rejected", {
          reason: failure instanceof AttachmentFailure ? failure.kind : "unknown",
        });
      }
    }

    setPhotos((current) => [...current, ...accepted]);
    setPreparing(false);
    if (rejected) setError("Jednu fotku sa nepodarilo pripraviť, skúste menšiu.");
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, position) => position !== index));
    if (error) setError("");
  };

  const send = async () => {
    if (sendState !== "idle" || preparing) return;

    const safeEmail = email.trim();
    const safeMessage = message.trim();
    if (!EMAIL_PATTERN.test(safeEmail)) {
      setError("Napíšte e-mail, na ktorý vám môžem odpovedať.");
      emailRef.current?.focus();
      return;
    }
    if (!safeMessage) {
      setError("Napíšte prosím, s čím vám môžem pomôcť.");
      return;
    }

    setError("");
    setSendState("sending");
    track("mail_form_submit", { photos: photos.length });

    try {
      const result = await submitLead({
        source: "widget-email",
        email: safeEmail,
        note: safeMessage,
        attachments: photos,
        /* Same reference scheme as the configurator, so a message and a brief
           can be filed and looked up the same way. */
        reference: buildProposalNumber(),
        consent: true,
      });
      setHandedToMailClient(!result.delivered);
      if (result.fallback) window.location.assign(result.fallback);
      setSendState("done");
      track("mail_form_success", { delivered: result.delivered });
    } catch (failure) {
      setSendState("idle");
      setError("Nepodarilo sa to odoslať. Skúste to prosím ešte raz.");
      track("mail_form_error", {
        reason: failure instanceof Error ? failure.message : "unknown",
      });
    }
  };

  return (
    <section
      className="cw-sheet"
      data-testid="mail-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      /* Escape belongs to the sheet while it is open; without this it reaches
         the panel's own handler and closes the whole widget. */
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        onClose();
      }}
    >
      <header className="cw-sheet__head">
        <button
          type="button"
          className="cw-sheet__back"
          aria-label="Späť do chatu"
          onClick={onClose}
        >
          <WidgetIcon name="arrow" />
        </button>
        <div className="cw-sheet__title">
          <h3 id={titleId}>
            {sendState === "done" ? "Správa odoslaná" : "Napíšte mi"}
          </h3>
          <p>
            {sendState === "done"
              ? "Ozvem sa na váš e-mail."
              : "Odpoviem vám na e-mail, väčšinou v ten istý deň."}
          </p>
        </div>
      </header>

      {sendState === "done" ? (
        <div className="cw-sheet__done" role="status">
          <span className="cw-thanks__icon" ref={doneIconRef}>
            <WidgetIcon name="check" />
          </span>
          <h4>Ďakujem za správu.</h4>
          <p>
            {handedToMailClient
              ? "Otvoril som vám pripravený e-mail — stačí ho odoslať."
              : `Potvrdenie som poslal na ${email.trim()}. Odpoviem vám čo najskôr.`}
          </p>
          <button type="button" className="cw-sheet__done-action" onClick={onClose}>
            Späť do chatu
          </button>
        </div>
      ) : (
        <>
          <div className="cw-sheet__body">
            <label className="cw-field">
              <span>
                Váš e-mail <em>*</em>
              </span>
              <input
                ref={emailRef}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                type="email"
                inputMode="email"
                autoComplete="email"
                enterKeyHint="next"
                placeholder="meno@firma.sk"
                aria-invalid={Boolean(error) && !EMAIL_PATTERN.test(email.trim())}
              />
            </label>

            <label className="cw-field">
              <span>
                Správa <em>*</em>
              </span>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  if (error) setError("");
                }}
                rows={5}
                placeholder="S čím vám môžem pomôcť?"
              />
            </label>

            <div className="cw-photos">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="cw-photos__input"
                onChange={(event) => {
                  void addPhotos(event.target.files);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className="cw-photos__add"
                onClick={() => fileRef.current?.click()}
                disabled={preparing || photos.length >= MAX_ATTACHMENTS}
              >
                <WidgetIcon name="attachment" />
                <span>
                  {preparing
                    ? "Pripravujem fotku…"
                    : photos.length
                      ? "Pridať ďalšiu fotku"
                      : "Pridať fotku (nepovinné)"}
                </span>
              </button>

              {photos.length ? (
                <ul className="cw-photos__list">
                  {photos.map((photo, index) => (
                    <li key={`${photo.filename}-${index}`}>
                      <img
                        src={`data:${photo.contentType};base64,${photo.data}`}
                        alt=""
                      />
                      <span className="cw-photos__meta">
                        <b>{photo.filename}</b>
                        <small>{readableSize(photo.data.length)}</small>
                      </span>
                      <button
                        type="button"
                        aria-label={`Odobrať ${photo.filename}`}
                        onClick={() => removePhoto(index)}
                      >
                        <WidgetIcon name="close" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <footer className="cw-sheet__foot">
            {error ? (
              <p className="cw-lead__status" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="cw-submit"
              data-testid="mail-send"
              data-state={sendState}
              onClick={() => void send()}
              disabled={sendState === "sending" || preparing}
            >
              <span className="cw-submit__content">
                {sendState === "sending" ? (
                  <>
                    <span className="cw-send-flight" aria-hidden="true">
                      <WidgetIcon name="send" />
                      <i />
                    </span>
                    Posielam…
                  </>
                ) : (
                  <>
                    <WidgetIcon name="send" /> Odoslať správu
                  </>
                )}
              </span>
            </button>
            <p className="cw-consent-note">
              Odoslaním súhlasíte, že vás môžem kontaktovať k tejto správe.
            </p>
          </footer>
        </>
      )}
    </section>
  );
}
