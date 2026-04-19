import {
  CalendarDays, Clock, Sword, Star, Trophy, X, Tv2, Flame, AlarmClock, PlayCircle, BellRing, ListOrdered
} from "lucide-react";
import type { ScheduledStreamRowWithExtra } from "@/lib/supabase";

export function EventDetailModal({ stream, onClose }: { stream: ScheduledStreamRowWithExtra, onClose: () => void }) {
  const objective = stream.description || "Slot hunt + bonus opening session";
  const activities = stream.categories || ["Slots", "Bonus Hunt"];
  const rewards = stream.prize || "1000â‚¬ RAW";
  const duration = stream.duration || "4h+";
  const platform = stream.casino || "BETCLIC";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden border border-yellow-400/80 shadow-[0_8px_48px_0_rgba(0,0,0,0.85)] bg-gradient-to-br from-[#181617] via-[#23201c] to-[#181617] animate-scale-in"
        style={{
          boxShadow: "0 0 80px 0 #fbbf24cc, 0 0 0 1px #fbbf24cc inset, 0 8px 48px 0 rgba(0,0,0,0.85)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero Banner */}
        <div className="relative h-40 md:h-56 bg-gradient-to-br from-[#23201c] via-[#181617] to-[#23201c] flex items-end">
          {/* Ember/Glow effect */}
          <div className="absolute inset-0 pointer-events-none">
            <Flame className="absolute left-8 bottom-4 text-yellow-400/60 animate-pulse-slow" size={44} />
            <Flame className="absolute right-12 top-6 text-yellow-400/30 animate-pulse-slow" size={32} />
            <Flame className="absolute left-1/2 top-2 text-yellow-400/20 animate-pulse-slow" size={28} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="z-10 px-8 pb-4">
            <div className="flex items-center gap-3">
              <Tv2 className="text-yellow-400 drop-shadow-glow" size={32} />
              <span className="uppercase tracking-widest text-yellow-300/90 text-xs font-semibold">{platform}</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          className="absolute top-4 right-4 bg-yellow-400/10 hover:bg-yellow-400/30 rounded-full p-2 border border-yellow-400/60 shadow-md transition-all duration-150"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X className="text-yellow-400 drop-shadow-glow" size={24} />
        </button>

        {/* Content */}
        <div className="px-8 pb-8 pt-4 md:pt-8 flex flex-col gap-8">
          {/* Header */}
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-300 drop-shadow-glow mb-2 text-center">
              {stream.title}
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-sm text-yellow-200/80 font-medium mb-2">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-5 h-5 text-yellow-400" />
                <span>
                  {stream.stream_date}
                </span>
              </div>
              <span className="hidden md:inline">Â·</span>
              <div className="flex items-center gap-1">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span>
                  {stream.start_time.slice(0,5)}
                  {stream.end_time ? ` â€“ ${stream.end_time.slice(0,5)}` : ""}
                </span>
              </div>
            </div>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-yellow-400/0 via-yellow-400 to-yellow-400/0 rounded-full my-2" />
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Objective */}
            <div className="flex items-start gap-4">
              <Sword className="w-8 h-8 text-yellow-400/90 drop-shadow-glow" />
              <div>
                <div className="uppercase text-xs font-bold text-yellow-300/80 tracking-wider mb-1">Objetivo</div>
                <div className="text-base text-white/90">{objective}</div>
              </div>
            </div>
            {/* Activities */}
            <div className="flex items-start gap-4">
              <ListOrdered className="w-8 h-8 text-yellow-400/90 drop-shadow-glow" />
              <div>
                <div className="uppercase text-xs font-bold text-yellow-300/80 tracking-wider mb-1">Atividades</div>
                <div className="flex flex-wrap gap-2">
                  {activities.map((cat, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-400/10 text-yellow-200 text-xs font-semibold shadow">
                      {cat === "Slots" && <Tv2 className="w-4 h-4 text-yellow-400" />}
                      {cat === "Bonus Hunt" && <Sword className="w-4 h-4 text-yellow-400" />}
                      {cat === "Torneio" && <Star className="w-4 h-4 text-yellow-400" />}
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Rewards */}
            <div className="flex items-start gap-4">
              <Trophy className="w-8 h-8 text-yellow-400/90 drop-shadow-glow" />
              <div>
                <div className="uppercase text-xs font-bold text-yellow-300/80 tracking-wider mb-1">PrÃ©mios</div>
                <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-lg px-4 py-2 text-lg font-bold text-yellow-200 shadow-gold-glow">
                  {rewards}
                </div>
              </div>
            </div>
            {/* Duration */}
            <div className="flex items-start gap-4">
              <AlarmClock className="w-8 h-8 text-yellow-400/90 drop-shadow-glow" />
              <div>
                <div className="uppercase text-xs font-bold text-yellow-300/80 tracking-wider mb-1">DuraÃ§Ã£o</div>
                <div className="text-base text-white/90">{duration}</div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-2">
            <a
              href="#"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 text-black font-bold text-lg shadow-gold-glow hover:scale-105 hover:shadow-2xl transition-all duration-150"
            >
              <PlayCircle className="w-6 h-6" /> Assistir em Direto
            </a>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-yellow-400/10 border border-yellow-400/60 text-yellow-200 font-semibold text-base hover:bg-yellow-400/20 hover:scale-105 transition-all duration-150"
            >
              <BellRing className="w-5 h-5" /> Adicionar Lembrete
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-yellow-400/10 border border-yellow-400/60 text-yellow-200 font-semibold text-base hover:bg-yellow-400/20 hover:scale-105 transition-all duration-150"
            >
              <ListOrdered className="w-5 h-5" /> Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

