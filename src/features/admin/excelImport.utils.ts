import * as XLSX from "xlsx";
import type { ExcelOrphanRow, OrphanRecord } from "../../types/orphan.types";
import { excelRowToOrphanRecord } from "../orphans/orphan.mapper";

type ImportableOrphan = Omit<OrphanRecord, "id" | "createdAt" | "updatedAt">;

export interface ExcelImportSummary {
  totalDataRows: number;
  importedRows: number;
  skippedBlankRows: number;
  skippedInvalidRows: number;
  warnings: string[];
}

export interface ParsedExcelImport {
  records: ImportableOrphan[];
  summary: ExcelImportSummary;
}

const REQUIRED_HEADER = "اسم الطفل رباعي";

const EXPECTED_HEADERS = [
  "اسم الطفل رباعي",
  "تاريخ الميلاد",
  "الكفيل",
  "دولة الكفيل",
  "قيمة الكفالة",
  "رقم جوال الكفيل",
  "الوصي عليه",
  "نوع القرابة",
  "رقم جوال الوصي",
  "حالة اليتيم",
  "مكان السكن",
  "اسم صاحب الحساب للتحويل",
  "حساب التحويل",
  "الاوراق الثبوتية",
  "المحافظة / المدينة",
  "الجنس",
  "حالة الكفالة",
  "حالة الملف",
  "العملة",
] as const;

const HEADER_ALIASES: Record<string, string> = {
  "الأوراق الثبوتية": "الاوراق الثبوتية",
  "اوراق ثبوتية": "الاوراق الثبوتية",
  "المحافظة": "المحافظة / المدينة",
  "المدينة": "المحافظة / المدينة",
  "مكان السكن / المحافظة": "المحافظة / المدينة",
  "اسم الوصي": "الوصي عليه",
  "الوصي": "الوصي عليه",
  "صلة القرابة": "نوع القرابة",
  "رقم الوصي": "رقم جوال الوصي",
  "جوال الوصي": "رقم جوال الوصي",
  "رقم الكفيل": "رقم جوال الكفيل",
  "جوال الكفيل": "رقم جوال الكفيل",
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparable(value: unknown) {
  return normalizeText(value)
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
}

function canonicalHeader(value: unknown) {
  const header = normalizeText(value);
  return HEADER_ALIASES[header] ?? header;
}

function isBlankRow(row: unknown[]) {
  return row.every((cell) => normalizeText(cell).length === 0);
}

function findHeaderRow(rows: unknown[][]) {
  const wanted = normalizeComparable(REQUIRED_HEADER);

  return rows.findIndex((row) =>
    row.some((cell) => normalizeComparable(cell) === wanted),
  );
}

function rowToObject(headers: string[], row: unknown[]): ExcelOrphanRow {
  const output: Record<string, string> = {};

  headers.forEach((header, index) => {
    if (!header) return;
    output[header] = normalizeText(row[index]);
  });

  return output as ExcelOrphanRow;
}

function uniqueByNameAndGuardianPhone(records: ImportableOrphan[], warnings: string[]) {
  const seen = new Set<string>();
  const uniqueRecords: ImportableOrphan[] = [];

  records.forEach((record) => {
    const key = `${normalizeComparable(record.childFullName)}__${normalizeComparable(record.guardianPhone)}`;

    if (seen.has(key)) {
      warnings.push(`تم تجاهل سجل مكرر للطفل: ${record.childFullName}`);
      return;
    }

    seen.add(key);
    uniqueRecords.push(record);
  });

  return uniqueRecords;
}

export function parseOrphansExcel(buffer: ArrayBuffer): ParsedExcelImport {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("ملف Excel لا يحتوي على أوراق عمل.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });

  const headerRowIndex = findHeaderRow(rows);

  if (headerRowIndex === -1) {
    throw new Error("لم يتم العثور على صف العناوين. تأكد من وجود عمود: اسم الطفل رباعي");
  }

  const rawHeaders = rows[headerRowIndex] ?? [];
  const headers = rawHeaders.map(canonicalHeader);
  const warnings: string[] = [];
  const missingHeaders = EXPECTED_HEADERS.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    warnings.push(`أعمدة غير موجودة وسيتم تعويضها بقيم فارغة: ${missingHeaders.join("، ")}`);
  }

  let skippedBlankRows = 0;
  let skippedInvalidRows = 0;
  const records: ImportableOrphan[] = [];
  const dataRows = rows.slice(headerRowIndex + 1);

  dataRows.forEach((row) => {
    if (isBlankRow(row)) {
      skippedBlankRows += 1;
      return;
    }

    const rowObject = rowToObject(headers, row);
    const record = excelRowToOrphanRecord(rowObject);

    if (!record.childFullName.trim()) {
      skippedInvalidRows += 1;
      return;
    }

    records.push(record);
  });

  const uniqueRecords = uniqueByNameAndGuardianPhone(records, warnings);

  return {
    records: uniqueRecords,
    summary: {
      totalDataRows: dataRows.length,
      importedRows: uniqueRecords.length,
      skippedBlankRows,
      skippedInvalidRows: skippedInvalidRows + (records.length - uniqueRecords.length),
      warnings,
    },
  };
}
