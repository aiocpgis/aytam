export type Gender = "ذكر" | "أنثى" | "غير محدد";

export type OrphanType = "يتيم الأب" | "يتيم الأم" | "يتيم الأبوين" | "غير محدد";

export type SponsorshipStatus = "غير مكفول" | "بانتظار كافل" | "مكفول" | "متوقف";

export type FileStatus = "جديد" | "جديد بانتظار المراجعة" | "قيد المراجعة" | "مقبول" | "مرفوض" | "مكتمل";

export type Currency = "شيكل" | "دولار" | "دينار" | "غير محدد";

export interface UploadedDocument {
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface OrphanRecord {
  id?: string;
  childFullName: string;
  birthDate: string;
  sponsorName: string;
  sponsorshipAmount: number | null;
  sponsorPhone: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  orphanType: OrphanType;
  address: string;
  transferAccountName: string;
  transferAccountNumber: string;
  documentsStatus: string;
  governorateCity: string;
  gender: Gender;
  sponsorshipStatus: SponsorshipStatus;
  fileStatus: FileStatus;
  currency: Currency;
  documents: UploadedDocument[];
  source: "public_form" | "admin_form" | "excel_import";
  notes?: string;
  photo_path?: string | null;
  photo_uploaded_at?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrphanFormValues {
  childFullName: string;
  birthDate: string;
  sponsorName: string;
  sponsorshipAmount: string;
  sponsorPhone: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  orphanType: OrphanType;
  address: string;
  transferAccountName: string;
  transferAccountNumber: string;
  documentsStatus: string;
  governorateCity: string;
  gender: Gender;
  sponsorshipStatus: SponsorshipStatus;
  fileStatus: FileStatus;
  currency: Currency;
}

export interface ExcelOrphanRow {
  "اسم الطفل رباعي"?: string;
  "تاريخ الميلاد"?: string | number | Date;
  "الكفيل"?: string;
  "قيمة الكفالة"?: number | string;
  "رقم جوال الكفيل"?: string | number;
  "الوصي عليه"?: string;
  "نوع القرابة"?: string;
  "رقم جوال الوصي"?: string | number;
  "حالة اليتيم"?: string;
  "مكان السكن"?: string;
  "اسم صاحب الحساب للتحويل"?: string;
  "حساب التحويل"?: string | number;
  "الاوراق الثبوتية"?: string;
  "المحافظة / المدينة"?: string;
  "الجنس"?: string;
  "حالة الكفالة"?: string;
  "حالة الملف"?: string;
  "العملة"?: string;
}
