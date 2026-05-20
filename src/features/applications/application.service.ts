import { supabase } from "../../lib/supabase";
import type { OrphanRecord, UploadedDocument } from "../../types/orphan.types";

const APPLICATIONS_TABLE = "orphan_applications";
const DOCUMENTS_BUCKET = "orphan-documents";

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
  record: Omit<OrphanRecord, "id" | "createdAt" | "updatedAt" | "source" | "documents" | "fileStatus" | "sponsorshipStatus">,
  files: File[],
  onProgress?: (progress: number) => void
) {
  const folderId = crypto.randomUUID();
  const documents = await uploadPublicDocuments(files, folderId, onProgress);

  const { data, error } = await supabase
    .from(APPLICATIONS_TABLE)
    .insert({
      child_full_name: record.childFullName,
      birth_date: record.birthDate || null,
      sponsor_name: record.sponsorName,
      sponsorship_amount: record.sponsorshipAmount,
      sponsor_phone: record.sponsorPhone,
      guardian_name: record.guardianName,
      guardian_relation: record.guardianRelation,
      guardian_phone: record.guardianPhone,
      orphan_type: record.orphanType,
      address: record.address,
      transfer_account_name: record.transferAccountName,
      transfer_account_number: record.transferAccountNumber,
      documents_status: record.documentsStatus,
      governorate_city: record.governorateCity,
      gender: record.gender,
      sponsorship_status: "بانتظار كافل",
      file_status: "جديد بانتظار المراجعة",
      currency: record.currency,
      documents,
      source: "public_form",
      storage_folder_id: folderId,
    });

  if (error) throw error;

  return folderId;
}
