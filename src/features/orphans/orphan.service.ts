import { supabase } from "../../lib/supabase";
import type { OrphanRecord } from "../../types/orphan.types";
import { logActivity } from "../audit/activityLog.service";

const ORPHANS_TABLE = "orphans";

type DbOrphanRecord = {
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
  documents?: OrphanRecord["documents"];
  notes?: string;
  source?: OrphanRecord["source"];
  created_at?: string;
  updated_at?: string;
};

function fromDbRecord(record: DbOrphanRecord): OrphanRecord {
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
    sponsorshipStatus: (record.sponsorship_status ?? "غير مكفول") as OrphanRecord["sponsorshipStatus"],
    fileStatus: (record.file_status ?? "جديد") as OrphanRecord["fileStatus"],
    currency: (record.currency ?? "غير محدد") as OrphanRecord["currency"],
    documents: record.documents ?? [],
    notes: record.notes ?? "",
    source: record.source ?? "admin_form",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function toDbRecord(record: Partial<Omit<OrphanRecord, "id" | "createdAt" | "updatedAt">>): DbOrphanRecord {
  const dbRecord: DbOrphanRecord = {};

  if (record.childFullName !== undefined) dbRecord.child_full_name = record.childFullName;
  if (record.birthDate !== undefined) dbRecord.birth_date = record.birthDate || null;
  if (record.sponsorName !== undefined) dbRecord.sponsor_name = record.sponsorName;
  if (record.sponsorshipAmount !== undefined) dbRecord.sponsorship_amount = record.sponsorshipAmount;
  if (record.sponsorPhone !== undefined) dbRecord.sponsor_phone = record.sponsorPhone;
  if (record.guardianName !== undefined) dbRecord.guardian_name = record.guardianName;
  if (record.guardianRelation !== undefined) dbRecord.guardian_relation = record.guardianRelation;
  if (record.guardianPhone !== undefined) dbRecord.guardian_phone = record.guardianPhone;
  if (record.orphanType !== undefined) dbRecord.orphan_type = record.orphanType;
  if (record.address !== undefined) dbRecord.address = record.address;
  if (record.transferAccountName !== undefined) dbRecord.transfer_account_name = record.transferAccountName;
  if (record.transferAccountNumber !== undefined) dbRecord.transfer_account_number = record.transferAccountNumber;
  if (record.documentsStatus !== undefined) dbRecord.documents_status = record.documentsStatus;
  if (record.governorateCity !== undefined) dbRecord.governorate_city = record.governorateCity;
  if (record.gender !== undefined) dbRecord.gender = record.gender;
  if (record.sponsorshipStatus !== undefined) dbRecord.sponsorship_status = record.sponsorshipStatus;
  if (record.fileStatus !== undefined) dbRecord.file_status = record.fileStatus;
  if (record.currency !== undefined) dbRecord.currency = record.currency;
  if (record.documents !== undefined) dbRecord.documents = record.documents;
  if (record.notes !== undefined) dbRecord.notes = record.notes;
  if (record.source !== undefined) dbRecord.source = record.source;

  return dbRecord;
}

export async function fetchAllOrphans() {
  const { data, error } = await supabase
    .from(ORPHANS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => fromDbRecord(item as DbOrphanRecord));
}

export function subscribeToOrphans(callback: (records: OrphanRecord[]) => void) {
  let isActive = true;

  fetchAllOrphans()
    .then((records) => {
      if (isActive) callback(records);
    })
    .catch((error) => {
      console.error("Failed to fetch orphans", error);
      if (isActive) callback([]);
    });

  const channel = supabase
    .channel("orphans-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: ORPHANS_TABLE },
      async () => {
        try {
          const records = await fetchAllOrphans();
          if (isActive) callback(records);
        } catch (error) {
          console.error("Failed to refresh orphans", error);
        }
      }
    )
    .subscribe();

  return () => {
    isActive = false;
    void supabase.removeChannel(channel);
  };
}

export async function createOrphan(record: Omit<OrphanRecord, "id" | "createdAt" | "updatedAt">) {
  const { data, error } = await supabase
    .from(ORPHANS_TABLE)
    .insert(toDbRecord(record))
    .select("id")
    .single();

  if (error) throw error;

  await logActivity("CREATE_ORPHAN", ORPHANS_TABLE, data.id, { childName: record.childFullName });

  return data.id as string;
}

export async function updateOrphan(id: string, record: Partial<Omit<OrphanRecord, "id" | "createdAt">>) {
  const { error } = await supabase
    .from(ORPHANS_TABLE)
    .update(toDbRecord(record))
    .eq("id", id);

  if (error) throw error;

  await logActivity("UPDATE_ORPHAN", ORPHANS_TABLE, id, record);
}

export async function deleteOrphan(id: string) {
  const { error } = await supabase.from(ORPHANS_TABLE).delete().eq("id", id);
  if (error) throw error;

  await logActivity("DELETE_ORPHAN", ORPHANS_TABLE, id);
}

export async function importOrphans(records: Array<Omit<OrphanRecord, "id" | "createdAt" | "updatedAt">>) {
  const validRecords = records.filter((record) => record.childFullName.trim().length > 0);

  for (let index = 0; index < validRecords.length; index += 500) {
    const chunk = validRecords.slice(index, index + 500).map(toDbRecord);
    const { error } = await supabase.from(ORPHANS_TABLE).insert(chunk);
    if (error) throw error;
  }

  await logActivity("IMPORT_ORPHANS", ORPHANS_TABLE, undefined, { count: validRecords.length });

  return validRecords.length;
}
