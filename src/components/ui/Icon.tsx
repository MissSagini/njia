import type { CSSProperties, SVGProps } from "react";

type Shape =
  | ["path", SVGProps<SVGPathElement>]
  | ["line", SVGProps<SVGLineElement>]
  | ["circle", SVGProps<SVGCircleElement>]
  | ["rect", SVGProps<SVGRectElement>]
  | ["polyline", SVGProps<SVGPolylineElement>]
  | ["polygon", SVGProps<SVGPolygonElement>];

// Path data copied from Lucide (ISC). 24×24, 2px stroke, round caps and joins.
const ICONS = {
  "chevron-down": [["path", { d: "m6 9 6 6 6-6" }]],
  "chevron-left": [["path", { d: "m15 18-6-6 6-6" }]],
  "chevron-right": [["path", { d: "m9 18 6-6-6-6" }]],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  x: [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]],
  plus: [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]],
  menu: [
    ["line", { x1: 4, x2: 20, y1: 6, y2: 6 }],
    ["line", { x1: 4, x2: 20, y1: 12, y2: 12 }],
    ["line", { x1: 4, x2: 20, y1: 18, y2: 18 }],
  ],
  "arrow-right": [["path", { d: "M5 12h14" }], ["path", { d: "m12 5 7 7-7 7" }]],
  "alert-circle": [
    ["circle", { cx: 12, cy: 12, r: 10 }],
    ["line", { x1: 12, x2: 12, y1: 8, y2: 12 }],
    ["line", { x1: 12, x2: 12.01, y1: 16, y2: 16 }],
  ],
  calendar: [
    ["rect", { x: 3, y: 4, width: 18, height: 18, rx: 2 }],
    ["line", { x1: 16, x2: 16, y1: 2, y2: 6 }],
    ["line", { x1: 8, x2: 8, y1: 2, y2: 6 }],
    ["line", { x1: 3, x2: 21, y1: 10, y2: 10 }],
  ],
  clock: [["circle", { cx: 12, cy: 12, r: 10 }], ["polyline", { points: "12 6 12 12 16 14" }]],
  video: [["path", { d: "m22 8-6 4 6 4V8Z" }], ["rect", { x: 2, y: 6, width: 14, height: 12, rx: 2 }]],
  "message-circle": [["path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }]],
  mail: [
    ["rect", { x: 2, y: 4, width: 20, height: 16, rx: 2 }],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" }],
  ],
  "graduation-cap": [
    ["path", { d: "M22 10v6M2 10l10-5 10 5-10 5z" }],
    ["path", { d: "M6 12v5c3 3 9 3 12 0v-5" }],
  ],
  "map-pin": [
    ["path", { d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" }],
    ["circle", { cx: 12, cy: 10, r: 3 }],
  ],
  smartphone: [["rect", { x: 5, y: 2, width: 14, height: 20, rx: 2 }], ["path", { d: "M12 18h.01" }]],
  "credit-card": [
    ["rect", { x: 2, y: 5, width: 20, height: 14, rx: 2 }],
    ["line", { x1: 2, x2: 22, y1: 10, y2: 10 }],
  ],
  user: [["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }], ["circle", { cx: 12, cy: 7, r: 4 }]],
  users: [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
    ["circle", { cx: 9, cy: 7, r: 4 }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
    ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }],
  ],
  home: [
    ["path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }],
    ["polyline", { points: "9 22 9 12 15 12 15 22" }],
  ],
  "list-checks": [
    ["path", { d: "m3 17 2 2 4-4" }],
    ["path", { d: "m3 7 2 2 4-4" }],
    ["path", { d: "M13 6h8" }],
    ["path", { d: "M13 12h8" }],
    ["path", { d: "M13 18h8" }],
  ],
  "file-text": [
    ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M16 13H8" }],
    ["path", { d: "M16 17H8" }],
    ["path", { d: "M10 9H8" }],
  ],
  compass: [
    ["circle", { cx: 12, cy: 12, r: 10 }],
    ["polygon", { points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" }],
  ],
  lock: [["rect", { x: 3, y: 11, width: 18, height: 11, rx: 2 }], ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }]],
  plane: [
    [
      "path",
      {
        d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
      },
    ],
  ],
  "external-link": [
    ["path", { d: "M15 3h6v6" }],
    ["path", { d: "M10 14 21 3" }],
    ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }],
  ],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

type IconProps = {
  name: IconName;
  /** 20 default, 18 inside md buttons and inputs, 22–24 in navigation. */
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Set when the icon carries meaning on its own; otherwise it is hidden from screen readers. */
  title?: string;
  className?: string;
  style?: CSSProperties;
};

export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 2, title, className, style }: IconProps) {
  const shapes: Shape[] = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: "none", display: "block", ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {shapes.map(([Tag, attrs], i) => {
        const El = Tag as "path";
        return <El key={i} {...(attrs as SVGProps<SVGPathElement>)} />;
      })}
    </svg>
  );
}
