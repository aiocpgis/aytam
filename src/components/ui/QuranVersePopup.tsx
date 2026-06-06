import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, BookOpen } from "lucide-react";

const quranicVerses = [
  {
    verse: "﴿ وَيُطْعِمُونَ الطَّعَامَ عَلَىٰ حُبِّهِ مِسْكِينًا وَيَتِيمًا وَأَسِيرًا ﴾",
    surah: "سورة الإنسان — آية ٨",
  },
  {
    verse: "﴿ فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ ﴾",
    surah: "سورة الضحى — آية ٩",
  },
  {
    verse: "﴿ وَآتَى الْمَالَ عَلَىٰ حُبِّهِ ذَوِي الْقُرْبَىٰ وَالْيَتَامَىٰ وَالْمَسَاكِينَ ﴾",
    surah: "سورة البقرة — آية ١٧٧",
  },
  {
    verse: "﴿ وَمَا أَنفَقْتُم مِّن شَيْءٍ فَهُوَ يُخْلِفُهُ ۖ وَهُوَ خَيْرُ الرَّازِقِينَ ﴾",
    surah: "سورة سبأ — آية ٣٩",
  },
  {
    verse: "﴿ مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ أَضْعَافًا كَثِيرَةً ﴾",
    surah: "سورة البقرة — آية ٢٤٥",
  },
  {
    verse: "﴿ وَيَسْأَلُونَكَ عَنِ الْيَتَامَىٰ ۖ قُلْ إِصْلَاحٌ لَّهُمْ خَيْرٌ ﴾",
    surah: "سورة البقرة — آية ٢٢٠",
  },
  {
    verse: "﴿ إِنَّ الْمُصَّدِّقِينَ وَالْمُصَّدِّقَاتِ وَأَقْرَضُوا اللَّهَ قَرْضًا حَسَنًا يُضَاعَفُ لَهُمْ ﴾",
    surah: "سورة الحديد — آية ١٨",
  },
  {
    verse: "﴿ لَن تَنَالُوا الْبِرَّ حَتَّىٰ تُنفِقُوا مِمَّا تُحِبُّونَ ﴾",
    surah: "سورة آل عمران — آية ٩٢",
  },
];

type QuranVersePopupProps = {
  placement?: "auto" | "floating" | "inline";
};

export function QuranVersePopup({ placement = "auto" }: QuranVersePopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [inlineTarget, setInlineTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * quranicVerses.length));

    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(initialTimer);
  }, []);

  useEffect(() => {
    if (!isVisible || inlineTarget) return;

    const hideTimer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(hideTimer);
  }, [isVisible, currentIndex, inlineTarget]);

  useEffect(() => {
    const intervalDuration = inlineTarget ? 12000 : 25000;

    const interval = setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % quranicVerses.length);
      setIsExiting(false);

      if (!inlineTarget) {
        setIsVisible(true);
      }
    }, intervalDuration);

    return () => clearInterval(interval);
  }, [inlineTarget]);

  useEffect(() => {
    if (placement === "floating") {
      setInlineTarget(null);
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    let createdSlot: HTMLElement | null = null;

    function removeCreatedSlot() {
      if (createdSlot?.parentElement) {
        createdSlot.parentElement.removeChild(createdSlot);
      }
      createdSlot = null;
    }

    function syncInlineTarget() {
      const shouldUseInlineSlot = placement === "inline" || mediaQuery.matches;

      if (!shouldUseInlineSlot) {
        setInlineTarget(null);
        removeCreatedSlot();
        return;
      }

      const formSection = document.querySelector("section.max-w-5xl");
      const introBlock = formSection?.firstElementChild;

      if (!formSection || !introBlock) {
        setInlineTarget(null);
        return;
      }

      const existingSlot = document.getElementById("quran-verse-inline-slot") as HTMLElement | null;
      const slot = existingSlot ?? document.createElement("div");

      if (!existingSlot) {
        slot.id = "quran-verse-inline-slot";
        slot.className = "mx-auto mb-6 min-h-[108px] w-full max-w-3xl md:mb-0 md:min-h-0";
        introBlock.insertAdjacentElement("afterend", slot);
        createdSlot = slot;
      }

      setInlineTarget(slot);
    }

    syncInlineTarget();
    mediaQuery.addEventListener("change", syncInlineTarget);

    return () => {
      mediaQuery.removeEventListener("change", syncInlineTarget);
      setInlineTarget(null);
      removeCreatedSlot();
    };
  }, [placement]);

  function handleClose() {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, 400);
  }

  const isInline = placement === "inline" || Boolean(inlineTarget);
  const shouldRender = isInline || isVisible;

  if (!shouldRender) return null;

  const current = quranicVerses[currentIndex];
  const animationClasses = isInline
    ? "opacity-100 translate-y-0 scale-100"
    : isExiting || !isVisible
      ? "opacity-0 translate-y-3 scale-95"
      : "opacity-100 translate-y-0 scale-100";
  const positionClasses = isInline
    ? "relative z-10 mx-auto w-full max-w-3xl"
    : "fixed bottom-6 left-1/2 z-50 w-[90vw] max-w-lg -translate-x-1/2";

  const popup = (
    <div className={`${positionClasses} ${animationClasses} transition-all duration-500`}>
      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 p-4 shadow-xl backdrop-blur-2xl dark:bg-slate-900/70 md:p-6 md:shadow-2xl">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-emerald-200/20 blur-3xl" />

        {!isInline && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute left-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            aria-label="إغلاق الآية"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className={`${isInline ? "pl-0" : "pl-8"} flex items-start gap-3`}>
          <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-400 md:h-10 md:w-10">
            <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[0.95rem] font-black leading-loose text-slate-800 dark:text-slate-100 md:text-lg" style={{ fontFamily: "'Amiri', 'Tajawal', serif" }}>
              {current.verse}
            </p>
            <p className="mt-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 md:mt-2">
              {current.surah}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (inlineTarget) return createPortal(popup, inlineTarget);

  return popup;
}
