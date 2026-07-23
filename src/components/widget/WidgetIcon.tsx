type WidgetIconName =
  | "arrow"
  | "calculator"
  | "calendar"
  | "cart"
  | "chat"
  | "check"
  | "close"
  | "factory"
  | "food"
  | "heart"
  | "mail"
  | "options"
  | "phone"
  | "reset"
  | "send"
  | "spark"
  | "tools"
  | "user";

type WidgetIconProps = {
  name: WidgetIconName;
  className?: string;
};

const PATHS: Record<WidgetIconName, JSX.Element> = {
  arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
  calculator: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="3.25" />
      <path d="M8 7.5h8M8.4 12h.1m3.45 0h.1m3.45 0h.1M8.4 16h.1m3.45 0h.1m3.45 0h.1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.75" y="5" width="16.5" height="15.25" rx="3.25" />
      <path d="M7.5 3.75v3M16.5 3.75v3M3.75 9.25h16.5M8 13h3m2.5 0H16M8 16.5h2" />
    </>
  ),
  cart: (
    <>
      <path d="M3.5 5.25h2.15l1.85 8.7a2.2 2.2 0 0 0 2.15 1.75h7a2.2 2.2 0 0 0 2.15-1.72L20.25 8H6.3" />
      <circle cx="9.5" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
    </>
  ),
  chat: (
    <>
      <path d="M5.5 4.5h13A2.5 2.5 0 0 1 21 7v7.5a2.5 2.5 0 0 1-2.5 2.5H10l-5 3v-3a2 2 0 0 1-2-2V7a2.5 2.5 0 0 1 2.5-2.5Z" />
      <path d="M7.5 9.25h9M7.5 12.75h6" />
    </>
  ),
  check: <path d="m5.5 12.5 4 4 9-9" />,
  close: <path d="m6.5 6.5 11 11m0-11-11 11" />,
  factory: (
    <>
      <path d="M4 20V10.75l5 3V10.5l5 3V7.5h5.5V20" />
      <path d="M3 20h18M8 20v-3.5h3.5V20" />
    </>
  ),
  food: (
    <>
      <path d="M5.25 3.5v5a3 3 0 0 0 6 0v-5M8.25 3.5V20.5" />
      <path d="M17.25 3.5c-1.7 1.25-2.5 3-2.5 5.25 0 2.1.85 3.65 2.5 4.6v7.15" />
    </>
  ),
  heart: <path d="M12 20.25 5.3 13.8a4.7 4.7 0 0 1-.1-6.5 4.4 4.4 0 0 1 6.3 0l.5.5.5-.5a4.4 4.4 0 0 1 6.3 0 4.7 4.7 0 0 1-.1 6.5L12 20.25Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.25" width="17" height="13.5" rx="3" />
      <path d="m4.75 7 7.25 5.5L19.25 7" />
    </>
  ),
  options: (
    <>
      <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
      <circle cx="9" cy="7" r="1.65" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="12" r="1.65" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="17" r="1.65" fill="currentColor" stroke="none" />
    </>
  ),
  phone: <path d="M7.1 3.5h2.3l1.35 4-2 1.65a12.4 12.4 0 0 0 6.1 6.1l1.65-2 4 1.35v2.3a3.1 3.1 0 0 1-3.1 3.1A13.4 13.4 0 0 1 4 6.6a3.1 3.1 0 0 1 3.1-3.1Z" />,
  reset: <path d="M19.5 8.75V4.5m0 0h-4.25m4.25 0-3 3A7.5 7.5 0 1 0 19.25 14" />,
  send: <path d="m3.75 5.25 16.5 6.75-16.5 6.75 2.2-5.05L14 12 5.95 10.3 3.75 5.25Z" />,
  spark: (
    <>
      <path d="m11.5 3.5 1.35 4.15 4.15 1.35-4.15 1.35-1.35 4.15-1.35-4.15L6 9l4.15-1.35L11.5 3.5Z" />
      <path d="m18.5 14.5.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
    </>
  ),
  tools: (
    <>
      <path d="M14.75 5.25a4.45 4.45 0 0 0-5.3 5.65l-5.5 5.5a2.65 2.65 0 1 0 3.75 3.75l5.5-5.5a4.45 4.45 0 0 0 5.65-5.3l-2.7 2.7-3.2-3.2 2.7-2.7-.9-.9Z" />
      <path d="m4.75 4.5 3.8 3.8" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20.25a7.5 7.5 0 0 1 15 0" />
    </>
  ),
};

export function WidgetIcon({ name, className = "" }: WidgetIconProps): JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      focusable="false"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
