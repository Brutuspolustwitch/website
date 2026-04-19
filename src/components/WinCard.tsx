"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import EmbedRenderer from "./EmbedRenderer";
import type { EmbedType } from "./EmbedRenderer";

export interface WinClip {
  id: string;
  twitch_id: string;
  username: string;
  avatar_url: string | null;
  title: string;
  description: string | null;
  url: string;
  provider: string | null;
  embed_type: EmbedType;
  embed_url: string;
  honors: number;
  created_at: string;
}

interface WinCardProps {
  clip: WinClip;
  currentUserId: string | null;
  onHonor: (id: string) => void;
  honored: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day:   "2-digit",
    month: "long",
    year:  "numeric",
  });
}

export default function WinCard({ clip, currentUserId, onHonor, honored }: WinCardProps) {
  const [localHonors, setLocalHonors] = useState(clip.honors);
  const [localHonored, setLocalHonored] = useState(honored);
  const [loading, setLoading] = useState(false);

  const handleHonor = async () => {
    if (!currentUserId || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user-clips/${clip.id}/honor`, { method: "POST" });
      if (res.ok) {
        const { honored: newHonored } = await res.json();
        setLocalHonored(newHonored);
        setLocalHonors((n) => n + (newHonored ? 1 : -1));
        onHonor(clip.id);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.article
      className="win-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      layout
    >
      {/* Engraved header */}
      <div className="win-card__header">
        <div className="win-card__avatar">
          {clip.avatar_url ? (
            <Image
              src={clip.avatar_url}
              alt={clip.username}
              width={40}
              height={40}
              className="win-card__avatar-img"
              unoptimized
            />
          ) : (
            <div className="win-card__avatar-placeholder" aria-hidden="true" />
          )}
        </div>

        <div className="win-card__meta">
          <span className="win-card__username">{clip.username}</span>
          <span className="win-card__date">{formatDate(clip.created_at)}</span>
        </div>

        {clip.provider && (
          <span className="win-card__badge">{clip.provider}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="win-card__title">{clip.title}</h3>

      {/* Embed area */}
      <div className="win-card__embed">
        <EmbedRenderer
          type={clip.embed_type}
          embedUrl={clip.embed_url}
          title={clip.title}
        />
      </div>

      {/* Description */}
      {clip.description && (
        <p className="win-card__description">{clip.description}</p>
      )}

      {/* Footer: honor button */}
      <div className="win-card__footer">
        <button
          className={`win-card__honor-btn${localHonored ? " win-card__honor-btn--active" : ""}`}
          onClick={handleHonor}
          disabled={!currentUserId || loading}
          aria-label={localHonored ? "Remover Honra" : "Dar Honra"}
          title={!currentUserId ? "Faz login para dar honra" : undefined}
        >
          {/* Shield stamp icon */}
          <svg className="win-card__shield" viewBox="0 0 24 24" fill={localHonored ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
            <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.33C17.25 22.15 21 17.25 21 12V6L12 2Z" />
          </svg>
          <span className="win-card__honor-count">{localHonors}</span>
        </button>
      </div>
    </motion.article>
  );
}
