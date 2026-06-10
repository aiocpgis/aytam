import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, FileText, XCircle } from "lucide-react";
import type { OrphanRecord, UploadedDocument } from "../../types/orphan.types";
import {
  approveApplication,
  createSignedDocumentUrl,
  rejectApplication,
  subscribeToPendingApplications,
} from "../applications/applicationRequests.service";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ar");
}

interface DocumentButtonProps {
  document: UploadedDocument;
}

type ActionNotice = {
  tone: "success" | "info";
  message: string;
};

function DocumentButton({ document }: DocumentButtonProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function openDocument() {
    try {
      setIsOpening(true);
      setErrorText(null);
      const url = await createSignedDocumentUrl(document.path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setErrorText("تعذر فتح الملف.");
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="secondary-btn px-3 py-2 text-xs hover:border-blue-300 hover:text-blue-600 transition"
        onClick={openDocument}
        disabled={isOpening}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {isOpening ? "فتح..." : document.name || "ملف"}
      </button>
      {errorText && (
        <span className="absolute bottom-full right-0 mb-1 z-10 w-28 text-center bg-rose-600 text-white font-extrabold text-[9px] rounded-lg py-1 px-1.5 shadow-md">
          {errorText}
        </span>
      )}
    </div>
  );
}

export function ApplicationRequestsPanel() {
  const [applications, setApplications] = useState<OrphanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<OrphanRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OrphanRecord | null>(null);
  const [errorAlert, setErrorAlert] = useState<{ title: string; message: string } | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToPendingApplications((records) => {
      setApplications(records);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!actionNotice) return;

    const timer = window.setTimeout(() => {
      setActionNotice(null);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  function removeApplicationFromList(applicationId: string) {
    setApplications((current) => current.filter((application) => application.id !== applicationId));
  }

  async function executeApprove() {
    const applicationId = approveTarget?.id;
    if (!applicationId) return;
    const application = approveTarget;
    setApproveTarget(null);

    try {
      setProcessingId(applicationId);
      setActionNotice(null);
      await approveApplication(application);
      removeApplicationFromList(applicationId);
      setActionNotice({
        tone: "success",
        message: `تم اعتماد طلب ${application.childFullName} وإزالته من قائمة الانتظار.`,
      });
      addToast("تم اعتماد طلب الكفالة بنجاح وإضافته لشؤون الأبناء", "success");
    } catch (error) {
      console.error(error);
      setErrorAlert({
        title: "فشل اعتماد الطلب",
        message: "حدث خطأ غير متوقع أثناء اعتماد الطلب. يرجى مراجعة الصلاحيات أو الاتصال بالدعم.",
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function executeReject() {
    const applicationId = rejectTarget?.id;
    if (!applicationId) return;
    const rejectedApplicationName = rejectTarget?.childFullName || "الطلب";
    setRejectTarget(null);

    try {
      setProcessingId(applicationId);
      setActionNotice(null);
      await rejectApplication(applicationId);
      removeApplicationFromList(applicationId);
      setActionNotice({
        tone: "info",
        message: `تم رفض ${rejectedApplicationName} وإزالته من قائمة الانتظار.`,
      });
      addToast("تم رفض الطلب وحذفه من النظام", "info");
    } catch (error) {
      console.error(error);
      setErrorAlert({
        title: "فشل رفض الطلب",
        message: "حدث خطأ غير متوقع أثناء رفض الطلب. يرجى التحقق من الاتصال بالشبكة.",
      });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <section className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
      {actionNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-4 z-[90] w-[min(92vw,460px)] -translate-x-1/2 rounded-3xl border px-5 py-3 text-center text-sm font-black shadow-2xl backdrop-blur-xl ${
            actionNotice.tone === "success"
              ? "border-emerald-100 bg-emerald-50/95 text-emerald-800"
              : "border-blue-100 bg-blue-50/95 text-blue-800"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{actionNotice.message}</span>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 bg-gradient-to-l from-slate-900 to-slate-700 bg-clip-text text-transparent">
            طلبات الكفالة الجديدة
          </h2>
          <p className="mt-1 text-xs font-bold text-slate-500">
            الطلبات الإنسانية القادمة من البوابة العامة بانتظار الاعتماد كسجلات رسمية.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-2 text-xs font-black text-blue-700 shadow-sm animate-pulse">
          {applications.length} طلب بانتظار المراجعة
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-sm animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-3 w-1/3">
                  <div className="h-5 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg w-3/4" />
                  <div className="h-4 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg w-1/2" />
                </div>
                <div className="h-8 bg-slate-200/60 dark:bg-slate-700/60 rounded-xl w-24" />
              </div>
              <div className="mt-4 h-20 bg-slate-200/40 dark:bg-slate-700/40 rounded-2xl w-full" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-3xl border border-slate-100/50 bg-white/30 p-12 text-center text-sm font-bold text-slate-400">
          لا توجد طلبات كفالة جديدة حاليًا في الانتظار.
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-sm transition-all hover:bg-white/70 hover:shadow-md"
            >
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_auto] lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{application.childFullName}</h3>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black ${
                      application.sponsorshipStatus === "مكفول"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {application.sponsorshipStatus}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-x-4 gap-y-2 text-xs font-bold text-slate-600 md:grid-cols-2">
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />تاريخ الميلاد: {application.birthDate || "-"}</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />الجنس: {application.gender}</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />حالة اليتيم: {application.orphanType}</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />المحافظة: {application.governorateCity || "-"}</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />الوصي: {application.guardianName || "-"} ({application.guardianRelation || "-"})</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />الجوال: {application.guardianPhone || "-"}</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />تاريخ الإرسال: {formatDate(application.createdAt)}</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />حالة المستندات: {application.documentsStatus || "غير مدقق"}</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />حساب الاستلام: {application.transferAccountName || "-"}</span>
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />جوال الحساب: {application.transferAccountNumber || "-"}</span>
                    {application.sponsorshipStatus === "مكفول" && (
                      <span className="flex items-center gap-1.5 md:col-span-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />اسم الكفيل: {application.sponsorName || "-"}</span>
                    )}
                    {application.notes?.trim() && (
                      <span className="flex items-start gap-1.5 md:col-span-2 leading-6"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />ملاحظات: {application.notes}</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/40 rounded-2xl p-4 border border-slate-100/50">
                  <div className="mb-3 flex items-center gap-2 text-xs font-black text-slate-800">
                    <FileText className="h-4 w-4 text-blue-500" />
                    المستندات والأوراق الثبوتية
                  </div>
                  {application.documents.length === 0 ? (
                    <p className="text-xs font-bold text-rose-500">لا توجد ملفات مرفقة بهذا الطلب.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {application.documents.map((document) => (
                        <DocumentButton key={document.path} document={document} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 lg:flex-col justify-end h-full">
                  <button
                    type="button"
                    className="primary-btn justify-center py-2.5 px-5 text-xs shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={processingId === application.id}
                    onClick={() => setApproveTarget(application)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {processingId === application.id ? "جارٍ الاعتماد..." : "اعتماد الطلب"}
                  </button>
                  <button
                    type="button"
                    className="danger-btn justify-center py-2.5 px-5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={processingId === application.id}
                    onClick={() => setRejectTarget(application)}
                  >
                    <XCircle className="h-4 w-4" />
                    {processingId === application.id ? "جارٍ التنفيذ..." : "رفض الطلب"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={approveTarget !== null}
        title="تأكيد اعتماد الطلب"
        message={`هل أنت متأكد من اعتماد طلب الطفل "${approveTarget?.childFullName}"؟ سيتم إدراجه تلقائياً كيتيم رسمي في شؤون الأبناء.`}
        confirmText="نعم، اعتماد السجل"
        cancelText="تراجع"
        tone="success"
        onConfirm={executeApprove}
        onCancel={() => setApproveTarget(null)}
      />

      <ConfirmDialog
        isOpen={rejectTarget !== null}
        title="تأكيد رفض الطلب"
        message={`هل أنت متأكد من رفض طلب الطفل "${rejectTarget?.childFullName}"؟ سيتم حذف الطلب نهائياً ولا يمكن استعادته.`}
        confirmText="نعم، رفض الطلب"
        cancelText="تراجع"
        tone="danger"
        onConfirm={executeReject}
        onCancel={() => setRejectTarget(null)}
      />

      <ConfirmDialog
        isOpen={errorAlert !== null}
        title={errorAlert?.title || "تنبيه"}
        message={errorAlert?.message || ""}
        confirmText="حسناً"
        cancelText="إغلاق"
        tone="warning"
        onConfirm={() => setErrorAlert(null)}
        onCancel={() => setErrorAlert(null)}
      />
    </section>
  );
}
