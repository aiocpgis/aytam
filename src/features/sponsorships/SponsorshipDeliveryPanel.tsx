import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Filter,
  HandCoins,
  Loader2,
  PackageCheck,
  Save,
  StickyNote,
} from "lucide-react";
import type { OrphanRecord } from "../../types/orphan.types";
import {
  fetchSponsorshipDeliveries,
  toMonthInputValue,
  upsertSponsorshipDelivery,
  type SponsorshipDeliveryRecord,
} from "./sponsorshipDelivery.service";

type DeliveryDraft = {
  sponsorshipReceived: boolean;
  receivedAt: string;
  deliveredToGuardian: boolean;
  deliveredAt: string;
  notes: string;
};

type DeliveryFilter = "all" | "not_received" | "received_not_delivered" | "delivered" | "with_notes";

type RowSaveState = {
  status: "saving" | "saved" | "error";
  message: string;
};

interface SponsorshipDeliveryPanelProps {
  records: OrphanRecord[];
}

function currentMonthInputValue() {
  return new Date().toISOString().slice(0, 7);
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function deliveryToDraft(delivery?: SponsorshipDeliveryRecord): DeliveryDraft {
  return {
    sponsorshipReceived: delivery?.sponsorshipReceived ?? false,
    receivedAt: delivery?.receivedAt ?? "",
    deliveredToGuardian: delivery?.deliveredToGuardian ?? false,
    deliveredAt: delivery?.deliveredAt ?? "",
    notes: delivery?.notes ?? "",
  };
}

function formatAmount(value: number | null, currency: string) {
  if (value === null || Number.isNaN(Number(value))) return "-";
  return `${value} ${currency === "غير محدد" ? "" : currency}`.trim();
}

function getDraftStatus(draft: DeliveryDraft) {
  if (draft.deliveredToGuardian) {
    return {
      label: "تم التسليم",
      className: "border-blue-100 bg-blue-50 text-blue-700",
      icon: <PackageCheck className="h-4 w-4" />,
    };
  }

  if (draft.sponsorshipReceived) {
    return {
      label: "وصلت ولم تُسلّم",
      className: "border-amber-100 bg-amber-50 text-amber-700",
      icon: <Clock3 className="h-4 w-4" />,
    };
  }

  return {
    label: "لم تصل",
    className: "border-slate-100 bg-slate-50 text-slate-600",
    icon: <CircleAlert className="h-4 w-4" />,
  };
}

function matchesFilter(draft: DeliveryDraft, filter: DeliveryFilter) {
  if (filter === "all") return true;
  if (filter === "not_received") return !draft.sponsorshipReceived;
  if (filter === "received_not_delivered") return draft.sponsorshipReceived && !draft.deliveredToGuardian;
  if (filter === "delivered") return draft.deliveredToGuardian;
  if (filter === "with_notes") return draft.notes.trim().length > 0;
  return true;
}

export function SponsorshipDeliveryPanel({ records }: SponsorshipDeliveryPanelProps) {
  const [periodMonth, setPeriodMonth] = useState(currentMonthInputValue());
  const [deliveries, setDeliveries] = useState<SponsorshipDeliveryRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DeliveryDraft>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rowSaveStates, setRowSaveStates] = useState<Record<string, RowSaveState>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DeliveryFilter>("all");
  const [errorText, setErrorText] = useState<string | null>(null);

  const sponsoredRecords = useMemo(
    () =>
      records
        .filter((record) => record.sponsorshipStatus === "مكفول")
        .sort((a, b) => a.childFullName.localeCompare(b.childFullName, "ar")),
    [records]
  );

  useEffect(() => {
    let isActive = true;

    async function loadDeliveries() {
      try {
        setIsLoading(true);
        setErrorText(null);
        setBulkMessage(null);
        const monthlyDeliveries = await fetchSponsorshipDeliveries(periodMonth);
        if (!isActive) return;
        setDeliveries(monthlyDeliveries);
      } catch (error) {
        console.error(error);
        if (isActive) {
          setErrorText("تعذر تحميل متابعة الكفالات لهذا الشهر. تأكد من تشغيل SQL الخاص بالميزة.");
          setDeliveries([]);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    void loadDeliveries();

    return () => {
      isActive = false;
    };
  }, [periodMonth]);

  useEffect(() => {
    const deliveryMap = new Map(deliveries.map((delivery) => [delivery.orphanId, delivery]));
    const nextDrafts: Record<string, DeliveryDraft> = {};

    sponsoredRecords.forEach((record) => {
      if (!record.id) return;
      nextDrafts[record.id] = deliveryToDraft(deliveryMap.get(record.id));
    });

    setDrafts(nextDrafts);
  }, [deliveries, sponsoredRecords]);

  function updateDraft(orphanId: string | undefined, patch: Partial<DeliveryDraft>) {
    if (!orphanId) return;

    setDrafts((current) => ({
      ...current,
      [orphanId]: {
        ...deliveryToDraft(),
        ...current[orphanId],
        ...patch,
      },
    }));

    setRowSaveStates((current) => {
      const next = { ...current };
      delete next[orphanId];
      return next;
    });
    setBulkMessage(null);
  }

  function mergeSavedDelivery(saved: SponsorshipDeliveryRecord) {
    setDeliveries((current) => {
      const withoutCurrent = current.filter((item) => item.orphanId !== saved.orphanId);
      return [saved, ...withoutCurrent];
    });
  }

  async function persistDelivery(record: OrphanRecord) {
    if (!record.id) throw new Error("Orphan ID is missing.");
    const draft = drafts[record.id] ?? deliveryToDraft();

    return upsertSponsorshipDelivery({
      orphanId: record.id,
      periodMonth,
      sponsorshipReceived: draft.sponsorshipReceived,
      receivedAt: draft.sponsorshipReceived ? draft.receivedAt || todayInputValue() : null,
      deliveredToGuardian: draft.deliveredToGuardian,
      deliveredAt: draft.deliveredToGuardian ? draft.deliveredAt || todayInputValue() : null,
      notes: draft.notes,
    });
  }

  async function saveDelivery(record: OrphanRecord) {
    if (!record.id) return;

    try {
      setRowSaveStates((current) => ({
        ...current,
        [record.id as string]: { status: "saving", message: "جارٍ الحفظ..." },
      }));
      const saved = await persistDelivery(record);
      mergeSavedDelivery(saved);
      setRowSaveStates((current) => ({
        ...current,
        [record.id as string]: { status: "saved", message: "تم حفظ المتابعة" },
      }));
    } catch (error) {
      console.error(error);
      setRowSaveStates((current) => ({
        ...current,
        [record.id as string]: { status: "error", message: "فشل الحفظ" },
      }));
    }
  }

  const filteredRecords = useMemo(
    () => sponsoredRecords.filter((record) => matchesFilter(drafts[record.id ?? ""] ?? deliveryToDraft(), statusFilter)),
    [drafts, sponsoredRecords, statusFilter]
  );

  async function saveAllVisible() {
    const recordsToSave = filteredRecords.filter((record) => Boolean(record.id));
    if (recordsToSave.length === 0) return;

    setIsSavingAll(true);
    setBulkMessage(null);

    let successCount = 0;
    let errorCount = 0;

    for (const record of recordsToSave) {
      if (!record.id) continue;
      try {
        setRowSaveStates((current) => ({
          ...current,
          [record.id as string]: { status: "saving", message: "جارٍ الحفظ..." },
        }));
        const saved = await persistDelivery(record);
        mergeSavedDelivery(saved);
        successCount += 1;
        setRowSaveStates((current) => ({
          ...current,
          [record.id as string]: { status: "saved", message: "تم الحفظ" },
        }));
      } catch (error) {
        console.error(error);
        errorCount += 1;
        setRowSaveStates((current) => ({
          ...current,
          [record.id as string]: { status: "error", message: "فشل الحفظ" },
        }));
      }
    }

    setBulkMessage(errorCount > 0 ? `تم حفظ ${successCount} وتعذر حفظ ${errorCount}.` : `تم حفظ ${successCount} سجل بنجاح.`);
    setIsSavingAll(false);
  }

  const stats = useMemo(() => {
    const draftValues = Object.values(drafts);
    const received = draftValues.filter((draft) => draft.sponsorshipReceived).length;
    const delivered = draftValues.filter((draft) => draft.deliveredToGuardian).length;
    const waitingDelivery = draftValues.filter((draft) => draft.sponsorshipReceived && !draft.deliveredToGuardian).length;
    return { total: sponsoredRecords.length, received, delivered, waitingDelivery };
  }, [drafts, sponsoredRecords.length]);

  const filterOptions: Array<{ value: DeliveryFilter; label: string; count: number }> = [
    { value: "all", label: "الكل", count: sponsoredRecords.length },
    { value: "not_received", label: "لم تصل", count: Object.values(drafts).filter((draft) => !draft.sponsorshipReceived).length },
    { value: "received_not_delivered", label: "وصلت ولم تُسلّم", count: stats.waitingDelivery },
    { value: "delivered", label: "تم التسليم", count: stats.delivered },
    { value: "with_notes", label: "لديه ملاحظات", count: Object.values(drafts).filter((draft) => draft.notes.trim().length > 0).length },
  ];

  return (
    <section className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm">
            <HandCoins className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">متابعة الكفالات</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">
              متابعة وصول الكفالة وتسليمها للوصي شهريًا مع ملاحظات واضحة لكل طفل.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-[210px]">
            <span className="mb-2 block text-xs font-black text-slate-700">الشهر</span>
            <div className="relative">
              <input
                className="glass-input pr-10"
                type="month"
                value={toMonthInputValue(periodMonth)}
                onChange={(event) => setPeriodMonth(event.target.value)}
              />
              <CalendarDays className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </label>

          <button
            type="button"
            className="primary-btn h-[46px] justify-center px-5 text-xs font-black shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void saveAllVisible()}
            disabled={isSavingAll || filteredRecords.length === 0 || isLoading}
          >
            {isSavingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSavingAll ? "جارٍ حفظ الكل..." : `حفظ كل المعروض (${filteredRecords.length})`}
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-center shadow-sm">
          <div className="text-lg font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] font-bold text-slate-500">طفل مكفول</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-center shadow-sm">
          <div className="text-lg font-black text-emerald-700">{stats.received}</div>
          <div className="text-[11px] font-bold text-emerald-700">وصلت الكفالة</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-center shadow-sm">
          <div className="text-lg font-black text-amber-700">{stats.waitingDelivery}</div>
          <div className="text-[11px] font-bold text-amber-700">وصلت ولم تُسلّم</div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-center shadow-sm">
          <div className="text-lg font-black text-blue-700">{stats.delivered}</div>
          <div className="text-[11px] font-bold text-blue-700">تم التسليم</div>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-white/70 bg-white/55 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-black text-slate-700">
          <Filter className="h-4 w-4 text-slate-400" />
          فلاتر الحالة
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-2xl border px-4 py-2 text-xs font-black transition ${
                statusFilter === option.value
                  ? "border-slate-900 bg-slate-900 text-white shadow-md"
                  : "border-slate-100 bg-white/70 text-slate-600 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {option.label}
              <span className={`mr-2 rounded-full px-2 py-0.5 text-[10px] ${statusFilter === option.value ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {bulkMessage && (
        <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
          {bulkMessage}
        </div>
      )}

      {errorText && (
        <div className="mb-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-black text-rose-700">
          {errorText}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl border border-white/70 bg-white/50 p-8 text-center text-sm font-black text-slate-500">
          جارٍ تحميل متابعة الكفالات...
        </div>
      ) : sponsoredRecords.length === 0 ? (
        <div className="rounded-3xl border border-slate-100/50 bg-white/30 p-12 text-center text-sm font-bold text-slate-400">
          لا توجد سجلات بحالة مكفول حاليًا.
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-3xl border border-slate-100/50 bg-white/30 p-12 text-center text-sm font-bold text-slate-400">
          لا توجد نتائج ضمن هذا الفلتر.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRecords.map((record) => {
            const orphanId = record.id;
            const draft = orphanId ? drafts[orphanId] ?? deliveryToDraft() : deliveryToDraft();
            const rowSaveState = orphanId ? rowSaveStates[orphanId] : undefined;
            const status = getDraftStatus(draft);

            return (
              <article key={orphanId ?? record.childFullName} className="rounded-3xl border border-white/70 bg-white/65 p-5 shadow-sm transition hover:bg-white/80 hover:shadow-md">
                <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{record.childFullName}</h3>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <div className="grid gap-x-5 gap-y-1 text-xs font-bold text-slate-500 md:grid-cols-3">
                      <span>الكفيل: <b className="text-slate-800">{record.sponsorName || "-"}</b></span>
                      <span>القيمة: <b className="text-slate-800">{formatAmount(record.sponsorshipAmount, record.currency)}</b></span>
                      <span>الوصي: <b className="text-slate-800">{record.guardianName || "-"}</b></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="primary-btn justify-center px-5 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => void saveDelivery(record)}
                    disabled={!orphanId || rowSaveState?.status === "saving" || isSavingAll}
                  >
                    {rowSaveState?.status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    حفظ هذا السجل
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <label className="mb-3 flex items-center gap-2 text-xs font-black text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.sponsorshipReceived}
                        onChange={(event) => {
                          updateDraft(orphanId, {
                            sponsorshipReceived: event.target.checked,
                            receivedAt: event.target.checked ? draft.receivedAt || todayInputValue() : "",
                          });
                        }}
                        disabled={!orphanId}
                      />
                      وصلت الكفالة
                    </label>
                    <span className="mb-2 block text-[11px] font-black text-slate-500">تاريخ الوصول</span>
                    <input
                      className="glass-input h-10 text-xs"
                      type="date"
                      value={draft.receivedAt}
                      onChange={(event) => updateDraft(orphanId, { receivedAt: event.target.value })}
                      disabled={!draft.sponsorshipReceived || !orphanId}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <label className="mb-3 flex items-center gap-2 text-xs font-black text-slate-700">
                      <input
                        type="checkbox"
                        checked={draft.deliveredToGuardian}
                        onChange={(event) => {
                          updateDraft(orphanId, {
                            deliveredToGuardian: event.target.checked,
                            deliveredAt: event.target.checked ? draft.deliveredAt || todayInputValue() : "",
                          });
                        }}
                        disabled={!orphanId}
                      />
                      تم التسليم
                    </label>
                    <span className="mb-2 block text-[11px] font-black text-slate-500">تاريخ التسليم</span>
                    <input
                      className="glass-input h-10 text-xs"
                      type="date"
                      value={draft.deliveredAt}
                      onChange={(event) => updateDraft(orphanId, { deliveredAt: event.target.value })}
                      disabled={!draft.deliveredToGuardian || !orphanId}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-black text-slate-500">
                      <StickyNote className="h-4 w-4" />
                      ملاحظات
                    </div>
                    <textarea
                      className="glass-input min-h-[120px] resize-y text-xs leading-6"
                      value={draft.notes}
                      onChange={(event) => updateDraft(orphanId, { notes: event.target.value })}
                      placeholder="اكتب ملاحظات التسليم أو التأخير أو أي تفاصيل مهمة..."
                      disabled={!orphanId}
                    />
                  </div>
                </div>

                {rowSaveState && rowSaveState.status !== "saving" && (
                  <div className={`mt-4 flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-black ${rowSaveState.status === "saved" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
                    {rowSaveState.status === "saved" && <CheckCircle2 className="h-4 w-4" />}
                    {rowSaveState.message}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
