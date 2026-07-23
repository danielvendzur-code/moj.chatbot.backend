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
  arrow: <path d="M5.5 12h12.8m-4.6-4.7 4.7 4.7-4.7 4.7" />,
  calculator: (
    <>
      <rect x="5.25" y="3.25" width="13.5" height="17.5" rx="3" />
      <path d="M8.25 7.5h7.5M8.4 12h.2m3.3 0h.2m3.3 0h.2M8.4 16h.2m3.3 0h.2m3.3 0h.2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="3" />
      <path d="M7.75 3.75v3M16.25 3.75v3M3.75 9.5h16.5M8 13h3M13.5 13H16M8 16.5h2" />
    </>
  ),
  cart: (
    <>
      <path d="M3.5 5h2.25l1.8 9.1a2 2 0 0 0 1.95 1.6h7.35a2 2 0 0 0 1.95-1.55L20.5 8H6.35" />
      <circle cx="9.25" cy="19" r="1.25" />
      <circle cx="17" cy="19" r="1.25" />
    </>
  ),
  chat: (
    <>
      <path d="M5.25 4.5h13.5a2 2 0 0 1 2 2v8.25a2 2 0 0 1-2 2H10l-4.75 3v-3H5.25a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2Z" />
      <path d="M7.5 9h9M7.5 12.25h6" />
    </>
  ),
  check: <path d="m5.25 12.25 4.2 4.2 9.3-9.4" />,
  close: <path d="m6.5 6.5 11 11m0-11-11 11" />,
  factory: (
    <>
      <path d="M4 20.25V10.5l5 3.25V10.5l5 3.25V7.5h5.5v12.75" />
      <path d="M3 20.25h18M8 20.25v-3.5h3.5v3.5" />
    </>
  ),
  food: (
    <>
      <path d="M5.25 3.5v5a3 3 0 0 0 6 0v-5M8.25 3.5v17" />
      <path d="M17.25 3.5c-1.65 1.2-2.5 3-2.5 5.3 0 2.1.85 3.65 2.5 4.6v7.1" />
    </>
  ),
  heart: <path d="M12 20.25 5.2 13.7a4.65 4.65 0 0 1-.1-6.45 4.35 4.35 0 0 1 6.25-.05l.65.65.65-.65a4.35 4.35 0 0 1 6.25.05 4.65 4.65 0 0 1-.1 6.45L12 20.25Z" />,
  mail: (
    <>
      <rect x="3.5" y="5.25" width="17" height="13.5" rx="3" />
      <path d="m4.75 7 7.25 5.5L19.25 7" />
    </>
  ),
  phone: <path d="M7.05 3.5h2.4l1.35 4.05-2 1.65a12.2 12.2 0 0 0 6 6l1.65-2 4.05 1.35v2.4a3.1 3.1 0 0 1-3.1 3.1A13.45 13.45 0 0 1 3.95 6.6a3.1 3.1 0 0 1 3.1-3.1Z" />,
  reset: <path d="M19.5 8.5V4.75m0 0h-3.75m3.75 0-2.65 2.6A7.5 7.5 0 1 0 19.25 14" />,
  send: <path d="m3.75 5 16.5 7-16.5 7 2.1-5.25L14 12 5.85 10.25 3.75 5Z" />,
  spark: (
    <>
      <path d="m11.75 3.5 1.45 4.3 4.3 1.45-4.3 1.45-1.45 4.3-1.45-4.3L6 9.25l4.3-1.45 1.45-4.3Z" />
      <path d="m18.5 14.25.75 2.25 2.25.75-2.25.75-.75 2.25-.75-2.25-2.25-.75 2.25-.75.75-2.25Z" />
    </>
  ),
  tools: (
    <>
      <path d="M14.8 5.2a4.4 4.4 0 0 0-5.25 5.6l-5.6 5.6a2.65 2.65 0 1 0 3.75 3.75l5.6-5.6a4.4 4.4 0 0 0 5.6-5.25l-2.75 2.75-3.2-3.2L15.7 6.1l-.9-.9Z" />
      <path d="m4.8 4.4 3.8 3.8" />
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
      strokeWidth="1.7"
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
