import { ChangeEvent, useState } from "react";
import { Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { importOrphans } from "../orphans/orphan.service";
import { parseOrphansExcel, type ExcelImportSummary } from "./excelImport.utils";

function ImportResult({ summary }: { summary: ExcelImportSummary }) {
  return (
    <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/80 p-4 text-sm font-bold text-blue-900">
      <p>تم استيراد {summary.importedRows} سجل بنجاح.</p>
      <div className="mt-2 grid gap-2 text-xs text-blue-800 sm:grid-cols-3">
        <span>إجمالي الصفوف: {summary.totalDataRows}</span>
        <span>صفوف فارغة متجاهلة: {summary.skippedBlankRows}</span>
        <span>صفوف غير صالحة/مكررة: {summary.skippedInvalidRows}</span>
      </div>

      {summary.warnings.length > 0 && (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-amber-800">
          {summary.warnings.slice(0, 5).map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ExcelImportPanel() {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<ExcelImportSummary | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setMessage("");
      setSummary(null);

      const buffer = await file.arrayBuffer();
      const parsed = parseOrphansExcel(buffer);

      if (parsed.records.length === 0) {
        setMessage("لم يتم العثور على سجلات صالحة للاستيراد. تأكد أن الملف يحتوي على أسماء أطفال.");
        return;
      }

      const importedCount = await importOrphans(parsed.records);

      setSummary({
        ...parsed.summary,
        importedRows: importedCount,
      });
      event.target.value = "";
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "فشل الاستيراد. تأكد أن أسماء الأعمدة مطابقة لقالب Excel.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">استيراد ملف الأيتام</h2>
          <p className="text-xs font-bold text-slate-500">
            ارفع ملف Excel وسيتم تنظيف الصفوف الفارغة وقراءة البيانات تلقائيًا.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs font-bold leading-6 text-emerald-900">
        <p>قبل الاستيراد: استخدم القالب المنظف أو تأكد أن الملف يحتوي على عمود "اسم الطفل رباعي".</p>
        <p>النظام يتجاهل الصفوف الفارغة ويمنع تكرار نفس الطفل إذا تكرر الاسم مع نفس رقم الوصي داخل نفس الملف.</p>
      </div>

      {message && (
        <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {message}
        </div>
      )}

      {summary && <ImportResult summary={summary} />}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a className="secondary-btn" href="/templates/orphans_cleaned_template.xlsx" download>
          <Download className="h-4 w-4" />
          تحميل القالب المنظف
        </a>

        <label className="primary-btn cursor-pointer">
          <UploadCloud className="h-4 w-4" />
          {isImporting ? "جاري الاستيراد..." : "اختيار ملف Excel واستيراده"}
          <input className="hidden" type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={isImporting} />
        </label>
      </div>
    </div>
  );
}
