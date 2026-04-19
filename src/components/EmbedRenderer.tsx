"use client";

import { useState, useRef } from "react";

export type EmbedType = "video" | "iframe" | "link";

interface EmbedRendererProps {
  type: EmbedType;
  embedUrl: string;
  title: string;
}

/* ── Video player ───────────────────────────────────────────── */
function VideoEmbed({ src, title }: { src: string; title: string }) {
  return (
    <video
      className="win-embed__video"
      controls
      preload="metadata"
      aria-label={title}
    >
      <source src={src} />
      <p className="win-embed__unsupported">
        O teu browser não suporta vídeo HTML5.{" "}
        <a href={src} target="_blank" rel="noopener noreferrer" className="win-embed__link">
          Ver Battle Replay
        </a>
      </p>
    </video>
  );
}

/* ── iFrame embed (YouTube etc.) ────────────────────────────── */
function IframeEmbed({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="win-embed__iframe-wrap">
      {!loaded && <div className="win-embed__skeleton" aria-hidden="true" />}
      <iframe
        className="win-embed__iframe"
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

/* ── Link fallback ──────────────────────────────────────────── */
function LinkFallback({ href, title }: { href: string; title: string }) {
  const iconRef = useRef<SVGSVGElement>(null);
  return (
    <div className="win-embed__link-fallback">
      <div className="win-embed__sword-icon" aria-hidden="true">
        <svg ref={iconRef} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
          <path d="M14.5 2L2 14.5l7.5 7.5L22 9.5V2h-7.5Z" />
          <path d="M2 22l4-4M14.5 2l-4 4" />
          <circle cx="19" cy="5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <p className="win-embed__link-label">{title}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="win-embed__battle-btn"
      >
        <span>Ver Battle Replay</span>
        <svg className="win-embed__arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </a>
    </div>
  );
}

/* ── Main renderer ──────────────────────────────────────────── */
export default function EmbedRenderer({ type, embedUrl, title }: EmbedRendererProps) {
  if (type === "video")  return <VideoEmbed  src={embedUrl} title={title} />;
  if (type === "iframe") return <IframeEmbed src={embedUrl} title={title} />;
  return <LinkFallback href={embedUrl} title={title} />;
}
