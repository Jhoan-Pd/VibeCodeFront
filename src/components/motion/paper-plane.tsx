import { forwardRef } from "react";

/**
 * Paper plane in SVG (original drawing, pointing right). Three folds in shades of the primary blue:
 * top wing, body and keel. Decorative: always aria-hidden.
 */
export const PaperPlane = forwardRef<HTMLSpanElement, { className?: string }>(function PaperPlane({ className }, ref) {
  return (
    <span ref={ref} className={className} aria-hidden="true">
      <svg viewBox="0 0 48 32" width="100%" height="100%" focusable="false">
        {/* Top wing */}
        <polygon points="47,4 1,13 17,18" fill="hsl(var(--primary))" />
        {/* Body (fold in shadow) */}
        <polygon points="47,4 17,18 11,25" fill="hsl(var(--primary-active))" />
        {/* Keel */}
        <polygon points="47,4 17,18 22,30" fill="hsl(var(--primary) / 0.55)" />
        {/* Central fold line */}
        <line x1="47" y1="4" x2="17" y2="18" stroke="hsl(var(--background))" strokeOpacity="0.55" strokeWidth="0.8" />
      </svg>
    </span>
  );
});
