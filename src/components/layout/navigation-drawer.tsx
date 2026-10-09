"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Category } from "@/types/store";

const upcomingPages = ["My Orders", "About Us", "Contact Us", "Delivery & Returns", "Help / FAQ"];

export function NavigationDrawer({ activePage, categories }: {
  activePage: "home" | "shop";
  categories: Pick<Category, "id" | "name" | "href">[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [notice, setNotice] = useState("");

  function close() { dialog.current?.close(); }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) dialog.current?.close(); };
    const onHistory = () => dialog.current?.close();
    desktop.addEventListener("change", onResize);
    window.addEventListener("popstate", onHistory);
    return () => {
      desktop.removeEventListener("change", onResize);
      window.removeEventListener("popstate", onHistory);
    };
  }, []);

  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]'))
      .filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return <>
    <button ref={trigger} type="button" className="icon-button menu-trigger" aria-label="Open menu" aria-haspopup="dialog" aria-controls="navigation-drawer" aria-expanded={open} onClick={() => {
      setNotice("");
      setCategoriesOpen(false);
      dialog.current?.showModal();
      setOpen(true);
    }}><Menu aria-hidden="true" /></button>

    <dialog ref={dialog} id="navigation-drawer" className="navigation-drawer" aria-labelledby="navigation-drawer-title" onKeyDown={containFocus} onClick={(event) => { if (event.target === event.currentTarget) close(); }} onClose={() => {
      setOpen(false);
      if (trigger.current?.getClientRects().length) trigger.current.focus({ preventScroll: true });
      else document.querySelector<HTMLAnchorElement>(".site-header .brand")?.focus({ preventScroll: true });
    }}>
      <div className="navigation-drawer-shell">
        <div className="navigation-drawer-heading"><div><span className="menu-eyebrow">EXPLORE NOOR</span><h2 id="navigation-drawer-title">Menu</h2></div><button type="button" className="icon-button" aria-label="Close menu" onClick={close}><X aria-hidden="true" /></button></div>
        <nav className="navigation-drawer-scroll" aria-label="Menu navigation">
          <ul className="menu-primary-links">
            <li><Link href="/#home" className="menu-link" aria-current={activePage === "home" ? "page" : undefined} onNavigate={close}>Home<ChevronRight aria-hidden="true" /></Link></li>
            <li><Link href="/shop" className="menu-link" aria-current={activePage === "shop" ? "page" : undefined} onNavigate={close}>Shop All<ChevronRight aria-hidden="true" /></Link></li>
            <li><button type="button" className="menu-link menu-category-toggle" aria-expanded={categoriesOpen} aria-controls="menu-category-links" onClick={() => setCategoriesOpen(!categoriesOpen)}>Categories<ChevronDown aria-hidden="true" /></button>
              <ul id="menu-category-links" className="menu-category-links" hidden={!categoriesOpen}>{categories.map((category) => <li key={category.id}><Link href={category.href} onNavigate={close}>{category.name}<ChevronRight aria-hidden="true" /></Link></li>)}</ul>
            </li>
          </ul>
          <ul className="menu-secondary-links">{upcomingPages.map((label) => <li key={label}><button type="button" className="menu-link" aria-label={`${label} — Coming soon`} onClick={() => setNotice(`${label} — Coming soon. This page will be available in a future update.`)}>{label}<ChevronRight aria-hidden="true" /></button></li>)}</ul>
        </nav>
        <div className="navigation-drawer-footer"><p className="menu-feedback" role="status" aria-live="polite" aria-atomic="true">{notice}</p><ThemeToggle variant="menu" /></div>
      </div>
    </dialog>
  </>;
}
