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
  arrow: <path d="M5 12h13m-5-5 5 5-5 5" />,
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h1m3 0h1m3 0h1M8 16h1m3 0h1m3 0h1" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 10h16M8 3v4m8-4v4m-8 7h3m3 0h2" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.4 11h10.8L21 8H7" />
      <circle cx="9" cy="19" r="1.6" />
      <circle cx="16" cy="19" r="1.6" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4V5Zm4 5h8m-8 3h5" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  factory: <path d="M3 21V9l6 4V9l6 4V4h6v17H3Zm13-5h2m-2 3h2M7 16h2m-2 3h2" />,
  food: <path d="M6 3v7m4-7v7M8 3v18M8 10c-1.6 0-3-1-3-3m6 3c1.6 0 3-1 3-3m2 14V4c2.4 1.4 4 4 4 7v4h-4" />,
  heart: <path d="M12 20 5.2 13a4.6 4.6 0 0 1 0-6.4 4.3 4.3 0 0 1 6.2 0l.6.6.6-.6a4.3 4.3 0 0 1 6.2 0 4.6 4.6 0 0 1 0 6.4L12 20Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: <path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2L21 14.5v3A2.5 2.5 0 0 1 18.5 20 15.5 15.5 0 0 1 4 5.5 2.5 2.5 0 0 1 6.5 3Z" />,
  reset: <path d="M20 11a8 8 0 1 1-2.3-5.7L20 8M20 3v5h-5" />,
  send: <path d="m3 20 18-8L3 4l2 6 10 2-10 2-2 6Z" />,
  spark: <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
  tools: <path d="m5 3 4 4-2 2-4-4c0-1.2.8-2 2-2Zm11.5 1.5a4 4 0 0 0-5 5L4 17c-1 1-1 2.5 0 3.5s2.5 1 3.5 0l7.5-7.5a4 4 0 0 0 5-5L17 11l-2.5-2.5 2-2Z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
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
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
