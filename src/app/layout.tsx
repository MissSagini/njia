import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Literata } from "next/font/google";
import "./globals.css";

// Literata: the one hero headline per page. Fraunces: every other heading. DM Sans: everything else.
const literata = Literata({ variable: "--font-literata", subsets: ["latin", "latin-ext"], weight: "600" });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin", "latin-ext"], weight: "600" });
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Njia", template: "%s · Njia" },
  description:
    "Kenyan students get paired with Kenyan mentors who studied at their dream UK or European university, for guidance from application to settling in.",
};

export const viewport: Viewport = {
  themeColor: "#FBF6EE",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${literata.variable} ${fraunces.variable} ${dmSans.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
