"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Check, X } from "lucide-react";

const eventName = "noor:coming-soon";

export function announceComingSoon(feature: string) {
  window.dispatchEvent(new CustomEvent<string>(eventName, { detail: feature }));
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { feature: string };

export function ComingSoonButton({ feature, children, ...props }: Props) {
  return (
    <button type="button" title={`${feature} — Coming soon`} {...props} onClick={() => announceComingSoon(feature)}>
      {children}
    </button>
  );
}

export function ComingSoonNotice() {
  const [feature, setFeature] = useState("");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const dismiss = () => setFeature("");
    const receive = (event: Event) => {
      if (timeout.current) clearTimeout(timeout.current);
      setFeature((event as CustomEvent<string>).detail);
      timeout.current = setTimeout(dismiss, 6500);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener(eventName, receive);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener(eventName, receive);
      window.removeEventListener("keydown", onKeyDown);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  return (
    <div className={`coming-soon-notice ${feature ? "is-visible" : ""}`}>
      <div role="status" aria-live="polite" aria-atomic="true" className="notice-content">
        {feature && <><span className="notice-mark"><Check size={18} /></span><span><strong>Coming soon</strong><span>{feature} will be available in a future update.</span></span></>}
      </div>
      {feature && <button type="button" className="icon-button notice-close" onClick={() => setFeature("")} aria-label="Dismiss notification"><X size={18} /></button>}
    </div>
  );
}
