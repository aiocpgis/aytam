export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function normalizeArabicText(value: string) {
  return value
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function calculateAge(birthDate?: string) {
  if (!birthDate) return null;
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return age;
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

export function containsXss(value: string): boolean {
  if (/<[^>]*>/i.test(value)) return true;
  if (/javascript:/i.test(value)) return true;
  return false;
}

export function sanitizeInput(value: string): string {
  return stripHtml(value).trim();
}

export function toDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  
  // مطابقة صيغ DD/MM/YYYY أو DD-MM-YYYY
  const dmyRegex = /^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/;
  const match = text.match(dmyRegex);
  if (match) {
    const [_, day, month, year] = match;
    const paddedDay = day.padStart(2, "0");
    const paddedMonth = month.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return ""; // لا نرجع النص التالف لتفادي تعطل الخادم
}
