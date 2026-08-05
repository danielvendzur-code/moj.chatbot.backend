type BubbleLogoProps = {
  size: "launcher" | "header" | "avatar";
};

/*
 * Compact Môj Chatbot symbol designed specifically for the widget.
 * A calm rounded speech-bubble frame, a simple M and a right-side tail stay
 * readable from the launcher down to the small message avatar. The mark has
 * no filled tile, face, eyes or duplicate outline.
 */
const FRAME =
  "M15 12.5H49C53.7 12.5 57.5 16.3 57.5 21V38.5" +
  "C57.5 43.2 53.7 47 49 47H42.5L50.5 55L36.5 47H15" +
  "C10.3 47 6.5 43.2 6.5 38.5V21C6.5 16.3 10.3 12.5 15 12.5Z";

const MONOGRAM = "M18 36V23L32 34.5L46 23V36";

export function BubbleLogo({ size }: BubbleLogoProps): JSX.Element {
  return (
    <span className={`bl bl--${size}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" focusable="false">
        <path
          className="bl__frame"
          d={FRAME}
          stroke="currentColor"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="bl__monogram"
          d={MONOGRAM}
          stroke="currentColor"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
