import { FormEvent, useEffect, useState } from "react";
import type { OrphanFormValues, OrphanRecord } from "../../types/orphan.types";
import { defaultOrphanFormValues, formValuesToOrphanRecord } from "./orphan.mapper";
import { AlertCircle, User, Users, Heart, CreditCard } from "lucide-react";
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

const tabs = [
  { id: "personal",    label: "البيانات الشخصية",       icon: User,       color: "text-blue-500"   },
  { id: "guardian",    label: "الوصي والاتصال",         icon: Users,      color: "text-violet-500" },
  { id: "sponsorship", label: "الكفالة والمالية",        icon: Heart,      color: "text-rose-500"   },
  { id: "bank",        label: "الحساب البنكي والإدارة", icon: CreditCard, color: "text-emerald-500" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function OrphanForm({ selected, onSubmit, onCancel }: OrphanFormProps) {
  const [values, setValues] = useState<OrphanFormValues>(defaultOrphanFormValues());
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission("orphans.view_sensitive");

  useEffect(() => {
    setValues(selected ? recordToFormValues(selected) : defaultOrphanFormValues());
    setError(null);
    setActiveTab("personal");
  }, [selected]);

  function updateField<K extends keyof OrphanFormValues>(key: K, value: OrphanFormValues[K]) {
    setError(null);
    setValues((curr) => ({ ...curr, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.childFullName.trim()) {
      setError("اسم الطفل رباعي مطلوب لاعتماد السجل.");
      setActiveTab("personal");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const record = formValuesToOrphanRecord(values) as ReturnType<typeof formValuesToOrphanRecord> & { id?: string };
      if (selected?.id) record.id = selected.id;
      await onSubmit(record);
      if (!selected) setValues(defaultOrphanFormValues());
    } catch (err) {
      console.error(err);
      setError("فشل حفظ السجل. يرجى التحقق من صحة البيانات.");
    } finally {
      setIsSaving(false);
    }
  }

  const personalMissing = !!error && !values.childFullName.trim();
  const activeTabData = tabs.find((t) => t.id === activeTab)!;

  return (
    /* ── Outer wrapper: flex column filling the drawer height ── */
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col"
    >

      {/* ══════════════ BODY (scrollable) ══════════════ */}
      <div className="flex-1 overflow-y-auto space-y-6 px-1 pb-4">

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-xs font-bold text-rose-700 animate-in fade-in-50 slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Tab bar: icon with halo + permanent label ── */}
        <div className="flex gap-1.5 rounded-2xl border border-slate-200/60 bg-slate-100/50 p-1.5">
          {tabs.map(({ id, label, icon: Icon, color }) => {
            const isActive = activeTab === id;
            const hasErr = id === "personal" && personalMissing;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex flex-1 flex-col items-center gap-2 rounded-xl px-2 py-2.5 transition-all duration-200 ${
                  isActive
                    ? "bg-white shadow-sm border border-slate-200/50"
                    : "hover:bg-white/60"
                }`}
              >
                {/* Icon with halo */}
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 ring-2 ring-blue-200 ring-offset-1 shadow-[0_0_10px_rgba(59,130,246,0.25)]"
                      : "bg-slate-200/60 group-hover:bg-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors duration-200 ${
                      isActive ? color : "text-slate-400"
                    }`}
                  />
                </span>

                {/* Always-visible label */}
                <span
                  className={`text-[10px] font-extrabold leading-tight transition-colors duration-200 ${
                    isActive ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>

                {/* Error dot */}
                {hasErr && (
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab label subtitle */}
        <div className="flex items-center gap-2 -mt-2">
          <activeTabData.icon className={`h-4 w-4 ${activeTabData.color}`} />
          <span className="text-sm font-black text-slate-700">{activeTabData.label}</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* ══ Tab: Personal ══ */}
        {activeTab === "personal" && (
          <div className="space-y-5 animate-in fade-in-50 duration-150">

            {/* Photo + name row (edit mode) */}
            {selected?.id ? (
              <div className="flex gap-6 items-start">
                {/* Photo uploader on the right */}
                <div className="shrink-0">
                  <OrphanPhotoUploader
                    orphanId={selected.id}
                    currentPhotoPath={selected.photo_path}
                  />
                </div>

                {/* Name field beside the photo */}
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600">اسم الطفل رباعي *</label>
                  <input
                    className={`glass-input ${personalMissing ? "border-rose-300 focus:border-rose-500" : ""}`}
                    placeholder="الاسم كامل كما في الأوراق الرسمية"
                    value={values.childFullName}
                    onChange={(e) => updateField("childFullName", e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600">اسم الطفل رباعي *</label>
                <input
                  className={`glass-input ${personalMissing ? "border-rose-300 focus:border-rose-500" : ""}`}
                  placeholder="الاسم كامل كما في الأوراق الرسمية"
                  value={values.childFullName}
                  onChange={(e) => updateField("childFullName", e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600">تاريخ الميلاد</label>
                <input
                  className="glass-input"
                  type="date"
                  value={values.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                />
              </div>

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

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600">المحافظة / المدينة</label>
                <input
                  className="glass-input"
                  placeholder="مثال: غزة، نابلس، الخليل"
                  value={values.governorateCity}
                  onChange={(e) => updateField("governorateCity", e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-600">مكان السكن بالتفصيل</label>
                <input
                  className="glass-input"
                  placeholder="الحي، الشارع، المعالم"
                  value={values.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ══ Tab: Guardian ══ */}
        {activeTab === "guardian" && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 animate-in fade-in-50 duration-150">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">الوصي القانوني</label>
              <input
                className="glass-input"
                placeholder="اسم متولي أمر الطفل"
                value={values.guardianName}
                onChange={(e) => updateField("guardianName", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">صلة القرابة</label>
              <input
                className="glass-input"
                placeholder="مثال: أم، عم، جدة"
                value={values.guardianRelation}
                onChange={(e) => updateField("guardianRelation", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">رقم جوال الوصي</label>
              <input
                className="glass-input disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="للتواصل والتأكيد"
                value={!canViewSensitive && selected ? "••••••••" : values.guardianPhone}
                onChange={(e) => updateField("guardianPhone", e.target.value)}
                disabled={!canViewSensitive && !!selected}
              />
            </div>
          </div>
        )}

        {/* ══ Tab: Sponsorship ══ */}
        {activeTab === "sponsorship" && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 animate-in fade-in-50 duration-150">
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
                <option>غير مكفول</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">اسم الكفيل</label>
              <input
                className="glass-input"
                placeholder="يترك فارغاً إذا كان بانتظار كفالة"
                value={values.sponsorName}
                onChange={(e) => updateField("sponsorName", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">دولة الكفيل</label>
              <input
                className="glass-input"
                placeholder="دولة إقامة الكفيل إن وجد"
                value={values.sponsorCountry}
                onChange={(e) => updateField("sponsorCountry", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">قيمة الكفالة الشهرية</label>
              <input
                className="glass-input"
                placeholder="مثال: 200"
                value={values.sponsorshipAmount}
                onChange={(e) => updateField("sponsorshipAmount", e.target.value)}
              />
            </div>

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

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">رقم جوال الكفيل</label>
              <input
                className="glass-input disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="جوال الكفيل إن وجد"
                value={!canViewSensitive && selected ? "••••••••" : values.sponsorPhone}
                onChange={(e) => updateField("sponsorPhone", e.target.value)}
                disabled={!canViewSensitive && !!selected}
              />
            </div>
          </div>
        )}

        {/* ══ Tab: Bank ══ */}
        {activeTab === "bank" && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 animate-in fade-in-50 duration-150">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">صاحب الحساب البنكي</label>
              <input
                className="glass-input disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="الاسم المسجل في البنك للتحويل"
                value={!canViewSensitive && selected ? "••••••••" : values.transferAccountName}
                onChange={(e) => updateField("transferAccountName", e.target.value)}
                disabled={!canViewSensitive && !!selected}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">رقم الحساب أو الآيبان</label>
              <input
                className="glass-input disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="تفاصيل الحساب للتحويل"
                value={!canViewSensitive && selected ? "••••••••" : values.transferAccountNumber}
                onChange={(e) => updateField("transferAccountNumber", e.target.value)}
                disabled={!canViewSensitive && !!selected}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600">حالة الأوراق الثبوتية</label>
              <input
                className="glass-input"
                placeholder="مثال: مكتملة، ناقصة شهادة الوفاة"
                value={values.documentsStatus}
                onChange={(e) => updateField("documentsStatus", e.target.value)}
              />
            </div>

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
          </div>
        )}
      </div>

      {/* ══════════════ FOOTER — fixed at drawer bottom ══════════════ */}
      <div className="shrink-0 border-t border-slate-200 bg-white/80 backdrop-blur-sm px-6 py-4">

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mb-3">
          {tabs.map(({ id }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`rounded-full transition-all duration-300 ${
                activeTab === id
                  ? "w-5 h-1.5 bg-slate-800"
                  : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full primary-btn py-3.5 text-sm font-black tracking-wide shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition hover:-translate-y-0.5"
        >
          {isSaving
            ? "جاري حفظ البيانات..."
            : selected
            ? "✓  حفظ التغييرات"
            : "إضافة السجل رسمياً"}
        </button>
      </div>
    </form>
  );
}
