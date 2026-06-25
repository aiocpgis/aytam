import { FormEvent, useEffect, useState, useRef } from "react";
import type { OrphanFormValues, OrphanRecord, UploadedDocument } from "../../types/orphan.types";
import { defaultOrphanFormValues, formValuesToOrphanRecord } from "./orphan.mapper";
import { AlertCircle, User, Users, Heart, CreditCard, FileText, X, Plus, Loader2 } from "lucide-react";
import { sanitizeInput } from "../../lib/utils";
import { OrphanPhotoUploader } from "./OrphanPhotoUploader";
import { usePermissions } from "../../hooks/usePermissions";
import { createSignedDocumentUrl } from "../applications/applicationRequests.service";
import { uploadOrphanDocument, deleteOrphanDocument } from "./orphan.service";

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

interface DocumentThumbnailProps {
  document: { name: string; path: string };
  onDelete?: (path: string) => void;
  isDeleting?: boolean;
}

function DocumentThumbnail({ document, onDelete, isDeleting }: DocumentThumbnailProps) {
  const { hasPermission } = usePermissions();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(document.name || document.path);

  useEffect(() => {
    if (isImage && hasPermission("orphans.view_documents")) {
      setIsLoading(true);
      createSignedDocumentUrl(document.path)
        .then((url) => setThumbnailUrl(url))
        .catch((err) => console.error("Failed to load thumbnail", err))
        .finally(() => setIsLoading(false));
    }
  }, [document.path, isImage, hasPermission]);

  async function handleOpen() {
    if (!hasPermission("orphans.view_documents")) {
      alert("لا تملك الصلاحية لعرض المستندات.");
      return;
    }
    try {
      setIsOpening(true);
      const url = thumbnailUrl || await createSignedDocumentUrl(document.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      alert("تعذر فتح الملف.");
    } finally {
      setIsOpening(false);
    }
  }

  const renderContent = () => {
    if (isImage) {
      if (thumbnailUrl) {
        return <img src={thumbnailUrl} alt={document.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />;
      }
      if (isLoading) {
        return (
          <div className="flex h-full w-full items-center justify-center">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        );
      }
      return (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          <FileText className="h-6 w-6" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 group-hover:text-blue-500 transition-colors">
        <FileText className="h-6 w-6" />
        <span className="mt-1 max-w-[50px] truncate text-[9px] font-extrabold">{document.name}</span>
      </div>
    );
  };

  return (
    <div className="relative group shrink-0 animate-in fade-in">
      <button
        type="button"
        onClick={handleOpen}
        disabled={isOpening}
        className="relative block h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-blue-400 hover:shadow-md"
      >
        {renderContent()}
      </button>
      
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(document.path)}
          disabled={isDeleting}
          className="absolute -top-1.5 -left-1.5 h-5 w-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md border border-white hover:scale-105 transition-transform"
          title="حذف المستند"
        >
          {isDeleting ? (
            <span className="h-2.5 w-2.5 animate-spin rounded-full border border-white border-t-transparent" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

export function OrphanForm({ selected, onSubmit, onCancel }: OrphanFormProps) {
  const [values, setValues] = useState<OrphanFormValues>(defaultOrphanFormValues());
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const canViewSensitive = hasPermission("orphans.view_sensitive");

  const [localDocuments, setLocalDocuments] = useState<UploadedDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [deletingDocPath, setDeletingDocPath] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValues(selected ? recordToFormValues(selected) : defaultOrphanFormValues());
    if (selected) {
      setLocalDocuments(selected.documents || []);
    } else {
      setLocalDocuments([]);
    }
    setError(null);
    setActiveTab("personal");
  }, [selected]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!selected?.id) {
      setError("يرجى حفظ بيانات اليتيم الأساسية أولاً قبل رفع المستندات.");
      return;
    }

    setIsUploadingDoc(true);
    setError(null);
    try {
      const uploadedList: UploadedDocument[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const newDoc = await uploadOrphanDocument(selected.id, file);
        uploadedList.push(newDoc);
      }
      setLocalDocuments((prev) => [...prev, ...uploadedList]);
    } catch (err: any) {
      console.error(err);
      setError("فشل رفع بعض أو كل المستندات. يرجى التحقق من حجم الملف وصيغته.");
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };

  const handleDocDelete = async (path: string) => {
    if (!selected?.id) return;
    setDeletingDocPath(path);
    setError(null);
    try {
      await deleteOrphanDocument(selected.id, path);
      setLocalDocuments((prev) => prev.filter((doc) => doc.path !== path));
    } catch (err: any) {
      console.error(err);
      setError("فشل حذف المستند.");
    } finally {
      setDeletingDocPath(null);
    }
  };

  function updateField<K extends keyof OrphanFormValues>(key: K, value: OrphanFormValues[K]) {
    setError(null);
    const sanitized = typeof value === "string" ? sanitizeInput(value) : value;
    setValues((curr) => ({ ...curr, [key]: sanitized }));
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
      const record = formValuesToOrphanRecord(values) as ReturnType<typeof formValuesToOrphanRecord> & { id?: string; documents?: any };
      if (selected?.id) record.id = selected.id;
      record.documents = localDocuments;
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

            {/* Attached documents */}
            {selected?.id && (
              <div className="mt-5 pt-5 border-t border-slate-100/80">
                <label className="text-xs font-extrabold text-slate-750 block mb-3 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-500" />
                  المستندات والأوراق الثبوتية المرفقة
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {localDocuments.map((doc) => (
                    <DocumentThumbnail
                      key={doc.path}
                      document={doc}
                      onDelete={handleDocDelete}
                      isDeleting={deletingDocPath === doc.path}
                    />
                  ))}
                  
                  {/* Upload button */}
                  <button
                    type="button"
                    title="إضافة مستند جديد"
                    onClick={() => docInputRef.current?.click()}
                    disabled={isUploadingDoc}
                    className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 text-blue-500 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploadingDoc ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        <span className="text-[9px] font-extrabold">إضافة مستند</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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
            {/* Attached documents */}
            {selected?.id && (
              <div className="mt-5 pt-5 border-t border-slate-100/80 sm:col-span-2 md:col-span-3">
                <label className="text-xs font-extrabold text-slate-700 block mb-3 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  المستندات والأوراق الثبوتية المرفقة
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {localDocuments.map((doc) => (
                    <DocumentThumbnail
                      key={doc.path}
                      document={doc}
                      onDelete={handleDocDelete}
                      isDeleting={deletingDocPath === doc.path}
                    />
                  ))}
                  
                  {/* Upload button */}
                  <button
                    type="button"
                    title="إضافة مستند جديد"
                    onClick={() => docInputRef.current?.click()}
                    disabled={isUploadingDoc}
                    className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-emerald-250 bg-emerald-50/40 text-emerald-600 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploadingDoc ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        <span className="text-[9px] font-extrabold">إضافة مستند</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocUpload}
        className="hidden"
        multiple
        accept="image/*,application/pdf"
      />
    </form>
  );
}
