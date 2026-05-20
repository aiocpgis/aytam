import { useEffect, useState } from "react";
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

export function QuranVersePopup() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show first verse after 3 seconds
    const initialTimer = setTimeout(() => {
      setCurrentIndex(Math.floor(Math.random() * quranicVerses.length));
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(initialTimer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Auto-hide after 8 seconds
    const hideTimer = setTimeout(() => {
      handleClose();
    }, 8000);

    return () => clearTimeout(hideTimer);
  }, [isVisible, currentIndex]);

  // Show a new verse every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % quranicVerses.length;
      setCurrentIndex(nextIndex);
      setIsExiting(false);
      setIsVisible(true);
    }, 25000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  function handleClose() {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, 400);
  }

  if (!isVisible) return null;

  const current = quranicVerses[currentIndex];

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-lg transition-all duration-500 ${
        isExiting
          ? "opacity-0 translate-y-4 scale-95"
          : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      <div className="relative rounded-3xl border border-white/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl p-6 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={handleClose}
          className="absolute top-3 left-3 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-1 grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100 leading-relaxed" style={{ fontFamily: "'Amiri', 'Tajawal', serif" }}>
              {current.verse}
            </p>
            <p className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-400">
              {current.surah}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
