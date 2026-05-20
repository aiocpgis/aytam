import type {
  Currency,
  ExcelOrphanRow,
  FileStatus,
  Gender,
  OrphanFormValues,
  OrphanRecord,
  OrphanType,
  SponsorshipStatus,
} from "../../types/orphan.types";
import { toDateInputValue } from "../../lib/utils";

function clean(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function mapGender(value: unknown): Gender {
  const text = clean(value);
  if (text === "ذكر" || text === "أنثى") return text;
  return "غير محدد";
}

function mapOrphanType(value: unknown): OrphanType {
  const text = clean(value).replace("الاب", "الأب");
  if (text === "يتيم الأب" || text === "يتيم الأم" || text === "يتيم الأبوين") return text;
  return "غير محدد";
}

function mapSponsorshipStatus(value: unknown): SponsorshipStatus {
  const text = clean(value);
  if (text === "مكفول" || text === "متوقف") return text;
  return "بانتظار كافل";
}

function mapFileStatus(value: unknown): FileStatus {
  const text = clean(value);
  if (["جديد", "جديد بانتظار المراجعة", "قيد المراجعة", "مقبول", "مرفوض", "مكتمل"].includes(text)) {
    return text as FileStatus;
  }
  return "جديد";
}

function mapCurrency(value: unknown): Currency {
  const text = clean(value);
  if (text === "شيكل" || text === "دولار" || text === "دينار") return text;
  return "غير محدد";
}

export function formValuesToOrphanRecord(values: OrphanFormValues): Omit<OrphanRecord, "id" | "createdAt" | "updatedAt"> {
  return {
    childFullName: values.childFullName.trim(),
    birthDate: values.birthDate,
    sponsorName: values.sponsorName.trim(),
    sponsorshipAmount: numberOrNull(values.sponsorshipAmount),
    sponsorPhone: values.sponsorPhone.trim(),
    guardianName: values.guardianName.trim(),
    guardianRelation: values.guardianRelation.trim(),
    guardianPhone: values.guardianPhone.trim(),
    orphanType: values.orphanType,
    address: values.address.trim(),
    transferAccountName: values.transferAccountName.trim(),
    transferAccountNumber: values.transferAccountNumber.trim(),
    documentsStatus: values.documentsStatus.trim(),
    governorateCity: values.governorateCity.trim(),
    gender: values.gender,
    sponsorshipStatus: values.sponsorshipStatus,
    fileStatus: values.fileStatus,
    currency: values.currency,
    documents: [],
    source: "admin_form",
  };
}

export function excelRowToOrphanRecord(row: ExcelOrphanRow): Omit<OrphanRecord, "id" | "createdAt" | "updatedAt"> {
  return {
    childFullName: clean(row["اسم الطفل رباعي"]),
    birthDate: toDateInputValue(row["تاريخ الميلاد"]),
    sponsorName: clean(row["الكفيل"]),
    sponsorshipAmount: numberOrNull(row["قيمة الكفالة"]),
    sponsorPhone: clean(row["رقم جوال الكفيل"]),
    guardianName: clean(row["الوصي عليه"]),
    guardianRelation: clean(row["نوع القرابة"]),
    guardianPhone: clean(row["رقم جوال الوصي"]),
    orphanType: mapOrphanType(row["حالة اليتيم"]),
    address: clean(row["مكان السكن"]),
    transferAccountName: clean(row["اسم صاحب الحساب للتحويل"]),
    transferAccountNumber: clean(row["حساب التحويل"]),
    documentsStatus: clean(row["الاوراق الثبوتية"]),
    governorateCity: clean(row["المحافظة / المدينة"]),
    gender: mapGender(row["الجنس"]),
    sponsorshipStatus: mapSponsorshipStatus(row["حالة الكفالة"]),
    fileStatus: mapFileStatus(row["حالة الملف"]),
    currency: mapCurrency(row["العملة"]),
    documents: [],
    source: "excel_import",
  };
}

export function defaultOrphanFormValues(): OrphanFormValues {
  return {
    childFullName: "",
    birthDate: "",
    sponsorName: "",
    sponsorshipAmount: "",
    sponsorPhone: "",
    guardianName: "",
    guardianRelation: "الأم",
    guardianPhone: "",
    orphanType: "يتيم الأب",
    address: "",
    transferAccountName: "",
    transferAccountNumber: "",
    documentsStatus: "",
    governorateCity: "",
    gender: "ذكر",
    sponsorshipStatus: "بانتظار كافل",
    fileStatus: "جديد",
    currency: "شيكل",
  };
}
