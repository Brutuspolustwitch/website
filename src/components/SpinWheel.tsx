"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════
   TYPES & CONFIG
   ═══════════════════════════════════════════════════════════════════ */

interface Reward {
  label: string;
  icon: string;
  color: string;
  glowColor: string;
  tier: "legendary" | "epic" | "rare" | "common" | "loss";
}

const REWARDS: Reward[] = [
  { label: "Jackpot",         icon: "👑", color: "#d4a843", glowColor: "rgba(212,168,67,0.6)",  tier: "legendary" },
  { label: "Free Spin",       icon: "🔄", color: "#cd7f32", glowColor: "rgba(205,127,50,0.5)",  tier: "rare" },
  { label: "Bonus Coins",     icon: "🪙", color: "#f0d78c", glowColor: "rgba(240,215,140,0.5)", tier: "common" },
  { label: "XP Boost",        icon: "⚡", color: "#ff6f00", glowColor: "rgba(255,111,0,0.5)",   tier: "common" },
  { label: "Mystery Reward",  icon: "🎭", color: "#9c27b0", glowColor: "rgba(156,39,176,0.5)",  tier: "epic" },
  { label: "Defeat",          icon: "💀", color: "#8b0000", glowColor: "rgba(139,0,0,0.5)",     tier: "loss" },
  { label: "Bonus Coins",     icon: "🪙", color: "#f0d78c", glowColor: "rgba(240,215,140,0.5)", tier: "common" },
  { label: "Free Spin",       icon: "🔄", color: "#cd7f32", glowColor: "rgba(205,127,50,0.5)",  tier: "rare" },
  { label: "XP Boost",        icon: "⚡", color: "#ff6f00", glowColor: "rgba(255,111,0,0.5)",   tier: "common" },
  { label: "Defeat",          icon: "💀", color: "#8b0000", glowColor: "rgba(139,0,0,0.5)",     tier: "loss" },
];

const SEGMENT_COUNT = REWARDS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = "arena-spin-last";

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function getLastSpin(): number | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : null;
}

function setLastSpin(time: number) {
  localStorage.setItem(STORAGE_KEY, time.toString());
}

function canSpin(): boolean {
  const last = getLastSpin();
  if (!last) return true;
  return Date.now() - last >= COOLDOWN_MS;
}

function getRemainingMs(): number {
  const last = getLastSpin();
  if (!last) return 0;
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PARTICLE CANVAS — ambient floating embers
   ═══════════════════════════════════════════════════════════════════ */

function EmberCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number; y: number; r: number; vx: number; vy: number;
      alpha: number; decay: number; hue: number;
    }

    const particles: Particle[] = [];

    function spawnParticle() {
      if (!canvas) return;
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: canvas.offsetHeight + 10,
        r: 1 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.3 + Math.random() * 0.8),
        alpha: 0.5 + Math.random() * 0.5,
        decay: 0.002 + Math.random() * 0.003,
        hue: 15 + Math.random() * 25,
      });
    }

    function loop() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      if (Math.random() < 0.15) spawnParticle();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(Date.now() * 0.001 + i) * 0.15;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${p.alpha})`);
        grad.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BURST PARTICLES — on win
   ═══════════════════════════════════════════════════════════════════ */

function BurstCanvas({ active, color }: { active: boolean; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const cx = canvas.offsetWidth / 2;
    const cy = canvas.offsetHeight / 2;

    interface Spark {
      x: number; y: number; vx: number; vy: number;
      r: number; alpha: number; decay: number;
    }
    const sparks: Spark[] = [];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      sparks.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1.5 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.015,
      });
    }

    let animId: number;
    function loop() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      let alive = false;
      for (const s of sparks) {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.08;
        s.alpha -= s.decay;
        if (s.alpha <= 0) continue;
        alive = true;
        ctx.beginPath();
        ctx.fillStyle = color.replace(")", `,${s.alpha})`).replace("rgb", "rgba");
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (alive) animId = requestAnimationFrame(loop);
    }
    loop();

    return () => cancelAnimationFrame(animId);
  }, [active, color]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SVG WHEEL
   ═══════════════════════════════════════════════════════════════════ */

function WheelSVG() {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  function segmentPath(index: number) {
    const startAngle = (index * SEGMENT_ANGLE - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
  }

  function textTransform(index: number) {
    const midAngle = ((index + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
    const textR = r * 0.62;
    const tx = cx + textR * Math.cos(midAngle);
    const ty = cy + textR * Math.sin(midAngle);
    const rotation = (index + 0.5) * SEGMENT_ANGLE;
    return { tx, ty, rotation };
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" aria-hidden="true">
      <defs>
        {/* Metallic gradient for rim */}
        <radialGradient id="rimGrad" cx="50%" cy="50%" r="50%">
          <stop offset="85%" stopColor="#2a2a2a" />
          <stop offset="92%" stopColor="#3a3a3a" />
          <stop offset="96%" stopColor="#555" />
          <stop offset="100%" stopColor="#222" />
        </radialGradient>
        {/* Inner shadow */}
        <filter id="innerShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
        </filter>
        {/* Segment pattern overlays for metal look */}
        <filter id="roughen">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feComposite in="SourceGraphic" in2="noise" operator="in" />
        </filter>
      </defs>

      {/* Outer rim — forged metal ring */}
      <circle cx={cx} cy={cy} r={r + 6} fill="url(#rimGrad)" stroke="#555" strokeWidth="1" />
      {/* Notches on rim for mechanical feel */}
      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
        const angle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
        const ox = cx + (r + 4) * Math.cos(angle);
        const oy = cy + (r + 4) * Math.sin(angle);
        const ix = cx + (r - 2) * Math.cos(angle);
        const iy = cy + (r - 2) * Math.sin(angle);
        return (
          <line key={`notch-${i}`} x1={ix} y1={iy} x2={ox} y2={oy} stroke="#666" strokeWidth="2" />
        );
      })}

      {/* Segments */}
      {REWARDS.map((reward, i) => {
        const { tx, ty, rotation } = textTransform(i);
        const segColors = [
          "rgba(20,20,20,0.95)",
          "rgba(30,28,24,0.95)",
        ];
        return (
          <g key={i}>
            <path
              d={segmentPath(i)}
              fill={segColors[i % 2]}
              stroke="rgba(80,70,50,0.4)"
              strokeWidth="1.5"
              filter="url(#innerShadow)"
            />
            {/* Color accent line at segment edge */}
            <path
              d={segmentPath(i)}
              fill="none"
              stroke={reward.color}
              strokeWidth="0.5"
              opacity="0.3"
            />
            {/* Icon */}
            <text
              x={tx}
              y={ty - 6}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="22"
              transform={`rotate(${rotation}, ${tx}, ${ty})`}
            >
              {reward.icon}
            </text>
            {/* Label */}
            <text
              x={tx}
              y={ty + 14}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="8.5"
              fontWeight="700"
              fill={reward.color}
              fontFamily="'Cinzel', serif"
              letterSpacing="0.5"
              transform={`rotate(${rotation}, ${tx}, ${ty})`}
            >
              {reward.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Center hub — layered metallic */}
      <circle cx={cx} cy={cy} r="38" fill="#1a1a1a" stroke="#555" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="34" fill="url(#rimGrad)" stroke="#d4a843" strokeWidth="1" opacity="0.7" />
      <circle cx={cx} cy={cy} r="28" fill="#141414" stroke="#3a3a3a" strokeWidth="1" />
      {/* Roman numeral X (decorative) */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
        fontWeight="900"
        fill="#d4a843"
        fontFamily="'Cinzel', serif"
        opacity="0.6"
      >
        ✕
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   POINTER — blade/dagger style
   ═══════════════════════════════════════════════════════════════════ */

function Pointer() {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
      <svg width="36" height="52" viewBox="0 0 36 52">
        {/* Blade */}
        <polygon
          points="18,48 8,12 18,0 28,12"
          fill="#c62828"
          stroke="#d4a843"
          strokeWidth="1.5"
        />
        {/* Highlight */}
        <polygon
          points="18,44 13,14 18,4 18,44"
          fill="rgba(255,255,255,0.12)"
        />
        {/* Blood drip detail — subtle */}
        <ellipse cx="18" cy="49" rx="3" ry="2" fill="#8b0000" opacity="0.7" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function SpinWheel() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Reward | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [cooldown, setCooldown] = useState(getRemainingMs());
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [screenShake, setScreenShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [burstActive, setBurstActive] = useState(false);
  const [zoom, setZoom] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);
  const tickAudioRef = useRef<AudioContext | null>(null);
  const lastSegmentRef = useRef(-1);
  const spinAnimRef = useRef<number | null>(null);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown(getRemainingMs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio context for tick sounds
  const playTick = useCallback((frequency = 800, duration = 0.03) => {
    try {
      if (!tickAudioRef.current) {
        tickAudioRef.current = new AudioContext();
      }
      const ctx = tickAudioRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = "square";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available
    }
  }, []);

  const playImpact = useCallback(() => {
    try {
      if (!tickAudioRef.current) {
        tickAudioRef.current = new AudioContext();
      }
      const ctx = tickAudioRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 120;
      osc.type = "sawtooth";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio not available
    }
  }, []);

  const triggerShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
  }, []);

  const triggerFlash = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
  }, []);

  /* ── SPIN LOGIC ─────────────────────────────────────────────── */
  const spin = useCallback(() => {
    if (spinning || !canSpin()) return;

    // Initialise audio context on user gesture
    if (!tickAudioRef.current) {
      tickAudioRef.current = new AudioContext();
    }

    setResult(null);
    setShowResult(false);
    setBurstActive(false);
    setSpinning(true);
    setZoom(true);

    // Haptic: spin start
    if (hapticsEnabled) vibrate([40, 20, 60]);

    // Pick winner
    const winnerIndex = Math.floor(Math.random() * SEGMENT_COUNT);
    // Calculate target rotation:
    // At least 5 full spins + offset so winner lands at the pointer (top = 0°)
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetSegAngle = winnerIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    // Pointer is at top (0°), wheel rotates clockwise. To land segment at top:
    const finalRotation = extraSpins * 360 + (360 - targetSegAngle);
    const startRotation = rotation % 360;
    const totalDelta = finalRotation;

    const DURATION = 6000; // ms
    const startTime = performance.now();
    lastSegmentRef.current = -1;

    function easeOutQuart(t: number) {
      return 1 - Math.pow(1 - t, 4);
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = easeOutQuart(t);
      const currentDelta = totalDelta * eased;
      const currentRotation = startRotation + currentDelta;

      setRotation(currentRotation);

      // Segment ticking
      const normalised = ((currentRotation % 360) + 360) % 360;
      const currentSegment = Math.floor(normalised / SEGMENT_ANGLE) % SEGMENT_COUNT;
      if (currentSegment !== lastSegmentRef.current) {
        lastSegmentRef.current = currentSegment;
        playTick(600 + Math.random() * 400, 0.02 + t * 0.02);
        if (hapticsEnabled) vibrate([10]);
      }

      if (t < 1) {
        spinAnimRef.current = requestAnimationFrame(animate);
      } else {
        // STOP — final impact
        setSpinning(false);
        setZoom(false);
        setLastSpin(Date.now());
        setCooldown(COOLDOWN_MS);

        const winner = REWARDS[winnerIndex];
        setResult(winner);

        playImpact();
        triggerShake();

        if (hapticsEnabled) vibrate([80, 30, 120]);

        // Result feedback
        setTimeout(() => {
          triggerFlash();
          if (winner.tier === "loss") {
            if (hapticsEnabled) vibrate([30, 50, 30]);
          } else {
            setBurstActive(true);
            if (winner.tier === "legendary" || winner.tier === "epic") {
              if (hapticsEnabled) vibrate([50, 30, 50, 30, 100]);
            } else {
              if (hapticsEnabled) vibrate([60]);
            }
          }
          setShowResult(true);
        }, 300);
      }
    }

    spinAnimRef.current = requestAnimationFrame(animate);
  }, [spinning, rotation, hapticsEnabled, playTick, playImpact, triggerShake, triggerFlash]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
    };
  }, []);

  const isOnCooldown = cooldown > 0 && !canSpin();

  /* ── RESULT TEXT ──────────────────────────────────────────────── */
  const resultTitle = result
    ? result.tier === "loss"
      ? "DEFEAT"
      : result.tier === "legendary"
      ? "GLÓRIA SUPREMA!"
      : result.tier === "epic"
      ? "VITÓRIA ÉPICA!"
      : "GANHÁSTE GLÓRIA"
    : "";

  return (
    <div
      className={`relative w-full max-w-lg mx-auto transition-transform duration-300 ${
        screenShake ? "animate-[shake_0.3s_ease-in-out]" : ""
      } ${zoom ? "scale-[1.03]" : "scale-100"}`}
    >
      {/* Ambient embers */}
      <div className="absolute inset-0 -inset-x-20 -inset-y-20 overflow-hidden rounded-full pointer-events-none">
        <EmberCanvas />
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 -inset-x-8 -inset-y-8 rounded-full pointer-events-none bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.6)_100%)]" />

      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-30 rounded-full pointer-events-none"
            style={{
              background: result?.tier === "loss"
                ? "radial-gradient(circle, rgba(139,0,0,0.5), transparent 70%)"
                : "radial-gradient(circle, rgba(212,168,67,0.6), transparent 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Burst particles */}
      {burstActive && result && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <BurstCanvas active={burstActive} color={result.color} />
        </div>
      )}

      {/* Wheel container */}
      <div className="relative aspect-square" ref={wheelRef}>
        {/* Pointer */}
        <Pointer />

        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full transition-shadow duration-500"
          style={{
            boxShadow: spinning
              ? "0 0 40px rgba(212,168,67,0.3), 0 0 80px rgba(139,0,0,0.2)"
              : "0 0 20px rgba(0,0,0,0.5)",
          }}
        />

        {/* Rotating wheel */}
        <div
          className="w-full h-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            willChange: spinning ? "transform" : "auto",
          }}
        >
          <WheelSVG />
        </div>
      </div>

      {/* Spin button */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={spin}
          disabled={spinning || isOnCooldown}
          className={`
            arena-btn-press relative px-10 py-4 rounded-xl font-[family-name:var(--font-display)]
            text-lg font-black uppercase tracking-[0.15em] transition-all duration-300
            border-2 overflow-hidden
            ${
              spinning || isOnCooldown
                ? "border-arena-steel/30 bg-arena-dark text-arena-ash/50 cursor-not-allowed"
                : "border-arena-gold/40 bg-gradient-to-b from-arena-charcoal to-arena-dark text-arena-gold hover:border-arena-gold/70 hover:shadow-[0_0_30px_rgba(212,168,67,0.2)] active:scale-95"
            }
          `}
        >
          {/* Shine sweep */}
          {!spinning && !isOnCooldown && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-arena-gold/10 to-transparent animate-[shimmer_3s_infinite]" />
          )}
          <span className="relative z-10">
            {spinning
              ? "A GIRAR..."
              : isOnCooldown
              ? "ARENA FECHADA"
              : "⚔ SPIN FOR GLORY ⚔"}
          </span>
        </button>

        {/* Countdown */}
        {isOnCooldown && !spinning && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-arena-ash mb-1">
              Próximo combate em
            </p>
            <p className="font-mono text-xl text-arena-gold font-bold tracking-wider">
              {formatCountdown(cooldown)}
            </p>
          </div>
        )}

        {/* Haptics toggle */}
        <button
          onClick={() => setHapticsEnabled(!hapticsEnabled)}
          className="text-xs text-arena-ash hover:text-arena-smoke transition-colors"
        >
          Vibrações: {hapticsEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Result display */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mt-8 relative"
          >
            <div
              className="rounded-2xl p-6 text-center border backdrop-blur-sm"
              style={{
                borderColor: result.tier === "loss" ? "rgba(139,0,0,0.4)" : "rgba(212,168,67,0.3)",
                background: result.tier === "loss"
                  ? "linear-gradient(180deg, rgba(139,0,0,0.15), rgba(20,20,20,0.95))"
                  : "linear-gradient(180deg, rgba(212,168,67,0.1), rgba(20,20,20,0.95))",
                boxShadow: `0 0 40px ${result.glowColor}`,
              }}
            >
              <p
                className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.3em] mb-2"
                style={{ color: result.tier === "loss" ? "#8b0000" : "#cd7f32" }}
              >
                {result.tier === "loss" ? "O gladiador caiu..." : "O coliseu aclama!"}
              </p>
              <p className="text-5xl mb-3">{result.icon}</p>
              <h3
                className="font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-wide"
                style={{ color: result.color }}
              >
                {resultTitle}
              </h3>
              <p
                className="mt-2 text-lg font-bold"
                style={{ color: result.color }}
              >
                {result.label}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
