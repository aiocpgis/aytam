import { useEffect, useState, useRef } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timersRef = useRef<number[]>([]);
  const isCompletedRef = useRef(false);
  const [useSimulation, setUseSimulation] = useState(false);

  // Unified complete handler — runs only once
  const completeLoader = () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setIsFading(true);
    const finishTimer = window.setTimeout(() => {
      onComplete();
    }, 900);
    timersRef.current.push(finishTimer);
  };

  useEffect(() => {
    const video = videoRef.current;

    // Show logo with a slight delay for a cinematic feel
    const logoTimer = window.setTimeout(() => setLogoVisible(true), 400);
    timersRef.current.push(logoTimer);

    // Safety fallback: complete after 12s if video stalls
    const fallbackTimer = window.setTimeout(() => {
      if (!isCompletedRef.current) {
        completeLoader();
      }
    }, 12000);
    timersRef.current.push(fallbackTimer);

    // Try playing the video programmatically
    if (video) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setUseSimulation(true);
        });
      }
    }

    // If video hasn't started within 1.5s, use simulated progress
    const checkPlaybackTimer = window.setTimeout(() => {
      if (video && video.paused && !isCompletedRef.current) {
        setUseSimulation(true);
      }
    }, 1500);
    timersRef.current.push(checkPlaybackTimer);

    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Simulated progress fallback (3.5s smooth animation)
  useEffect(() => {
    if (!useSimulation) return;

    let start: number | null = null;
    const duration = 3500;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progressPercent = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(progressPercent);
      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        completeLoader();
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [useSimulation]);

  // Sync progress with actual video playback
  const handleTimeUpdate = () => {
    if (useSimulation) return;
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress(Math.min(Math.round((video.currentTime / video.duration) * 100), 100));
    }
  };

  const handleVideoEnded = () => {
    if (useSimulation) return;
    setProgress(100);
    completeLoader();
  };

  const videoSrc = import.meta.env.BASE_URL + "1.mp4";

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-black transition-opacity duration-900 ease-in-out ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* ── Full-screen video ── */}
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        loop={false}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* ── Subtle vignette only at edges — keeps video visible ── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

      {/* ── Bottom gradient for progress bar readability ── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

      {/* ── Top gradient for logo readability ── */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />

      {/* ── Centered brand identity — fades in after 400ms ── */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ease-out ${
          logoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
      >
        {/* Decorative glow orb behind text */}
        <div className="absolute w-64 h-64 rounded-full bg-blue-500/10 blur-[80px]" />

        {/* Platform name */}
        <h1
          className="relative text-4xl md:text-6xl font-black text-white tracking-widest drop-shadow-2xl"
          style={{ textShadow: "0 0 40px rgba(147,197,253,0.4), 0 2px 8px rgba(0,0,0,0.8)" }}
        >
          رِفْق
        </h1>

        {/* Subtle tagline */}
        <p
          className="relative mt-3 text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-blue-200/70"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
        >
          منصة الكفالة والرعاية
        </p>

        {/* Three animated dots */}
        <div className="relative flex gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-300/70"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Glowing progress bar at the very bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 z-20">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-400 transition-all duration-150 ease-out"
          style={{
            width: `${progress}%`,
            boxShadow: "0 0 12px rgba(99,179,237,0.9), 0 0 24px rgba(99,179,237,0.4)",
          }}
        />
        {/* Glowing leading edge */}
        <div
          className="absolute top-0 h-full w-8 bg-white/60 blur-sm transition-all duration-150 ease-out"
          style={{ left: `calc(${progress}% - 16px)`, opacity: progress > 2 && progress < 99 ? 1 : 0 }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
