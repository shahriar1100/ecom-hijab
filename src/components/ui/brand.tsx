export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a href="#home" aria-label="NOOR home" className={`brand ${compact ? "brand-small" : ""}`}>
      <svg viewBox="0 0 40 44" fill="none" aria-hidden="true">
        <path d="M21 39C6 37 5 19 5 6c12 3 20 16 16 33Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M21 39C14 22 24 11 34 5c1 16 0 30-13 34Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 6c13 10 16 20 16 33 5 0 9-1 13-4" stroke="currentColor" strokeWidth="1.1" />
      </svg>
      <span>NOOR</span>
    </a>
  );
}
