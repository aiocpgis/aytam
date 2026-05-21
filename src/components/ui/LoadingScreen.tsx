import { useEffect, useState, useRef } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timersRef = useRef<number[]>([]);
  const isCompletedRef = useRef(false);
  const [useSimulation, setUseSimulation] = useState(false);

  // Unified complete handler to ensure it only runs once and handles cleanup
  const completeLoader = () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setIsFading(true);
    
    const finishTimer = window.setTimeout(() => {
      onComplete();
    }, 700);
    timersRef.current.push(finishTimer);
  };

  useEffect(() => {
    const video = videoRef.current;
    
    // Safety fallback: if anything fails, or video gets stuck, fade out after 12 seconds
    const fallbackTimer = window.setTimeout(() => {
      if (!isCompletedRef.current) {
        console.warn("Safety fallback triggered after 12 seconds. Video might have failed or got stuck.");
        completeLoader();
      }
    }, 12000);
    timersRef.current.push(fallbackTimer);

    // Try playing the video programmatically (safeguard for autoplay)
    if (video) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Cinematic intro video playing successfully.");
          })
          .catch((error) => {
            console.warn("Autoplay was prevented by browser policy. Falling back to smooth simulated progress.", error);
            setUseSimulation(true);
          });
      }
    }

    // If the video hasn't started playing within 1.5 seconds, enable simulation fallback
    const checkPlaybackTimer = window.setTimeout(() => {
      if (video && video.paused && !isCompletedRef.current) {
        console.warn("Video is paused or buffering. Falling back to smooth simulated progress.");
        setUseSimulation(true);
      }
    }, 1500);
    timersRef.current.push(checkPlaybackTimer);

    return () => {
      timersRef.current.forEach(timer => window.clearTimeout(timer));
    };
  }, []);

  // Smooth simulated progress fallback if video is blocked/fails to load
  useEffect(() => {
    if (!useSimulation) return;

    let start: number | null = null;
    const duration = 3500; // 3.5 seconds smooth simulation
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

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [useSimulation]);

  // Handle video progress updates dynamically based on actual duration and currentTime
  const handleTimeUpdate = () => {
    if (useSimulation) return;
    const video = videoRef.current;
    if (video && video.duration) {
      const currentProgress = Math.min(
        Math.round((video.currentTime / video.duration) * 100),
        100
      );
      setProgress(currentProgress);
    }
  };

  // Handle video completion
  const handleVideoEnded = () => {
    if (useSimulation) return;
    setProgress(100);
    completeLoader();
  };

  const videoSrc = import.meta.env.BASE_URL + "1.mp4";

  return (
    <div 
      className={`fixed inset-0 z-[100] grid place-items-center bg-slate-950 px-4 transition-all duration-700 ease-in-out transform ${
        isFading ? "opacity-0 scale-[1.03] pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Immersive cinematic background video - cover base */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          playsInline
          loop={false} // Disabled looping to detect the video's natural end
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          className="w-full h-full object-cover"
        />
        {/* Soft luxury dark overlay to make elements pop and reduce distraction */}
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px]" />
        
        {/* Deep radial vignette shadow for cinematic depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.1)_0%,rgba(2,6,23,0.85)_100%)]" />
      </div>

      {/* Floating ultra-minimalist brand logo and indicator */}
      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center justify-center">
        {/* Sleek Glass Card for subtle container of the text */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/35 backdrop-blur-xl p-8 md:p-10 shadow-[0_0_60px_rgba(2,6,23,0.6)] max-w-sm w-full">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-wider mb-2 drop-shadow-lg">
            منصة رِفْق
          </h1>
          <p className="text-xs md:text-sm font-bold text-slate-300/80 mb-8 drop-shadow-md">
            بوابة دخول المشرفين والمدراء
          </p>

          {/* Minimalist Progress percentage indicator */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-4xl md:text-5xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse">
              {progress}%
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mt-3 animate-pulse">
              جاري تأمين الاتصال والتحميل
            </span>
          </div>
        </div>
      </div>

      {/* Ultra-thin glowing progress line spanning the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 w-full bg-slate-950/80 overflow-hidden z-20 border-t border-white/5">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-75 ease-out rounded-r-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
