/**
 * PageLoader — mini version of the main LoadingScreen.
 * Used as an inline full-screen placeholder while async checks run
 * (permissions, auth verification, maintenance guard, etc.).
 *
 * Matches the dark cosmic aesthetic of LoadingScreen.tsx.
 */
export function PageLoader({ text = "جاري التحقق..." }: { text?: string }) {
  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-8 select-none"
      style={{
        background: "linear-gradient(135deg, #0a0e1a 0%, #0d1424 40%, #0a1628 100%)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 400,
          height: 400,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Shield icon with pulse ring */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full border border-blue-500/20"
          style={{ width: 80, height: 80, animation: "plRingPulse 2s ease-out infinite" }}
        />
        <div
          className="relative z-10 flex items-center justify-center rounded-2xl"
          style={{
            width: 52,
            height: 52,
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)",
            border: "1px solid rgba(59,130,246,0.3)",
            boxShadow:
              "0 0 24px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L4 6v5c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6L12 2z"
              stroke="url(#plGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="plGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand */}
      <div className="flex flex-col items-center gap-1">
        <span
          className="font-black tracking-widest text-3xl"
          style={{
            background: "linear-gradient(135deg, #f0f9ff 0%, #bae6fd 40%, #818cf8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 14px rgba(59,130,246,0.4))",
          }}
        >
          رِفْق
        </span>
        <span
          className="text-[10px] font-semibold tracking-[0.3em] uppercase"
          style={{ color: "rgba(148,163,184,0.55)" }}
        >
          منصة الكفالة والرعاية
        </span>
      </div>

      {/* Dots + status text */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "#60a5fa",
                boxShadow: "0 0 8px rgba(96,165,250,0.6)",
                animation: `plDot 1.3s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </div>
        <p
          className="text-xs font-semibold"
          style={{ color: "rgba(148,163,184,0.7)" }}
        >
          {text}
        </p>
      </div>

      <style>{`
        @keyframes plRingPulse {
          0%   { transform: scale(1);    opacity: 0.5; }
          70%  { transform: scale(1.5);  opacity: 0;   }
          100% { transform: scale(1.5);  opacity: 0;   }
        }
        @keyframes plDot {
          0%, 100% { opacity: 0.25; transform: scale(0.8);  }
          50%       { opacity: 1;    transform: scale(1.2);  }
        }
      `}</style>
    </div>
  );
}
