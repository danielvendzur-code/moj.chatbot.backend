type WidgetIconName =
  | "arrow"
  | "calculator"
  | "chat"
  | "check"
  | "close"
  | "mail"
  | "reset"
  | "send"
  | "spark"
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
  chat: <path d="M4 5h16v11H9l-5 4V5Zm4 5h8m-8 3h5" />,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  reset: <path d="M20 11a8 8 0 1 1-2.3-5.7L20 8M20 3v5h-5" />,
  send: <path d="m3 20 18-8L3 4l2 6 10 2-10 2-2 6Z" />,
  spark: <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />,
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
