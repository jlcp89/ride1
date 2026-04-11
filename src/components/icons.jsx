/* Shared inline SVG icons. No external dependency. Every icon accepts a
   `size` prop (default 16) so it can be used inline with text. */

function Svg({ size = 16, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** Brand mark. A stylized paper plane / wing, rendered in white for use
    against the accent gradient background. */
export function LogoMark({ size = 20 }) {
  return (
    <Svg size={size} strokeWidth="2">
      <path d="M3 11.5 20.5 4 13 21.5l-2.5-8Z" />
      <path d="m10.5 13.5 10-9.5" />
    </Svg>
  )
}

export function SortArrow({ size = 12 }) {
  return (
    <Svg size={size} strokeWidth="2.5">
      <path d="M18 15l-6-6-6 6" />
    </Svg>
  )
}

export function CloseIcon({ size = 14 }) {
  return (
    <Svg size={size} strokeWidth="2.5">
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </Svg>
  )
}

export function CopyIcon({ size = 14 }) {
  return (
    <Svg size={size}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Svg>
  )
}

export function CheckIcon({ size = 14 }) {
  return (
    <Svg size={size} strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </Svg>
  )
}

export function MapPinIcon({ size = 14 }) {
  return (
    <Svg size={size}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  )
}

export function EmptyBoxIcon({ size = 56 }) {
  return (
    <Svg size={size} strokeWidth="1.5">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" opacity="0.35" />
    </Svg>
  )
}

export function SpinnerIcon({ size = 16 }) {
  return (
    <Svg size={size} className="spinner">
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </Svg>
  )
}

export function ChevronLeft({ size = 14 }) {
  return (
    <Svg size={size} strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" />
    </Svg>
  )
}

export function ChevronRight({ size = 14 }) {
  return (
    <Svg size={size} strokeWidth="2.5">
      <path d="M9 18l6-6-6-6" />
    </Svg>
  )
}

export function ChevronsLeft({ size = 14 }) {
  return (
    <Svg size={size} strokeWidth="2.5">
      <path d="M11 18l-6-6 6-6" />
      <path d="M18 18l-6-6 6-6" />
    </Svg>
  )
}

export function ChevronsRight({ size = 14 }) {
  return (
    <Svg size={size} strokeWidth="2.5">
      <path d="M13 18l6-6-6-6" />
      <path d="M6 18l6-6-6-6" />
    </Svg>
  )
}

export function RefreshIcon({ size = 14 }) {
  return (
    <Svg size={size}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </Svg>
  )
}
