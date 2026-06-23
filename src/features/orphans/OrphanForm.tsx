import { FormEvent, useEffect, useState } from "react";
import type { OrphanFormValues, OrphanRecord } from "../../types/orphan.types";
import { defaultOrphanFormValues, formValuesToOrphanRecord } from "./orphan.mapper";
import { AlertCircle } from "lucide-react";
import { OrphanPhotoUploader } from "./OrphanPhotoUploader";
import { usePermissions } from "../../hooks/usePermissions";

interface OrphanFormProps {
  selected?: OrphanRecord | null;
  onSubmit: (record: ReturnType<typeof formValuesToOrphanRecord>) => Promise<void>;
  onCancel?: () => void;
}

function recordToFormValues(record: OrphanRecord): OrphanFormValues {
  return {
    childFullName: record.childFullName ?? "",
    birthDate: record.birthDate ?? "",
    sponsorName: record.sponsorName ?? "",
    sponsorCountry: record.sponsorCountry ?? "",
    sponsorshipAmount: record.sponsorshipAmount ? String(record.sponsorshipAmount) : "",
    sponsorPhone: record.sponsorPhone ?? "",
    guardianName: record.guardianName ?? "",
    guardianRelation: record.guardianRelation ?? "",
    guardianPhone: record.guardianPhone ?? "",
    orphanType: record.orphanType ?? "يتيم الأب",
    address: record.address ?? "",
    transferAccountName: record.transferAccountName ?? "",
    transferAccountNumber: record.transferAccountNumber ?? "",
    documentsStatus: record.documentsStatus ?? "",
    governorateCity: record.governorateCity ?? "",
    gender: record.gender ?? "ذكر",
    sponsorshipStatus: record.sponsorshipStatus ?? "بانتظار كافل",
    fileStatus: record.fileStatus ?? "جديد",
    currency: record.currency ?? "شيكل",
  };
}

export function OrphanForm({ selected, onSubmit, onCancel }: OrphanFormProps) {
  const [values, setValues] = useState<OrphanFormValues>(defaultOrphanFormValues());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission("orphans.view_sensitive");

  useEffect(() => {
    setValues(selected ? recordToFormValues(selected) : defaultOrphanFormValues());
    setError(null);
  }, [selected]);

  function updateField<K extends keyof OrphanFormValues>(key: K, value: OrphanFormValues[K]) {
    setError(null);
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.childFullName.trim()) {
      setError("اسم الطفل رباعي مطلوب لاعتماد السجل.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSubmit(formValuesToOrphanRecord(values));
      if (!selected) setValues(defaultOrphanFormValues());
    } catch (err) {
      console.error(err);
      setError("فشل حفظ السجل. يرجى التحقق من صحة البيانات.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 bg-gradient-to-l from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {selected ? "تعديل بيانات يتيم" : "إضافة يتيم جديد"}
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            تعبئة الحقول التفصيلية المتوافقة مع معايير الكفالة والتحقق.
          </p>
        </div>
        {selected && onCancel && (
          <button 
            type="button" 
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-white hover:border-slate-300" 
            onClick={onCancel}
          >
            إلغاء التعديل
          </button>
        )}
      </div>


      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/70 p-3 text-xs font-bold text-rose-700 animate-in fade-in-50 slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selected && selected.id && (
        <div className="mb-6 flex justify-center">
          <OrphanPhotoUploader 
            orphanId={selected.id} 
            currentPhotoPath={selected.photo_path} 
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Child Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">اسم الطفل رباعي *</label>
          <input 
            className={`glass-input ${error && !values.childFullName.trim() ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100" : ""}`} 
            placeholder="الاسم كامل كما في الأوراق" 
            value={values.childFullName} 
            onChange={(e) => updateField("childFullName", e.target.value)} 
          />
        </div>

        {/* Birthdate */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">تاريخ الميلاد</label>
          <input 
            className="glass-input" 
            type="date" 
            value={values.birthDate} 
            onChange={(e) => updateField("birthDate", e.target.value)} 
          />
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">الجنس</label>
          <select 
            className="glass-input" 
            value={values.gender} 
            onChange={(e) => updateField("gender", e.target.value as OrphanFormValues["gender"])}
          >
            <option>ذكر</option>
            <option>أنثى</option>
            <option>غير محدد</option>
          </select>
        </div>

        {/* Orphan Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">حالة اليتيم</label>
          <select 
            className="glass-input" 
            value={values.orphanType} 
            onChange={(e) => updateField("orphanType", e.target.value as OrphanFormValues["orphanType"])}
          >
            <option>يتيم الأب</option>
            <option>يتيم الأم</option>
            <option>يتيم الأبوين</option>
            <option>غير محدد</option>
          </select>
        </div>

        {/* Governorate City */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">المحافظة / المدينة</label>
          <input 
            className="glass-input" 
            placeholder="مثال: غزة، نابلس، الخليل" 
            value={values.governorateCity} 
            onChange={(e) => updateField("governorateCity", e.target.value)} 
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">مكان السكن بالتفصيل</label>
          <input 
            className="glass-input" 
            placeholder="الحي، الشارع، المعالم" 
            value={values.address} 
            onChange={(e) => updateField("address", e.target.value)} 
          />
        </div>

        {/* Guardian Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">الوصي القانوني</label>
          <input 
            className="glass-input" 
            placeholder="اسم متولي أمر الطفل" 
            value={values.guardianName} 
            onChange={(e) => updateField("guardianName", e.target.value)} 
          />
        </div>

        {/* Guardian Relation */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">صلة القرابة</label>
          <input 
            className="glass-input" 
            placeholder="مثال: أم، عم، جدة" 
            value={values.guardianRelation} 
            onChange={(e) => updateField("guardianRelation", e.target.value)} 
          />
        </div>

        {/* Guardian Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">رقم جوال الوصي</label>
          <input 
            className="glass-input disabled:bg-slate-100 disabled:text-slate-400" 
            placeholder="للتواصل والتأكيد" 
            value={!canViewSensitive && selected ? "********" : values.guardianPhone} 
            onChange={(e) => updateField("guardianPhone", e.target.value)} 
            disabled={!canViewSensitive && !!selected}
          />
        </div>

        {/* Sponsor Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">اسم الكفيل</label>
          <input 
            className="glass-input" 
            placeholder="يترك فارغاً إذا كان بانتظار كفالة" 
            value={values.sponsorName} 
            onChange={(e) => updateField("sponsorName", e.target.value)} 
          />
        </div>

        {/* Sponsor Country */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">دولة الكفيل</label>
          <input 
            className="glass-input" 
            placeholder="دولة إقامة الكفيل إن وجد" 
            value={values.sponsorCountry} 
            onChange={(e) => updateField("sponsorCountry", e.target.value)} 
          />
        </div>

        {/* Sponsorship Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">قيمة الكفالة الشهرية</label>
          <input 
            className="glass-input" 
            placeholder="مثال: 200" 
            value={values.sponsorshipAmount} 
            onChange={(e) => updateField("sponsorshipAmount", e.target.value)} 
          />
        </div>

        {/* Sponsor Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">رقم جوال الكفيل</label>
          <input 
            className="glass-input disabled:bg-slate-100 disabled:text-slate-400" 
            placeholder="جوال الكفيل إن وجد" 
            value={!canViewSensitive && selected ? "********" : values.sponsorPhone} 
            onChange={(e) => updateField("sponsorPhone", e.target.value)} 
            disabled={!canViewSensitive && !!selected}
          />
        </div>

        {/* Transfer Account Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">صاحب الحساب البنكي</label>
          <input 
            className="glass-input disabled:bg-slate-100 disabled:text-slate-400" 
            placeholder="الاسم المسجل في البنك للتحويل" 
            value={!canViewSensitive && selected ? "********" : values.transferAccountName} 
            onChange={(e) => updateField("transferAccountName", e.target.value)} 
            disabled={!canViewSensitive && !!selected}
          />
        </div>

        {/* Transfer Account Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">رقم الحساب أو الآيبان</label>
          <input 
            className="glass-input disabled:bg-slate-100 disabled:text-slate-400" 
            placeholder="تفاصيل الحساب للتحويل" 
            value={!canViewSensitive && selected ? "********" : values.transferAccountNumber} 
            onChange={(e) => updateField("transferAccountNumber", e.target.value)} 
            disabled={!canViewSensitive && !!selected}
          />
        </div>

        {/* Documents Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">حالة الأوراق الثبوتية</label>
          <input 
            className="glass-input" 
            placeholder="مثال: مكتملة، ناقصة شهادة الوفاة" 
            value={values.documentsStatus} 
            onChange={(e) => updateField("documentsStatus", e.target.value)} 
          />
        </div>

        {/* Sponsorship Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">حالة الكفالة</label>
          <select 
            className="glass-input" 
            value={values.sponsorshipStatus} 
            onChange={(e) => updateField("sponsorshipStatus", e.target.value as OrphanFormValues["sponsorshipStatus"])}
          >
            <option>بانتظار كافل</option>
            <option>مكفول</option>
            <option>متوقف</option>
          </select>
        </div>

        {/* File Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">حالة الملف الإداري</label>
          <select 
            className="glass-input" 
            value={values.fileStatus} 
            onChange={(e) => updateField("fileStatus", e.target.value as OrphanFormValues["fileStatus"])}
          >
            <option>جديد</option>
            <option>جديد بانتظار المراجعة</option>
            <option>قيد المراجعة</option>
            <option>مقبول</option>
            <option>مرفوض</option>
            <option>مكتمل</option>
          </select>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-600">عملة التحويل</label>
          <select 
            className="glass-input" 
            value={values.currency} 
            onChange={(e) => updateField("currency", e.target.value as OrphanFormValues["currency"])}
          >
            <option>شيكل</option>
            <option>دولار</option>
            <option>دينار</option>
            <option>غير محدد</option>
          </select>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button 
          className="primary-btn w-full sm:w-auto px-8 py-3 text-xs font-black shadow-md transition hover:-translate-y-0.5" 
          disabled={isSaving}
        >
          {isSaving ? "جاري حفظ البيانات..." : selected ? "حفظ التغييرات الحالية" : "إضافة السجل رسمياً"}
        </button>
      </div>
    </form>
  );
}
