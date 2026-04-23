"use client";

import { useState, useEffect } from "react";

export type EmbedType = "video" | "iframe" | "link" | "twitch_clip" | "twitch_video";

interface EmbedRendererProps {
  type: EmbedType;
  embedUrl: string;
  title: string;
  /** Thumbnail URL — shown before the video loads (slot image or custom upload). */
  thumbnailUrl?: string;
  /** When true: iframe loads immediately, autoplay muted, shows unmute button. */
  featured?: boolean;
}

function extractYTId(embedUrl: string): string | null {
  return embedUrl.match(/\/embed\/([a-zA-Z0-9_-]{8,15})/)?.[1] ?? null;
}

/* ── YouTube / generic iframe ─────────────────────────────────── */
function IframeEmbed({
  src,
  title,
  thumbnailUrl,
  featured,
}: {
  src: string;
  title: string;
  thumbnailUrl?: string;
  featured?: boolean;
}) {
  const videoId = extractYTId(src);
  const autoThumb = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  const thumb = thumbnailUrl || autoThumb;

  /* All hooks declared unconditionally */
  const [active, setActive] = useState(featured ?? false);
  const [muted, setMuted] = useState(true);

  const buildSrc = (isMuted: boolean) => {
    let s = src;
    if (!s.includes("autoplay")) s += `${s.includes("?") ? "&" : "?"}autoplay=1`;
    if (featured) {
      s = s.replace(/[&?]mute=\d/, "");
      s += `&mute=${isMuted ? 1 : 0}`;
    }
    return s;
  };

  /* ─ Featured: autoplay muted, unmute overlay ─ */
  if (featured) {
    return (
      <div className="win-embed__iframe-wrap" style={{ position: "relative" }}>
        <iframe
          key={`yt-featured-${String(muted)}`}
          className="win-embed__iframe"
          src={buildSrc(muted)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
        {muted && (
          <button
            onClick={() => setMuted(false)}
            className="win-embed__unmute-btn"
            aria-label="Ativar som"
          >
            🔇 Ativar Som
          </button>
        )}
      </div>
    );
  }

  /* ─ Card: thumbnail facade → click → play ─ */
  if (!active && thumb) {
    return (
      <div
        className="win-embed__thumb"
        role="button"
        tabIndex={0}
        aria-label={`Reproduzir ${title}`}
        onClick={() => setActive(true)}
        onKeyDown={(e) => e.key === "Enter" && setActive(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt={title} className="win-embed__thumb-img" loading="lazy" decoding="async" />
        <div className="win-embed__play-btn" aria-hidden="true">
          <svg viewBox="0 0 36 36" fill="currentColor">
            <circle cx="18" cy="18" r="18" className="win-embed__play-bg" />
            <path d="M14 11l14 7-14 7V11z" className="win-embed__play-arrow" />
          </svg>
        </div>
        <div className="win-embed__thumb-overlay" aria-hidden="true" />
        <span className="win-embed__platform-badge win-embed__platform-badge--yt" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 10, height: 10 }}>
            <path d="M23.5 6.19a3 3 0 0 0-2.12-2.13C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.56A3 3 0 0 0 .5 6.19C0 8.05 0 12 0 12s0 3.95.5 5.81a3 3 0 0 0 2.12 2.13C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.56a3 3 0 0 0 2.12-2.13C24 15.95 24 12 24 12s0-3.95-.5-5.81zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z" />
          </svg>
          YouTube
        </span>
      </div>
    );
  }

  if (!active) {
    /* No thumbnail — show dark play-only overlay */
    return (
      <div
        className="win-embed__thumb win-embed__thumb--no-img"
        role="button"
        tabIndex={0}
        aria-label={`Reproduzir ${title}`}
        onClick={() => setActive(true)}
        onKeyDown={(e) => e.key === "Enter" && setActive(true)}
      >
        <div className="win-embed__play-btn" aria-hidden="true">
          <svg viewBox="0 0 36 36" fill="currentColor">
            <circle cx="18" cy="18" r="18" className="win-embed__play-bg" />
            <path d="M14 11l14 7-14 7V11z" className="win-embed__play-arrow" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="win-embed__iframe-wrap">
      <iframe
        className="win-embed__iframe"
        src={buildSrc(false)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    </div>
  );
}

/* ── Twitch clip / VOD ────────────────────────────────────────── */
function TwitchEmbed({
  embedId,
  embedType,
  title,
  thumbnailUrl,
  featured,
}: {
  embedId: string;
  embedType: "twitch_clip" | "twitch_video";
  title: string;
  thumbnailUrl?: string;
  featured?: boolean;
}) {
  const [active, setActive] = useState(featured ?? false);
  const [muted, setMuted] = useState(true);
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    setHostname(window.location.hostname || "localhost");
  }, []);

  const buildSrc = (isMuted: boolean) => {
    if (!hostname) return "";
    const base =
      embedType === "twitch_clip"
        ? `https://clips.twitch.tv/embed?clip=${encodeURIComponent(embedId)}`
        : `https://player.twitch.tv/?video=${encodeURIComponent(embedId)}`;
    return `${base}&parent=${hostname}&autoplay=true&muted=${isMuted}`;
  };

  /* ─ Thumbnail facade ─ */
  if (!active) {
    return (
      <div
        className="win-embed__thumb"
        role="button"
        tabIndex={0}
        aria-label={`Reproduzir ${title}`}
        onClick={() => setActive(true)}
        onKeyDown={(e) => e.key === "Enter" && setActive(true)}
      >
        {thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={thumbnailUrl} alt={title} className="win-embed__thumb-img" loading="lazy" decoding="async" />
        ) : (
          <div className="win-embed__thumb-placeholder" aria-hidden="true" />
        )}
        <div className="win-embed__play-btn" aria-hidden="true">
          <svg viewBox="0 0 36 36" fill="currentColor">
            <circle cx="18" cy="18" r="18" className="win-embed__play-bg" />
            <path d="M14 11l14 7-14 7V11z" className="win-embed__play-arrow" />
          </svg>
        </div>
        <div className="win-embed__thumb-overlay" aria-hidden="true" />
        <span className="win-embed__platform-badge win-embed__platform-badge--twitch" aria-hidden="true">
          <svg viewBox="0 0 24 28" fill="currentColor" style={{ width: 10, height: 10 }}>
            <path d="M2.149 0L0 6.333V24h6v4h4l4-4h4l6-6V0H2.149zM21 17l-4 4h-4l-3.5 3.5V21H5V2h16v15z" />
            <path d="M9 7H7v6h2V7zM14 7h-2v6h2V7z" />
          </svg>
          Twitch
        </span>
      </div>
    );
  }

  /* ─ Wait for hostname before mounting iframe ─ */
  if (!hostname) {
    return (
      <div className="win-embed__iframe-wrap">
        <div className="win-embed__loading" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="win-embed__iframe-wrap" style={{ position: "relative" }}>
      <iframe
        key={`tw-${hostname}-${String(muted)}`}
        src={buildSrc(muted)}
        title={title}
        allowFullScreen
        className="win-embed__iframe"
        loading="lazy"
        allow="autoplay; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {featured && muted && (
        <button
          onClick={() => setMuted(false)}
          className="win-embed__unmute-btn"
          aria-label="Ativar som"
        >
          🔇 Ativar Som
        </button>
      )}
    </div>
  );
}

/* ── Direct video file ────────────────────────────────────── */
function VideoEmbed({ src, title }: { src: string; title: string }) {
  return (
    <div className="win-embed__iframe-wrap">
      <video
        className="win-embed__video"
        controls
        preload="metadata"
        aria-label={title}
        playsInline
      >
        <source src={src} />
        <a href={src} target="_blank" rel="noopener noreferrer" className="win-embed__ext-link">
          Ver vídeo
        </a>
      </video>
    </div>
  );
}

/* ── Link fallback ────────────────────────────────────────── */
function LinkFallback({ href, title }: { href: string; title: string }) {
  return (
    <div className="win-embed__link-fallback">
      <svg className="win-embed__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M13 10H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        <path d="M8 10V6a4 4 0 0 1 8 0v1" />
        <path d="M18 2l4 4-4 4M22 6H13" />
      </svg>
      <p className="win-embed__link-label">{title}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="win-embed__cta"
      >
        Abrir Replay
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </a>
    </div>
  );
}

export default function EmbedRenderer({ type, embedUrl, title, thumbnailUrl, featured }: EmbedRendererProps) {
  if (type === "twitch_clip" || type === "twitch_video")
    return <TwitchEmbed embedId={embedUrl} embedType={type} title={title} thumbnailUrl={thumbnailUrl} featured={featured} />;
  if (type === "video")
    return <VideoEmbed src={embedUrl} title={title} />;
  if (type === "iframe")
    return <IframeEmbed src={embedUrl} title={title} thumbnailUrl={thumbnailUrl} featured={featured} />;
  return <LinkFallback href={embedUrl} title={title} />;
}
