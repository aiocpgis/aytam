import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, ShieldCheck } from "lucide-react";
import type { OrphanRecord } from "../../types/orphan.types";
import { normalizeArabicText } from "../../lib/utils";
import { fetchPendingApplications } from "../applications/applicationRequests.service";

type DuplicateFieldKey =
  | "childFullName"
  | "guardianPhone"
  | "guardianName"
  | "transferAccountNumber"
  | "sponsorName"
  | "sponsorPhone";

type DuplicateSource = "official" | "pending";

type DuplicateSearchResult = {
  record: OrphanRecord;
  source: DuplicateSource;
  matchedValue: string;
};

const duplicateFields: Array<{
  key: DuplicateFieldKey;
  label: string;
  placeholder: string;
  mode: "text" | "phone";
}> = [
  {
    key: "childFullName",
    label: "اسم الطفل",
    placeholder: "مثال: محمد أحمد محمود",
    mode: "text",
  },
  {
    key: "guardianPhone",
    label: "رقم جوال الوصي",
    placeholder: "مثال: 0590000000",
    mode: "phone",
  },
  {
    key: "guardianName",
    label: "اسم الوصي",
    placeholder: "مثال: أحمد محمود",
    mode: "text",
  },
  {
    key: "transferAccountNumber",
    label: "رقم جوال الحساب البنكي / التحويل",
    placeholder: "رقم الجوال المرتبط بالحساب",
    mode: "phone",
  },
  {
    key: "sponsorName",
    label: "اسم الكفيل",
    placeholder: "مثال: فاعل خير / اسم الكفيل",
    mode: "text",
  },
  {
    key: "sponsorPhone",
    label: "رقم جوال الكفيل",
    placeholder: "مثال: 0590000000",
    mode: "phone",
  },
];

function normalizePhone(value: string) {
  const arabicDigits: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };

  return value
    .replace(/[٠-٩]/g, (digit) => arabicDigits[digit] ?? digit)
    .replace(/[^0-9+]/g, "")
    .trim();
}

function getRecordValue(record: OrphanRecord, field: DuplicateFieldKey) {
  const value = record[field];
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ar");
}

function sourceLabel(source: DuplicateSource) {
  return source === "official" ? "سجل رسمي" : "طلب بانتظار المراجعة";
}

function sourceClassName(source: DuplicateSource) {
  return source === "official"
    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
    : "border-amber-100 bg-amber-50 text-amber-700";
}

function matchesField(value: string, query: string, mode: "text" | "phone") {
  if (!value.trim()) return false;

  if (mode === "phone") {
    const normalizedValue = normalizePhone(value);
    const normalizedQuery = normalizePhone(query);
    return normalizedQuery.length >= 4 && normalizedValue.includes(normalizedQuery);
  }

  const normalizedValue = normalizeArabicText(value);
  const normalizedQuery = normalizeArabicText(query);
  return normalizedQuery.length >= 2 && normalizedValue.includes(normalizedQuery);
}

interface DuplicateCheckPanelProps {
  officialRecords: OrphanRecord[];
}

export function DuplicateCheckPanel({ officialRecords }: DuplicateCheckPanelProps) {
  const [selectedField, setSelectedField] = useState<DuplicateFieldKey>("childFullName");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DuplicateSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const selectedFieldConfig = useMemo(
    () => duplicateFields.find((field) => field.key === selectedField) ?? duplicateFields[0],
    [selectedField]
  );

  async function executeSearch() {
    const cleanQuery = query.trim();
    setHasSearched(true);
    setErrorText(null);
    setResults([]);

    if (!cleanQuery) {
      setErrorText("اكتب قيمة للبحث قبل تشغيل الفحص.");
      return;
    }

    if (selectedFieldConfig.mode === "phone" && normalizePhone(cleanQuery).length < 4) {
      setErrorText("أدخل 4 أرقام على الأقل حتى يكون فحص الجوال مفيدًا.");
      return;
    }

    if (selectedFieldConfig.mode === "text" && normalizeArabicText(cleanQuery).length < 2) {
      setErrorText("أدخل حرفين على الأقل حتى يكون فحص الاسم مفيدًا.");
      return;
    }

    try {
      setIsSearching(true);
      const pendingApplications = await fetchPendingApplications();
      const combinedResults: DuplicateSearchResult[] = [
        ...officialRecords.map((record) => ({ record, source: "official" as const })),
        ...pendingApplications.map((record) => ({ record, source: "pending" as const })),
      ]
        .map((item) => ({
          ...item,
          matchedValue: getRecordValue(item.record, selectedField),
        }))
        .filter((item) => matchesField(item.matchedValue, cleanQuery, selectedFieldConfig.mode));

      setResults(combinedResults);
    } catch (error) {
      console.error(error);
      setErrorText("تعذر تشغيل فحص التكرار. تحقق من الاتصال أو صلاحيات قراءة الطلبات.");
    } finally {
      setIsSearching(false);
    }
  }

  const resultSummary = useMemo(() => {
    if (!hasSearched || errorText) return null;
    if (results.length === 0) return "لا توجد سجلات مطابقة حسب هذا الفحص.";
    if (results.length === 1) return "تم العثور على نتيجة واحدة مطابقة. راجعها قبل اعتبارها تكرارًا.";
    return `تم العثور على ${results.length} نتائج محتملة. راجعها قبل الاعتماد أو الإدخال.`;
  }, [errorText, hasSearched, results.length]);

  return (
    <section className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">فحص التكرار</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">
                افحص الأسماء والأرقام قبل اعتماد الطلبات أو إضافة سجلات جديدة.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white/60 px-4 py-2 text-xs font-black text-slate-600 shadow-sm">
          قراءة فقط — لا يغيّر البيانات
        </div>
      </div>

      <div className="rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700">قائمة فحص التكرار</span>
            <select
              className="glass-input appearance-none"
              value={selectedField}
              onChange={(event) => {
                setSelectedField(event.target.value as DuplicateFieldKey);
                setResults([]);
                setHasSearched(false);
                setErrorText(null);
              }}
            >
              {duplicateFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700">قيمة البحث</span>
            <div className="relative">
              <input
                className="glass-input pr-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void executeSearch();
                }}
                placeholder={selectedFieldConfig.placeholder}
                inputMode={selectedFieldConfig.mode === "phone" ? "tel" : "text"}
              />
              <Search className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </label>

          <button
            type="button"
            className="primary-btn h-[46px] justify-center px-6 text-xs font-black shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void executeSearch()}
            disabled={isSearching}
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {isSearching ? "جارٍ الفحص..." : "بحث"}
          </button>
        </div>

        {errorText && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-black text-rose-700">
            <AlertCircle className="h-4 w-4" />
            {errorText}
          </div>
        )}

        {resultSummary && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black ${
              results.length > 1
                ? "border-amber-100 bg-amber-50 text-amber-700"
                : "border-emerald-100 bg-emerald-50 text-emerald-700"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {resultSummary}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-5 grid gap-4">
          {results.map(({ record, source, matchedValue }, index) => (
            <article
              key={`${source}-${record.id ?? index}`}
              className="rounded-3xl border border-white/70 bg-white/60 p-5 shadow-sm transition hover:bg-white/75"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{record.childFullName || "اسم غير متوفر"}</h3>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${sourceClassName(source)}`}>
                      {sourceLabel(source)}
                    </span>
                    <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-600">
                      {record.sponsorshipStatus || "غير محدد"}
                    </span>
                  </div>

                  <div className="grid gap-x-4 gap-y-2 text-xs font-bold text-slate-600 md:grid-cols-2">
                    <span>القيمة المطابقة: <b className="text-slate-900">{matchedValue || "-"}</b></span>
                    <span>تاريخ الإضافة: {formatDate(record.createdAt)}</span>
                    <span>الوصي: {record.guardianName || "-"}</span>
                    <span>جوال الوصي: {record.guardianPhone || "-"}</span>
                    <span>حساب الاستلام: {record.transferAccountName || "-"}</span>
                    <span>جوال الحساب: {record.transferAccountNumber || "-"}</span>
                    <span>الكفيل: {record.sponsorName || "-"}</span>
                    <span>جوال الكفيل: {record.sponsorPhone || "-"}</span>
                    <span className="md:col-span-2">المحافظة / المدينة: {record.governorateCity || "-"}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
