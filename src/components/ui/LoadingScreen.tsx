import { useEffect, useState, useRef } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

const steps = [
  { pct: 8,  text: "تهيئة البيئة الآمنة..." },
  { pct: 22, text: "تأمين الاتصال بقاعدة البيانات..." },
  { pct: 41, text: "تحميل سجلات الأيتام والكفلاء..." },
  { pct: 60, text: "مزامنة الصلاحيات والأدوار..." },
  { pct: 78, text: "التحقق من معايير الأمان..." },
  { pct: 91, text: "الإعداد النهائي للمنصة..." },
  { pct: 100, text: "مرحباً بك في منصة رِفْق 🤍" },
];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [entered, setEntered] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setProgress(100);
    setStepIndex(steps.length - 1);
    setTimeout(() => {
      setIsFading(true);
      setTimeout(onComplete, 800);
    }, 600);
  };

  /* ── Drive progress via requestAnimationFrame ── */
  useEffect(() => {
    const DURATION = 3200; // ms
    let startTs: number | null = null;
    let raf: number;

    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const raw = Math.min(elapsed / DURATION, 1);
      // ease-in-out cubic
      const eased = raw < 0.5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2;
      const pct = Math.round(eased * 100);
      setProgress(pct);

      // Advance step index
      for (let i = steps.length - 1; i >= 0; i--) {
        if (pct >= steps[i].pct) {
          setStepIndex(i);
          break;
        }
      }

      if (elapsed < DURATION) {
        raf = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    // Entrance delay
    const t1 = setTimeout(() => setEntered(true), 80);
    const t2 = setTimeout(() => { raf = requestAnimationFrame(tick); }, 500);
    // Safety net
    const t3 = setTimeout(finish, 8000);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      cancelAnimationFrame(raf);
    };
  }, []);

  const currentText = steps[stepIndex]?.text ?? steps[0].text;

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden select-none"
      style={{
        background: "linear-gradient(135deg, #0a0e1a 0%, #0d1424 40%, #0a1628 100%)",
        opacity: isFading ? 0 : 1,
        transition: "opacity 0.8s ease-in-out",
        pointerEvents: isFading ? "none" : "all",
      }}
    >
      {/* ── Ambient orbs ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600, height: 600,
          top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "orbBreath 5s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400, height: 400,
          bottom: "10%", right: "15%",
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "orbBreath 7s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* ── Star field ── */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white pointer-events-none"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.4 + 0.1,
            animation: `starTwinkle ${2 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite alternate`,
          }}
        />
      ))}

      {/* ── Grid lines ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 0%, transparent 100%)",
        }}
      />

      {/* ── Main content — centered ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-0"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        {/* Logo container */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer pulse ring */}
          <div
            className="absolute rounded-full border border-blue-500/20"
            style={{
              width: 110, height: 110,
              animation: "ringPulse 2.5s ease-out infinite",
            }}
          />
          {/* Inner glow ring */}
          <div
            className="absolute rounded-full border border-blue-400/30"
            style={{
              width: 88, height: 88,
              animation: "ringPulse 2.5s ease-out 0.4s infinite",
            }}
          />

          {/* Icon circle */}
          <div
            className="relative z-10 flex items-center justify-center rounded-2xl"
            style={{
              width: 68, height: 68,
              background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)",
              border: "1px solid rgba(59,130,246,0.3)",
              boxShadow: "0 0 30px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Animated shield SVG */}
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L4 6v5c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6L12 2z"
                stroke="url(#shieldGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: "shieldDraw 1.5s ease-out forwards", strokeDasharray: 60, strokeDashoffset: 60 }}
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#60a5fa"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: "shieldDraw 0.8s ease-out 1.2s forwards", strokeDasharray: 20, strokeDashoffset: 20, opacity: 0.9 }}
              />
              <defs>
                <linearGradient id="shieldGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <h1
          className="font-black tracking-widest"
          style={{
            fontSize: "clamp(3rem, 8vw, 4.5rem)",
            background: "linear-gradient(135deg, #f0f9ff 0%, #bae6fd 40%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
            filter: "drop-shadow(0 0 20px rgba(59,130,246,0.4))",
            animation: "nameSweep 4s ease-in-out infinite",
          }}
        >
          رِفْق
        </h1>

        {/* Tagline */}
        <p
          className="mt-2 text-xs font-semibold tracking-[0.35em] uppercase"
          style={{ color: "rgba(148,163,184,0.7)", letterSpacing: "0.35em" }}
        >
          منصة الكفالة والرعاية
        </p>

        {/* Divider */}
        <div
          className="my-8 rounded-full"
          style={{
            width: 48, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)",
          }}
        />

        {/* Progress section */}
        <div
          className="flex flex-col items-center gap-4"
          style={{ width: "min(340px, 85vw)" }}
        >
          {/* Status text */}
          <p
            key={currentText}
            className="text-center text-[13px] font-semibold"
            style={{
              color: "rgba(148,163,184,0.85)",
              animation: "statusFade 0.5s ease-out",
              minHeight: 20,
            }}
          >
            {currentText}
          </p>

          {/* Progress bar */}
          <div
            className="relative w-full overflow-hidden rounded-full"
            style={{
              height: 4,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {/* Fill */}
            <div
              className="absolute top-0 right-0 h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)",
                boxShadow: "0 0 8px rgba(99,102,241,0.6)",
                transition: "width 0.15s ease-out",
              }}
            />
            {/* Shimmer sweep */}
            <div
              className="absolute top-0 h-full rounded-full"
              style={{
                width: 40,
                right: `calc(${100 - progress}% - 20px)`,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                transition: "right 0.15s ease-out",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Percentage */}
          <span
            className="font-black tabular-nums"
            style={{
              fontSize: 13,
              color: "#60a5fa",
              fontVariantNumeric: "tabular-nums",
              filter: "drop-shadow(0 0 6px rgba(96,165,250,0.5))",
            }}
          >
            {progress}٪
          </span>
        </div>
      </div>

      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes orbBreath {
          from { opacity: 0.6; transform: translate(-50%, -60%) scale(0.95); }
          to   { opacity: 1;   transform: translate(-50%, -60%) scale(1.05); }
        }
        @keyframes starTwinkle {
          from { opacity: 0.08; }
          to   { opacity: 0.45; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(1);    opacity: 0.5; }
          70%  { transform: scale(1.35); opacity: 0;   }
          100% { transform: scale(1.35); opacity: 0;   }
        }
        @keyframes shieldDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes nameSweep {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(59,130,246,0.35)); }
          50%       { filter: drop-shadow(0 0 32px rgba(99,102,241,0.55)); }
        }
        @keyframes statusFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
