/**
 * Baby Button Masher (BBM)
 * Developed/Authored by tsohlacol (https://github.com/tsohlacol/toddler-screen-defender)
 * Certified Open Source Software licensed under the BBM-RCL Reciprocal License.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { speakToddlerText, playSpaceChime, startPlanetsTheme, stopPlanetsTheme } from "../utils/audio";

interface SpaceExplorerProps {
  lastEvent: { key: string; timestamp: number } | null;
  voiceName: string;
  speechRate: number;
  speechPitch: number;
  speechEnabled: boolean;
  soundEnabled: boolean;
}

// --- Solar system data ---
interface PlanetConfig {
  name: string;
  color: string;
  glow: string;
  gradient?: string;
  size: number;   // radius in px
  orbit: number;  // orbital radius in px
  period: number; // seconds for one full orbit
  startDeg: number;
  hasRings?: boolean;
  hasMoon?: boolean;
}

const PLANETS: PlanetConfig[] = [
  { name: "Mercury", color: "#94a3b8", glow: "#64748b",
    size: 7,  orbit: 52,  period: 8,   startDeg: 20 },
  { name: "Venus",   color: "#fbbf24", glow: "#f59e0b",
    gradient: "radial-gradient(circle at 38% 32%, #fef9c3, #fbbf24 55%, #d97706)",
    size: 11, orbit: 78,  period: 14,  startDeg: 80 },
  { name: "Earth",   color: "#60a5fa", glow: "#3b82f6",
    gradient: "radial-gradient(circle at 38% 32%, #bfdbfe, #3b82f6 50%, #1d4ed8)",
    size: 13, orbit: 108, period: 22,  startDeg: 155, hasMoon: true },
  { name: "Mars",    color: "#f87171", glow: "#dc2626",
    gradient: "radial-gradient(circle at 38% 32%, #fca5a5, #ef4444 55%, #991b1b)",
    size: 9,  orbit: 138, period: 33,  startDeg: 210 },
  { name: "Jupiter", color: "#fb923c", glow: "#ea580c",
    gradient: "radial-gradient(circle at 38% 32%, #fed7aa, #f97316 35%, #c2410c 65%, #ea580c)",
    size: 24, orbit: 177, period: 55,  startDeg: 280 },
  { name: "Saturn",  color: "#d97706", glow: "#b45309",
    gradient: "radial-gradient(circle at 38% 32%, #fef9c3, #eab308 50%, #b45309)",
    size: 20, orbit: 216, period: 80,  startDeg: 330, hasRings: true },
  { name: "Uranus",  color: "#67e8f9", glow: "#22d3ee",
    size: 15, orbit: 250, period: 115, startDeg: 45 },
  { name: "Neptune", color: "#818cf8", glow: "#6366f1",
    size: 14, orbit: 280, period: 160, startDeg: 120 },
];

// --- Constellation data ---
// Stars: pixel offsets from the constellation's screen-percent origin.
// Lines: index pairs into the stars array.
interface ConstellationConfig {
  name: string;
  label: string;
  ox: number; oy: number; // top-left origin in vw/vh
  width: number; height: number; // SVG bounding box in px
  stars: Array<{ x: number; y: number; r: number }>;
  lines: Array<[number, number]>;
  labelAnchorX: number; // x for the text label in px
}

const CONSTELLATIONS: ConstellationConfig[] = [
  {
    name: "Orion",
    label: "Orion the Hunter",
    ox: 59, oy: 10,
    width: 80, height: 158,
    stars: [
      { x: 10, y: 40,  r: 4.5 }, // 0 Betelgeuse (shoulder L)
      { x: 62, y: 28,  r: 3.5 }, // 1 Bellatrix  (shoulder R)
      { x: 22, y: 88,  r: 2.5 }, // 2 Alnitak    (belt L)
      { x: 35, y: 85,  r: 2.5 }, // 3 Alnilam    (belt C)
      { x: 48, y: 82,  r: 2.5 }, // 4 Mintaka    (belt R)
      { x: 18, y: 138, r: 3 },   // 5 Saiph      (foot L)
      { x: 65, y: 126, r: 4 },   // 6 Rigel      (foot R)
    ],
    lines: [[0,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6]],
    labelAnchorX: 40,
  },
  {
    name: "Big Dipper",
    label: "Big Dipper",
    ox: 72, oy: 6,
    width: 128, height: 88,
    stars: [
      { x: 110, y: 8,  r: 2.5 }, // 0 end of handle
      { x: 88,  y: 18, r: 2.5 }, // 1
      { x: 65,  y: 22, r: 2.5 }, // 2 bend
      { x: 44,  y: 38, r: 2.5 }, // 3 bowl top-right
      { x: 8,   y: 50, r: 2.5 }, // 4 bowl top-left
      { x: 14,  y: 70, r: 2.5 }, // 5 bowl bottom-left
      { x: 50,  y: 60, r: 2.5 }, // 6 bowl bottom-right
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]],
    labelAnchorX: 64,
  },
  {
    name: "Cassiopeia",
    label: "Cassiopeia",
    ox: 54, oy: 6,
    width: 100, height: 38,
    stars: [
      { x: 0,  y: 30, r: 2.5 }, // 0
      { x: 24, y: 6,  r: 3 },   // 1
      { x: 50, y: 22, r: 3.5 }, // 2 center (brightest)
      { x: 76, y: 4,  r: 2.5 }, // 3
      { x: 98, y: 20, r: 2.5 }, // 4
    ],
    lines: [[0,1],[1,2],[2,3],[3,4]],
    labelAnchorX: 50,
  },
  {
    name: "Leo",
    label: "Leo the Lion",
    ox: 61, oy: 42,
    width: 90, height: 82,
    stars: [
      { x: 0,  y: 58, r: 4 },   // 0 Regulus (bottom of sickle)
      { x: 4,  y: 42, r: 2.5 }, // 1
      { x: 14, y: 26, r: 2.5 }, // 2
      { x: 30, y: 10, r: 2.5 }, // 3 top of sickle
      { x: 46, y: 22, r: 2.5 }, // 4
      { x: 58, y: 40, r: 2.5 }, // 5
      { x: 82, y: 70, r: 3 },   // 6 Denebola (tail)
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[5,6]],
    labelAnchorX: 45,
  },
  {
    name: "Scorpius",
    label: "Scorpius",
    ox: 80, oy: 50,
    width: 52, height: 120,
    stars: [
      { x: 22, y: 0,   r: 4.5 }, // 0 Antares (head, bright red)
      { x: 8,  y: 16,  r: 2.5 }, // 1 left shoulder
      { x: 34, y: 22,  r: 2.5 }, // 2 right shoulder
      { x: 26, y: 42,  r: 2.5 }, // 3
      { x: 22, y: 60,  r: 2.5 }, // 4
      { x: 14, y: 76,  r: 2.5 }, // 5
      { x: 20, y: 92,  r: 2.5 }, // 6 tail curve
      { x: 34, y: 104, r: 2.5 }, // 7 upper sting
      { x: 24, y: 116, r: 2.5 }, // 8 lower sting
    ],
    lines: [[0,1],[0,2],[1,3],[2,3],[3,4],[4,5],[5,6],[6,7],[6,8]],
    labelAnchorX: 26,
  },
];

// --- Shooting star state ---
interface ShootingStar {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number;
  length: number;
}

// --- Component ---
export default function SpaceExplorerView({
  lastEvent, voiceName, speechRate, speechPitch, speechEnabled, soundEnabled,
}: SpaceExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Array<{ x: number; y: number; r: number; phase: number; speed: number }>>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const rafRef = useRef<number>(0);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // --- Starfield init ---
  useEffect(() => {
    starsRef.current = Array.from({ length: 250 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.2 + 0.3,
    }));
  }, []);

  // --- Canvas render loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (time: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Twinkling background stars
      starsRef.current.forEach((s) => {
        const brightness = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.001 * s.speed + s.phase));
        ctx.globalAlpha = brightness;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((s) => s.alpha > 0.02);
      shootingStarsRef.current.forEach((s) => {
        ctx.globalAlpha = s.alpha;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * s.length, s.y - s.vy * s.length);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * s.length, s.y - s.vy * s.length);
        ctx.stroke();
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.018;
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // --- Shooting star + chime on keypress ---
  useEffect(() => {
    if (!lastEvent) return;
    const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.45; // diagonal range
    const speed = 9 + Math.random() * 6;
    shootingStarsRef.current.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      length: 22 + Math.random() * 28,
    });
    if (soundEnabled) playSpaceChime(lastEvent.key);
  }, [lastEvent, soundEnabled]);

  // --- "The Planets" background theme ---
  useEffect(() => {
    if (soundEnabled) startPlanetsTheme();
    return () => stopPlanetsTheme();
  }, [soundEnabled]);

  // --- Inject orbit keyframe CSS ---
  useEffect(() => {
    const rules = PLANETS.map((p, i) =>
      `@keyframes tsd-orbit-${i}{from{transform:rotate(${p.startDeg}deg)}to{transform:rotate(${p.startDeg + 360}deg)}}`
    ).join("");
    const style = document.createElement("style");
    style.id = "tsd-space-orbit-css";
    style.textContent = rules;
    document.head.appendChild(style);
    return () => { document.getElementById("tsd-space-orbit-css")?.remove(); };
  }, []);

  // --- Hover handler ---
  const speak = useCallback((label: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoveredName(label);
    if (speechEnabled) speakToddlerText(label, { name: voiceName, rate: speechRate, pitch: speechPitch });
  }, [speechEnabled, voiceName, speechRate, speechPitch]);

  const clearHover = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setHoveredName(null), 600);
  }, []);

  return (
    <div className="absolute inset-0 bg-[#020816] select-none overflow-hidden">

      {/* Twinkling starfield */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Mode banner */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20">
        <span className="px-6 py-2 rounded-full text-xs font-mono font-bold tracking-widest text-cyan-300 bg-white/10 backdrop-blur-xl border border-white/20 uppercase shadow-lg">
          🌌 Space Explorer Mode 🌌
        </span>
        <p className="text-white/50 text-sm mt-3 font-semibold drop-shadow">
          Hover over planets, stars, and constellations to hear their names!
        </p>
      </div>

      {/* Hovered name badge */}
      <div
        className={`absolute top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-300 ${hoveredName ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <span className="px-5 py-2 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 text-white text-lg font-bold shadow-2xl whitespace-nowrap">
          {hoveredName ?? ""}
        </span>
      </div>

      {/* ═══════════════════════ SOLAR SYSTEM ═══════════════════════ */}
      {/* Centered at 28vw / 52vh so it sits in the left screen half  */}
      <div
        className="absolute z-10"
        style={{ left: "28vw", top: "52vh", transform: "translate(-50%, -50%)" }}
      >
        {/* Orbit rings */}
        {PLANETS.map((p, i) => (
          <div
            key={`ring-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.orbit * 2, height: p.orbit * 2,
              border: "1px solid rgba(148,163,184,0.10)",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* Sun */}
        <div
          className="absolute cursor-pointer"
          style={{
            width: 54, height: 54,
            borderRadius: "50%",
            background: "radial-gradient(circle at 38% 32%, #fffde7, #fbbf24 42%, #f97316 72%, #dc2626)",
            boxShadow: "0 0 38px #fbbf24, 0 0 72px rgba(251,191,36,0.45), 0 0 110px rgba(249,115,22,0.25)",
            transform: "translate(-50%, -50%)",
          }}
          onMouseEnter={() => speak("The Sun")}
          onMouseLeave={clearHover}
        />

        {/* Orbiting planets */}
        {PLANETS.map((p, i) => (
          <div
            key={`orbit-${i}`}
            className="absolute"
            style={{
              width: 0, height: 0,
              // orbit pivot sits exactly at the sun center
              animation: `tsd-orbit-${i} ${p.period}s linear infinite`,
            }}
          >
            {/* Planet body */}
            <div
              className="absolute cursor-pointer"
              style={{
                width: p.size * 2, height: p.size * 2,
                // center on the orbital track
                left: p.orbit - p.size,
                top: -p.size,
                borderRadius: "50%",
                background: p.gradient ?? p.color,
                boxShadow: `0 0 ${p.size + 3}px ${p.glow}, 0 0 ${p.size * 2 + 4}px ${p.glow}55`,
              }}
              onMouseEnter={() => speak(p.name)}
              onMouseLeave={clearHover}
            >
              {/* Saturn's rings — a rotateX-tilted ellipse kept in place by the parent */}
              {p.hasRings && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: p.size * 5.2, height: p.size * 2.2,
                    border: "3px solid rgba(234,179,8,0.55)",
                    borderRadius: "50%",
                    left: "50%", top: "50%",
                    transform: "translate(-50%, -50%) rotateX(72deg)",
                  }}
                />
              )}
              {/* Earth's moon */}
              {p.hasMoon && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: 6, height: 6,
                    background: "radial-gradient(circle at 35% 30%, #e5e7eb, #9ca3af)",
                    borderRadius: "50%",
                    right: -14, top: -3,
                    boxShadow: "0 0 4px rgba(156,163,175,0.7)",
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════ CONSTELLATIONS ═══════════════════════ */}
      {/* Each constellation: hoverable wrapper div + SVG visuals inside */}
      {CONSTELLATIONS.map((c) => (
        <div
          key={c.name}
          className="absolute cursor-pointer z-10"
          style={{ left: `${c.ox}vw`, top: `${c.oy}vh` }}
          onMouseEnter={() => speak(c.label)}
          onMouseLeave={clearHover}
        >
          <svg
            width={c.width + 4}
            height={c.height + 28}
            className="overflow-visible"
            style={{ pointerEvents: "none" }}
          >
            <defs>
              <filter id={`tsd-star-glow-${c.name}`}>
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Constellation lines */}
            {c.lines.map(([a, b], li) => (
              <line
                key={li}
                x1={c.stars[a].x} y1={c.stars[a].y}
                x2={c.stars[b].x} y2={c.stars[b].y}
                stroke="rgba(148,163,184,0.35)"
                strokeWidth="1"
              />
            ))}

            {/* Star dots */}
            {c.stars.map((s, si) => (
              <circle
                key={si}
                cx={s.x} cy={s.y}
                r={s.r}
                fill="white"
                opacity={0.85}
                filter={`url(#tsd-star-glow-${c.name})`}
              />
            ))}

            {/* Constellation name label */}
            <text
              x={c.labelAnchorX}
              y={c.height + 20}
              textAnchor="middle"
              fill="rgba(148,163,184,0.55)"
              fontSize="9"
              fontFamily="monospace"
              letterSpacing="2"
            >
              {c.name.toUpperCase()}
            </text>
          </svg>
        </div>
      ))}
    </div>
  );
}
