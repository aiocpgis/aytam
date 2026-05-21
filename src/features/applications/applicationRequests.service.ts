import { supabase } from "../../lib/supabase";
import type { OrphanRecord, UploadedDocument } from "../../types/orphan.types";
import { logActivity } from "../audit/activityLog.service";

const APPLICATIONS_TABLE = "orphan_applications";
const ORPHANS_TABLE = "orphans";
const DOCUMENTS_BUCKET = "orphan-documents";

type DbApplicationRecord = {
  id?: string;
  child_full_name?: string;
  birth_date?: string | null;
  sponsor_name?: string;
  sponsorship_amount?: number | null;
  sponsor_phone?: string;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  orphan_type?: string;
  address?: string;
  transfer_account_name?: string;
  transfer_account_number?: string;
  documents_status?: string;
  governorate_city?: string;
  gender?: string;
  sponsorship_status?: string;
  file_status?: string;
  currency?: string;
  documents?: UploadedDocument[];
  source?: OrphanRecord["source"];
  storage_folder_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

function fromDbApplication(record: DbApplicationRecord): OrphanRecord {
  return {
    id: record.id,
    childFullName: record.child_full_name ?? "",
    birthDate: record.birth_date ?? "",
    sponsorName: record.sponsor_name ?? "",
    sponsorshipAmount: record.sponsorship_amount ?? null,
    sponsorPhone: record.sponsor_phone ?? "",
    guardianName: record.guardian_name ?? "",
    guardianRelation: record.guardian_relation ?? "",
    guardianPhone: record.guardian_phone ?? "",
    orphanType: (record.orphan_type ?? "غير محدد") as OrphanRecord["orphanType"],
    address: record.address ?? "",
    transferAccountName: record.transfer_account_name ?? "",
    transferAccountNumber: record.transfer_account_number ?? "",
    documentsStatus: record.documents_status ?? "",
    governorateCity: record.governorate_city ?? "",
    gender: (record.gender ?? "غير محدد") as OrphanRecord["gender"],
    sponsorshipStatus: (record.sponsorship_status ?? "بانتظار كافل") as OrphanRecord["sponsorshipStatus"],
    fileStatus: (record.file_status ?? "جديد بانتظار المراجعة") as OrphanRecord["fileStatus"],
    currency: (record.currency ?? "غير محدد") as OrphanRecord["currency"],
    documents: record.documents ?? [],
    source: record.source ?? "public_form",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function toDbOrphan(record: OrphanRecord) {
  return {
    child_full_name: record.childFullName,
    birth_date: record.birthDate || null,
    sponsor_name: record.sponsorName || "",
    sponsorship_amount: record.sponsorshipAmount,
    sponsor_phone: record.sponsorPhone || "",
    guardian_name: record.guardianName || "",
    guardian_relation: record.guardianRelation || "",
    guardian_phone: record.guardianPhone || "",
    orphan_type: record.orphanType || "غير محدد",
    address: record.address || "",
    transfer_account_name: record.transferAccountName || "",
    transfer_account_number: record.transferAccountNumber || "",
    documents_status: record.documentsStatus || "",
    governorate_city: record.governorateCity || "",
    gender: record.gender || "غير محدد",
    sponsorship_status: record.sponsorshipStatus || "بانتظار كافل",
    file_status: "مقبول",
    currency: record.currency || "غير محدد",
    documents: record.documents ?? [],
    source: "public_form",
  };
}

export async function fetchPendingApplications() {
  const { data, error } = await supabase
    .from(APPLICATIONS_TABLE)
    .select("*")
    .neq("file_status", "مقبول")
    .neq("file_status", "مرفوض")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((item) => fromDbApplication(item as DbApplicationRecord));
}

export function subscribeToPendingApplications(callback: (records: OrphanRecord[]) => void) {
  let isActive = true;

  fetchPendingApplications()
    .then((records) => {
      if (isActive) callback(records);
    })
    .catch((error) => {
      console.error("Failed to fetch pending applications", error);
      if (isActive) callback([]);
    });

  const channel = supabase
    .channel("orphan-applications-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: APPLICATIONS_TABLE },
      async () => {
        try {
          const records = await fetchPendingApplications();
          if (isActive) callback(records);
        } catch (error) {
          console.error("Failed to refresh pending applications", error);
        }
      }
    )
    .subscribe();

  return () => {
    isActive = false;
    void supabase.removeChannel(channel);
  };
}

export async function approveApplication(application: OrphanRecord) {
  if (!application.id) throw new Error("Application ID is missing.");

  const { error } = await supabase.rpc("approve_orphan_application_v1", {
    app_id: application.id,
    orphan_data: toDbOrphan(application)
  });

  if (error) throw error;

  await logActivity("APPROVE_APPLICATION", "orphan_applications", application.id, { childName: application.childFullName });
}

export async function rejectApplication(applicationId: string) {
  const { error } = await supabase
    .from(APPLICATIONS_TABLE)
    .update({ file_status: "مرفوض", updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) throw error;

  await logActivity("REJECT_APPLICATION", "orphan_applications", applicationId);
}

export async function createSignedDocumentUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 5);

  if (error) throw error;
  return data.signedUrl;
}
