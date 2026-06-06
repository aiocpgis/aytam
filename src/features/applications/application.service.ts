import { supabase } from "../../lib/supabase";
import type { OrphanRecord, UploadedDocument } from "../../types/orphan.types";

const APPLICATIONS_TABLE = "orphan_applications";
const DOCUMENTS_BUCKET = "orphan-documents";

type PublicApplicationRecord = Omit<
  OrphanRecord,
  "id" | "createdAt" | "updatedAt" | "source" | "documents" | "fileStatus"
>;

function getSafeFileName(fileName: string) {
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "file";
  const base = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-_]/g, "");

  return `${base || "document"}.${extension}`;
}

export async function uploadPublicDocuments(
  files: File[],
  folderId: string,
  onProgress?: (progress: number) => void
): Promise<UploadedDocument[]> {
  const uploaded: UploadedDocument[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    const filePath = `public-applications/${folderId}/${Date.now()}-${getSafeFileName(file.name)}`;

    const { error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    uploaded.push({
      name: file.name,
      url: "",
      path: filePath,
      type: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalFiles) * 100));
    }
  }

  return uploaded;
}

export async function createPublicApplication(
  record: PublicApplicationRecord,
  files: File[],
  onProgress?: (progress: number) => void
) {
  const folderId = crypto.randomUUID();
  const documents = await uploadPublicDocuments(files, folderId, onProgress);

  const { error } = await supabase
    .from(APPLICATIONS_TABLE)
    .insert({
      child_full_name: record.childFullName.trim(),
      birth_date: record.birthDate || null,
      sponsor_name: record.sponsorName.trim(),
      sponsorship_amount: record.sponsorshipAmount,
      sponsor_phone: record.sponsorPhone.trim(),
      guardian_name: record.guardianName.trim(),
      guardian_relation: record.guardianRelation.trim(),
      guardian_phone: record.guardianPhone.trim(),
      orphan_type: record.orphanType,
      address: record.address.trim(),
      transfer_account_name: record.transferAccountName.trim(),
      transfer_account_number: record.transferAccountNumber.trim(),
      documents_status: record.documentsStatus,
      governorate_city: record.governorateCity,
      gender: record.gender,
      sponsorship_status: record.sponsorshipStatus || "غير مكفول",
      file_status: "جديد بانتظار المراجعة",
      currency: record.currency,
      documents,
      notes: record.notes?.trim() ?? "",
      source: "public_form",
      storage_folder_id: folderId,
    });

  if (error) throw error;

  return folderId;
}
