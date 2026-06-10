import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, HandCoins, Loader2, Save } from "lucide-react";
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

type SaveState = {
  orphanId: string;
  status: "saving" | "saved" | "error";
  message: string;
} | null;

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

export function SponsorshipDeliveryPanel({ records }: SponsorshipDeliveryPanelProps) {
  const [periodMonth, setPeriodMonth] = useState(currentMonthInputValue());
  const [deliveries, setDeliveries] = useState<SponsorshipDeliveryRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DeliveryDraft>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(null);
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
  }

  async function saveDelivery(record: OrphanRecord) {
    if (!record.id) return;
    const draft = drafts[record.id] ?? deliveryToDraft();

    try {
      setSaveState({ orphanId: record.id, status: "saving", message: "جارٍ الحفظ..." });
      const saved = await upsertSponsorshipDelivery({
        orphanId: record.id,
        periodMonth,
        sponsorshipReceived: draft.sponsorshipReceived,
        receivedAt: draft.sponsorshipReceived ? draft.receivedAt || todayInputValue() : null,
        deliveredToGuardian: draft.deliveredToGuardian,
        deliveredAt: draft.deliveredToGuardian ? draft.deliveredAt || todayInputValue() : null,
        notes: draft.notes,
      });

      setDeliveries((current) => {
        const withoutCurrent = current.filter((item) => item.orphanId !== saved.orphanId);
        return [saved, ...withoutCurrent];
      });
      setSaveState({ orphanId: record.id, status: "saved", message: "تم حفظ المتابعة" });
    } catch (error) {
      console.error(error);
      setSaveState({ orphanId: record.id, status: "error", message: "فشل الحفظ" });
    }
  }

  const stats = useMemo(() => {
    const draftValues = Object.values(drafts);
    const received = draftValues.filter((draft) => draft.sponsorshipReceived).length;
    const delivered = draftValues.filter((draft) => draft.deliveredToGuardian).length;
    return { total: sponsoredRecords.length, received, delivered };
  }, [drafts, sponsoredRecords.length]);

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
              متابعة وصول الكفالة وتسليمها للوصي شهريًا مع ملاحظات لكل طفل.
            </p>
          </div>
        </div>

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
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-3 text-center shadow-sm">
          <div className="text-lg font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] font-bold text-slate-500">طفل مكفول</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-center shadow-sm">
          <div className="text-lg font-black text-emerald-700">{stats.received}</div>
          <div className="text-[11px] font-bold text-emerald-700">وصلت الكفالة</div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-center shadow-sm">
          <div className="text-lg font-black text-blue-700">{stats.delivered}</div>
          <div className="text-[11px] font-bold text-blue-700">تم التسليم</div>
        </div>
      </div>

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
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/55 shadow-sm">
          <div className="hidden grid-cols-[1.25fr_1fr_0.8fr_1fr_1fr_1.2fr_auto] gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 text-[11px] font-black text-slate-500 lg:grid">
            <span>الاسم</span>
            <span>الكفيل</span>
            <span>القيمة</span>
            <span>وصول الكفالة</span>
            <span>التسليم</span>
            <span>ملاحظات</span>
            <span>حفظ</span>
          </div>

          <div className="divide-y divide-slate-100/70">
            {sponsoredRecords.map((record) => {
              const orphanId = record.id;
              const draft = orphanId ? drafts[orphanId] ?? deliveryToDraft() : deliveryToDraft();
              const rowSaveState = saveState?.orphanId === orphanId ? saveState : null;

              return (
                <div key={orphanId ?? record.childFullName} className="grid gap-4 px-4 py-4 text-xs font-bold text-slate-600 lg:grid-cols-[1.25fr_1fr_0.8fr_1fr_1fr_1.2fr_auto] lg:items-center">
                  <div>
                    <div className="text-sm font-black text-slate-900">{record.childFullName}</div>
                    <div className="mt-1 text-[11px] text-slate-400">الوصي: {record.guardianName || "-"}</div>
                  </div>

                  <div>
                    <span className="lg:hidden text-slate-400">الكفيل: </span>
                    {record.sponsorName || "-"}
                  </div>

                  <div>
                    <span className="lg:hidden text-slate-400">القيمة: </span>
                    {formatAmount(record.sponsorshipAmount, record.currency)}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
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
                      <span>وصلت</span>
                    </label>
                    <input
                      className="glass-input h-9 text-[11px]"
                      type="date"
                      value={draft.receivedAt}
                      onChange={(event) => updateDraft(orphanId, { receivedAt: event.target.value })}
                      disabled={!draft.sponsorshipReceived || !orphanId}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
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
                      <span>تم التسليم</span>
                    </label>
                    <input
                      className="glass-input h-9 text-[11px]"
                      type="date"
                      value={draft.deliveredAt}
                      onChange={(event) => updateDraft(orphanId, { deliveredAt: event.target.value })}
                      disabled={!draft.deliveredToGuardian || !orphanId}
                    />
                  </div>

                  <textarea
                    className="glass-input min-h-[74px] resize-y text-[11px]"
                    value={draft.notes}
                    onChange={(event) => updateDraft(orphanId, { notes: event.target.value })}
                    placeholder="ملاحظات التسليم أو التأخير..."
                    disabled={!orphanId}
                  />

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="primary-btn justify-center px-4 py-2 text-[11px] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => void saveDelivery(record)}
                      disabled={!orphanId || rowSaveState?.status === "saving"}
                    >
                      {rowSaveState?.status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      حفظ
                    </button>
                    {rowSaveState && rowSaveState.status !== "saving" && (
                      <span className={`text-center text-[10px] font-black ${rowSaveState.status === "saved" ? "text-emerald-600" : "text-rose-600"}`}>
                        {rowSaveState.status === "saved" && <CheckCircle2 className="mx-auto mb-1 h-3.5 w-3.5" />}
                        {rowSaveState.message}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
