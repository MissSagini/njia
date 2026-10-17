"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { cx } from "@/lib/cx";
import { isActive, logInHref, siteCta, siteLinks } from "@/lib/navigation";

/**
 * Sticky Cream website header. Gains a Line border and shadow-sm once the page scrolls.
 * Desktop (lg+): links, Log in and the Apply now button. Mobile: a menu button opens a drawer.
 * The call to action is Forest, so Sunset stays free for each page's hero button.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      className={cx(
        "sticky top-0 z-20 border-b bg-cream font-body transition-[border-color,box-shadow] duration-200",
        scrolled || open ? "border-line shadow-sm" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-site items-center gap-8 px-5 lg:h-[76px] lg:px-10">
        <Link href="/" aria-label="Njia home" onClick={close} className="block rounded-sm">
          <span className="lg:hidden">
            <Logo width={92} priority />
          </span>
          <span className="hidden lg:block">
            <Logo width={108} priority />
          </span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 gap-7 lg:flex">
          {siteLinks.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center border-b-2 px-0.5 text-[16px] no-underline transition-colors duration-120 hover:no-underline",
                  active ? "border-forest font-semibold text-forest" : "border-transparent font-medium text-ink hover:border-line",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" size="md" href={logInHref}>
            Log in
          </Button>
          <Button variant="secondary" size="md" href={siteCta.href}>
            {siteCta.label}
          </Button>
        </div>

        <div className="flex-1 lg:hidden" />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className={cx(
            "flex size-11 cursor-pointer items-center justify-center rounded-md border-0 text-forest lg:hidden",
            open ? "bg-forest-soft" : "bg-transparent",
          )}
        >
          <Icon name={open ? "x" : "menu"} size={24} />
        </button>
      </div>

      {open ? (
        <nav id="site-menu" aria-label="Main" className="flex flex-col gap-1 border-b border-line bg-cream px-5 pt-2 pb-6 lg:hidden">
          {siteLinks.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center border-b border-line px-1 text-[18px] no-underline hover:no-underline",
                  active ? "font-semibold text-forest" : "font-medium text-ink",
                )}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="mt-4 flex flex-col gap-3" onClick={close}>
            <Button variant="secondary" fullWidth href={siteCta.href}>
              {siteCta.label}
            </Button>
            <Button variant="outline" size="md" fullWidth href={logInHref}>
              Log in
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
