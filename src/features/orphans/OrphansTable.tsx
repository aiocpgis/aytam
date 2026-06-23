import { Edit3, Trash2, Calendar, MapPin, Shield, User, Landmark, Heart, Eye } from "lucide-react";
import { useState } from "react";
import type { OrphanRecord } from "../../types/orphan.types";
import { OrphanProfileModal } from "../../components/ui/OrphanProfileModal";
import { usePermissions } from "../../hooks/usePermissions";

interface OrphansTableProps {
  records: OrphanRecord[];
  onEdit: (record: OrphanRecord) => void;
  onDelete: (id: string) => void;
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

export function OrphansTable({ records, onEdit, onDelete }: OrphansTableProps) {
  const [viewingOrphan, setViewingOrphan] = useState<OrphanRecord | null>(null);
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission("orphans.view_sensitive");

  if (records.length === 0) {
    return (
      <div className="glass-card p-12 text-center border border-white/50 bg-white/40">
        <div className="mx-auto w-16 h-16 grid place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
          <Shield className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800">لا توجد بيانات مطابقة</h3>
        <p className="mt-2 text-sm text-slate-500 font-bold">أضف سجلًا جديدًا أو استورد ملف Excel أو اضبط الفلاتر.</p>
      </div>
    );
  }

  // Sponsorship Badge Color Mapper
  function getSponsorshipBadge(status: string) {
    switch (status) {
      case "مكفول":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)]";
      case "بانتظار كافل":
        return "bg-amber-50 text-amber-700 border border-amber-200/50 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.2)]";
      case "متوقف":
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200/50";
    }
  }

  // File Status Badge Color Mapper
  function getFileStatusBadge(status: string) {
    if (status.includes("جديد")) {
      return "bg-cyan-50 text-cyan-700 border border-cyan-200/50";
    }
    switch (status) {
      case "قيد المراجعة":
        return "bg-blue-50 text-blue-700 border border-blue-200/50";
      case "مقبول":
      case "مكتمل":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
      case "مرفوض":
        return "bg-rose-50 text-rose-700 border border-rose-200/50 animate-pulse";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200/50";
    }
  }

  return (
    <div className="space-y-4">
      {/* Desktop Version: Premium Table */}
      <div className="hidden lg:block glass-card overflow-hidden border border-white/60 bg-white/50 shadow-glass">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-slate-900/90 text-white backdrop-blur-md">
                <th className="px-5 py-4 text-xs font-black tracking-wider rounded-tr-3xl">اسم الطفل</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">تاريخ الميلاد</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">الجنس</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">حالة اليتيم</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">المحافظة</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">الوصي والصلة</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">جوال الوصي</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">الكفيل</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">قيمة الكفالة</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">حالة الكفالة</th>
                <th className="px-4 py-4 text-xs font-black tracking-wider">حالة الملف</th>
                <th className="px-5 py-4 text-xs font-black tracking-wider rounded-tl-3xl text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 bg-white/40">
              {records.map((record) => (
                <tr key={record.id} className="transition-all duration-200 hover:bg-blue-50/40">
                  <td className="px-5 py-4 font-black text-slate-800 text-sm">{record.childFullName}</td>
                  <td className="px-4 py-4 text-slate-600 text-sm font-semibold">{record.birthDate || "-"}</td>
                  <td className="px-4 py-4 text-slate-600 text-sm font-semibold">{record.gender}</td>
                  <td className="px-4 py-4 text-slate-600 text-sm font-semibold">{record.orphanType}</td>
                  <td className="px-4 py-4 text-slate-600 text-sm font-semibold">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {record.governorateCity || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-sm font-semibold">
                    <div>{record.guardianName || "-"}</div>
                    {record.guardianRelation && (
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold inline-block mt-0.5">
                        {record.guardianRelation}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-sm font-semibold">{maskSensitiveText(record.guardianPhone, canViewSensitive, "phone")}</td>
                  <td className="px-4 py-4 text-slate-700 text-sm font-bold">
                    {record.sponsorName ? (
                      <span className="inline-flex items-center gap-1 text-slate-800">
                        <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-400" />
                        {record.sponsorName} {record.sponsorCountry && `(${record.sponsorCountry})`}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-800 text-sm font-extrabold">
                    {record.sponsorshipAmount ?? "-"} {record.sponsorshipAmount ? record.currency : ""}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${getSponsorshipBadge(record.sponsorshipStatus)}`}>
                      {record.sponsorshipStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${getFileStatusBadge(record.fileStatus)}`}>
                      {record.fileStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        className="p-2 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-600 transition hover:bg-indigo-100 hover:text-indigo-700 active:scale-95" 
                        onClick={() => setViewingOrphan(record)} 
                        title="عرض الملف"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {hasPermission("orphans.update") && (
                        <button 
                          className="p-2 rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-600 active:scale-95" 
                          onClick={() => onEdit(record)} 
                          title="تعديل"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                      {hasPermission("orphans.delete") && (
                        <button 
                          className="p-2 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 active:scale-95" 
                          onClick={() => record.id && onDelete(record.id)} 
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Version: Glass Cards Grid */}
      <div className="grid gap-4 lg:hidden">
        {records.map((record) => (
          <article 
            key={record.id} 
            className="glass-card p-5 border border-white/60 bg-white/50 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            {/* Header: Name and badges */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100/50 pb-3">
              <div>
                <h4 className="text-base font-black text-slate-900 leading-tight">{record.childFullName}</h4>
                <div className="mt-1 flex flex-wrap gap-2 items-center text-xs font-bold text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {record.birthDate || "-"}
                  </span>
                  <span>•</span>
                  <span>{record.gender}</span>
                  <span>•</span>
                  <span>{record.orphanType}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${getSponsorshipBadge(record.sponsorshipStatus)}`}>
                  {record.sponsorshipStatus}
                </span>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${getFileStatusBadge(record.fileStatus)}`}>
                  {record.fileStatus}
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="py-3 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">المحافظة / السكن</span>
                <span className="inline-flex items-center gap-1 text-slate-800">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {record.governorateCity || "-"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">الوصي والاتصال</span>
                <span className="inline-flex items-center gap-1 text-slate-800">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {record.guardianName || "-"} ({record.guardianRelation || "-"})
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">الكفيل</span>
                <span className="inline-flex items-center gap-1 text-slate-800">
                  <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-400" />
                  {record.sponsorName || "بانتظار كافل"}{record.sponsorName && record.sponsorCountry && ` (${record.sponsorCountry})`}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">مبلغ الكفالة</span>
                <span className="text-slate-900 font-extrabold text-sm">
                  {record.sponsorshipAmount ?? "-"} {record.sponsorshipAmount ? record.currency : ""}
                </span>
              </div>
            </div>

            {/* Accounts details if existing */}
            {(record.transferAccountName || record.transferAccountNumber) && (
              <div className="mt-1 bg-slate-50/50 border border-slate-100 rounded-2xl p-2.5 flex items-center justify-between text-xs font-semibold">
                <div className="inline-flex items-center gap-1.5 text-slate-500">
                  <Landmark className="h-3.5 w-3.5 text-slate-400" />
                  الحساب البنكي:
                </div>
                <div className="text-slate-800 text-left font-mono">
                  {canViewSensitive ? (
                    <>
                      {record.transferAccountName && `${record.transferAccountName} - `}
                      {record.transferAccountNumber || "-"}
                    </>
                  ) : (
                    <>
                      غير مصرح - {maskSensitiveText(record.transferAccountNumber, false, "account")}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Footer: Action Buttons */}
            <div className="mt-3 pt-3 border-t border-slate-100/50 flex justify-end gap-2">
              <button 
                type="button" 
                className="secondary-btn py-2 px-4 text-xs" 
                onClick={() => setViewingOrphan(record)}
              >
                <Eye className="h-3.5 w-3.5 text-indigo-500" />
                عرض الملف
              </button>
              {hasPermission("orphans.update") && (
                <button 
                  type="button" 
                  className="secondary-btn py-2 px-4 text-xs" 
                  onClick={() => onEdit(record)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  تعديل البيانات
                </button>
              )}
              {hasPermission("orphans.delete") && (
                <button 
                  type="button" 
                  className="danger-btn py-2 px-4 text-xs" 
                  onClick={() => record.id && onDelete(record.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف السجل
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {viewingOrphan && (
        <OrphanProfileModal 
          orphan={viewingOrphan} 
          onClose={() => setViewingOrphan(null)} 
        />
      )}
    </div>
  );
}
