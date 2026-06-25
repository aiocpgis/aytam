import { Baby, Calendar, FileText, Heart, MapPin, User, X, Shield, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import type { OrphanRecord } from "../../types/orphan.types";
import { usePermissions } from "../../hooks/usePermissions";
import { getOrphanPhotoSignedUrl } from "../../features/orphans/orphanPhoto.service";

interface OrphanProfileModalProps {
  orphan: OrphanRecord;
  onClose: () => void;
}

function maskSensitiveText(
  value: string | null | undefined,
  isSensitiveVisible: boolean,
  type: "phone" | "account" | "text" = "text",
  placeholder: string = "غير مصرح"
) {
  if (!value) return "-";
  if (isSensitiveVisible) return value;
  
  const clean = value.replace(/[-\s]/g, "");
  if (type === "phone") {
    if (clean.length > 6) {
      return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
    }
    return "****";
  }
  if (type === "account") {
    if (clean.length > 4) {
      return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
    }
    return "****";
  }
  return placeholder;
}

function formatDate(dateValue: unknown) {
  if (!dateValue) return "غير محدد";
  const date = new Date(String(dateValue));
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
}

export function OrphanProfileModal({ orphan, onClose }: OrphanProfileModalProps) {
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission("orphans.view_sensitive");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (orphan.photo_path) {
      getOrphanPhotoSignedUrl(orphan.photo_path).then((url) => {
        if (url) setPhotoUrl(url);
      });
    }
  }, [orphan.photo_path]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-6 py-4 rounded-t-3xl">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Baby className="h-6 w-6 text-indigo-500" />
            الملف الشخصي لليتيم
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Header Profile Info */}
          <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-700/50 p-6 rounded-3xl border border-white/60 dark:border-slate-700/60 shadow-sm">
            <div className="w-24 h-24 shrink-0 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-md">
              {photoUrl ? (
                <img src={photoUrl} alt={orphan.childFullName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-indigo-400" />
              )}
            </div>
            <div className="text-center md:text-right flex-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{orphan.childFullName}</h3>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center md:justify-start gap-1">
                <MapPin className="h-4 w-4" /> {orphan.governorateCity || "غير محدد"}
              </p>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-center md:justify-start gap-1">
                <Shield className="h-3.5 w-3.5" /> {orphan.orphanType}
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-center">
              <span className={`px-4 py-2 rounded-2xl text-xs font-black shadow-sm ${
                orphan.sponsorshipStatus === "مكفول"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : orphan.sponsorshipStatus === "متوقف"
                  ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 animate-pulse"
              }`}>
                {orphan.sponsorshipStatus === "مكفول" ? "محظوظ بكفالة ❤️" : orphan.sponsorshipStatus === "متوقف" ? "كفالة متوقفة" : "ينتظر كافلاً 🤲"}
              </span>
            </div>
          </div>

          {/* Timeline & Details */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Timeline */}
            <div className="space-y-6">
              <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                المخطط الزمني
              </h4>
              <div className="relative pl-4 pr-6 space-y-6 border-r-2 border-indigo-100 dark:border-slate-700">
                {/* Registration event */}
                <div className="relative">
                  <div className="absolute -right-[29px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-slate-800 bg-indigo-500 shadow-sm" />
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400">{formatDate(orphan.createdAt)}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">تسجيل مبدئي في المنصة</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">المصدر: {orphan.source === "public_form" ? "النموذج العام" : orphan.source === "excel_import" ? "استيراد إكسل" : "إدارة المشرف"}</p>
                </div>
                
                {/* Sponsorship event */}
                {orphan.sponsorshipStatus === "مكفول" && orphan.sponsorName && (
                  <div className="relative">
                    <div className="absolute -right-[29px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-slate-800 bg-emerald-500 shadow-sm" />
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">اكتملت الفرحة 🎉</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">بدء كفالة رسمية بواسطة: {orphan.sponsorName}</p>
                  </div>
                )}

                {/* File status event */}
                <div className="relative">
                  <div className={`absolute -right-[29px] top-1 h-4 w-4 rounded-full border-4 border-white dark:border-slate-800 shadow-sm ${
                    orphan.fileStatus === "مكتمل" || orphan.fileStatus === "مقبول" ? "bg-emerald-500" : 
                    orphan.fileStatus === "مرفوض" ? "bg-rose-500" : "bg-amber-500"
                  }`} />
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400">حالة الملف</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{orphan.fileStatus}</p>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="space-y-6">
              <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                المعلومات الأساسية
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">تاريخ الميلاد</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{orphan.birthDate || "غير محدد"}</span>
                </div>
                <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">الجنس</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{orphan.gender}</span>
                </div>
                <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">الوصي</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{orphan.guardianName || "غير محدد"}</span>
                  {orphan.guardianRelation && (
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold inline-block mt-0.5">{orphan.guardianRelation}</span>
                  )}
                </div>
                <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">جوال الوصي</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{maskSensitiveText(orphan.guardianPhone, canViewSensitive, "phone", "غير متوفر")}</span>
                </div>
                <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">السكن</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{orphan.address || "غير محدد"}</span>
                </div>
                <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">الأوراق الثبوتية</span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{orphan.documentsStatus || "غير محدد"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sponsorship & Financial Details */}
          {(orphan.sponsorName || orphan.sponsorshipAmount || orphan.transferAccountNumber) && (
            <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-slate-800/50 dark:to-slate-700/50 p-6 rounded-3xl border border-white/60 dark:border-slate-700/60 space-y-4">
              <h4 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-400" />
                بيانات الكفالة والتحويل
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {orphan.sponsorName && (
                  <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">اسم الكفيل</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{orphan.sponsorName}</span>
                  </div>
                )}
                {orphan.sponsorCountry && (
                  <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">دولة الكفيل</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{orphan.sponsorCountry}</span>
                  </div>
                )}
                {orphan.sponsorPhone && (
                  <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">جوال الكفيل</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">{maskSensitiveText(orphan.sponsorPhone, canViewSensitive, "phone", "غير متوفر")}</span>
                  </div>
                )}
                {orphan.sponsorshipAmount && (
                  <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">مبلغ الكفالة</span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{orphan.sponsorshipAmount} {orphan.currency}</span>
                  </div>
                )}
              </div>
              {(orphan.transferAccountName || orphan.transferAccountNumber) && (
                <div className="bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/60 dark:border-slate-700/60 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">الحساب البنكي</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                      {canViewSensitive ? (
                        <>
                          {orphan.transferAccountName && `${orphan.transferAccountName} — `}
                          {orphan.transferAccountNumber || "غير متوفر"}
                        </>
                      ) : (
                        <>
                          غير مصرح — {maskSensitiveText(orphan.transferAccountNumber, false, "account")}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
