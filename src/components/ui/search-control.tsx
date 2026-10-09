"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { announceComingSoon } from "./coming-soon";

export function SearchControl() {
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(true);
    if (!dialog.current?.open) announceComingSoon("Search");
  };

  return (
    <>
      <form className="desktop-search" onSubmit={submit} role="search">
        <button type="submit" aria-label="Search — Coming soon"><Search size={18} /></button>
        <input aria-label="Search hijabs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search hijabs, colors, styles..." />
      </form>
      <button ref={trigger} type="button" className="icon-button compact-search" aria-label="Open search" onClick={() => { setFeedback(false); dialog.current?.showModal(); }}><Search /></button>
      <dialog ref={dialog} className="search-dialog" onClose={() => trigger.current?.focus()} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} aria-labelledby="search-title">
        <div className="search-dialog-content">
          <div className="flex items-center justify-between gap-4"><h2 id="search-title">Find your everyday favourite</h2><button type="button" className="icon-button" onClick={() => dialog.current?.close()} aria-label="Close search"><X /></button></div>
          <p>Beautiful colours. Effortless comfort.</p>
          <form onSubmit={submit} className="search-dialog-form" role="search">
            <Search size={20} aria-hidden="true" />
            <input autoFocus aria-label="Search hijabs, colors or styles" value={query} onChange={(event) => { setQuery(event.target.value); setFeedback(false); }} placeholder="Search hijabs, colors, styles..." />
            <button type="submit" className="icon-button" aria-label="Submit search"><ArrowRight /></button>
          </form>
          <p role="status" className="search-feedback">{feedback ? "Coming soon — search will be available in a future update." : "Search is coming soon. Discover our favourites below."}</p>
          <a className="text-link" href="#new-items" onClick={() => dialog.current?.close()}>Explore new items <ArrowRight size={17} /></a>
        </div>
      </dialog>
    </>
  );
}
