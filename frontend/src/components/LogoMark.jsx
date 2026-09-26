import React from "react";

export default function LogoMark({ size = 36, wordmark = false, className = "" }) {
  return (
    <span className={`brand-lockup ${className}`.trim()} aria-label="Finoso">
      <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M8 54V10h21M8 29h17" />
        <path d="M35 11h22M35 19h22M37 11h9c10 0 10 16 0 16h-9l19 27" />
      </svg>
      {wordmark && <span className="brand-wordmark">Finoso</span>}
    </span>
  );
}
