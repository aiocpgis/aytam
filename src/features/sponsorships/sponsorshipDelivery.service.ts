import { supabase } from "../../lib/supabase";
import { logActivity } from "../audit/activityLog.service";

const SPONSORSHIP_DELIVERIES_TABLE = "sponsorship_deliveries";

export type SponsorshipDeliveryRecord = {
  id?: string;
  orphanId: string;
  periodMonth: string;
  sponsorshipReceived: boolean;
  receivedAt: string | null;
  deliveredToGuardian: boolean;
  deliveredAt: string | null;
  sponsorshipAmount: number | null;
  currency: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
};

type DbSponsorshipDeliveryRecord = {
  id?: string;
  orphan_id?: string;
  period_month?: string;
  sponsorship_received?: boolean;
  received_at?: string | null;
  delivered_to_guardian?: boolean;
  delivered_at?: string | null;
  sponsorship_amount?: number | null;
  currency?: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type UpsertSponsorshipDeliveryInput = Omit<SponsorshipDeliveryRecord, "id" | "createdAt" | "updatedAt">;

function normalizePeriodMonth(value: string) {
  if (!value) return new Date().toISOString().slice(0, 7) + "-01";
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value.slice(0, 7)}-01`;
  return new Date().toISOString().slice(0, 7) + "-01";
}

export function toMonthInputValue(value: string) {
  if (!value) return new Date().toISOString().slice(0, 7);
  return value.slice(0, 7);
}

function fromDbRecord(record: DbSponsorshipDeliveryRecord): SponsorshipDeliveryRecord {
  return {
    id: record.id,
    orphanId: record.orphan_id ?? "",
    periodMonth: record.period_month ?? "",
    sponsorshipReceived: record.sponsorship_received ?? false,
    receivedAt: record.received_at ?? null,
    deliveredToGuardian: record.delivered_to_guardian ?? false,
    deliveredAt: record.delivered_at ?? null,
    sponsorshipAmount: record.sponsorship_amount ?? null,
    currency: record.currency ?? "غير محدد",
    notes: record.notes ?? "",
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function toDbRecord(record: UpsertSponsorshipDeliveryInput): DbSponsorshipDeliveryRecord {
  return {
    orphan_id: record.orphanId,
    period_month: normalizePeriodMonth(record.periodMonth),
    sponsorship_received: record.sponsorshipReceived,
    received_at: record.sponsorshipReceived ? record.receivedAt : null,
    delivered_to_guardian: record.deliveredToGuardian,
    delivered_at: record.deliveredToGuardian ? record.deliveredAt : null,
    sponsorship_amount: record.sponsorshipAmount,
    currency: record.currency || "غير محدد",
    notes: record.notes.trim(),
  };
}

export async function fetchSponsorshipDeliveries(periodMonth: string) {
  const { data, error } = await supabase
    .from(SPONSORSHIP_DELIVERIES_TABLE)
    .select("*")
    .eq("period_month", normalizePeriodMonth(periodMonth))
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((item) => fromDbRecord(item as DbSponsorshipDeliveryRecord));
}

export async function upsertSponsorshipDelivery(record: UpsertSponsorshipDeliveryInput) {
  const { data, error } = await supabase
    .from(SPONSORSHIP_DELIVERIES_TABLE)
    .upsert(toDbRecord(record), { onConflict: "orphan_id,period_month" })
    .select("*")
    .single();

  if (error) throw error;

  const savedRecord = fromDbRecord(data as DbSponsorshipDeliveryRecord);
  await logActivity("UPSERT_SPONSORSHIP_DELIVERY", SPONSORSHIP_DELIVERIES_TABLE, savedRecord.id, {
    orphanId: record.orphanId,
    periodMonth: normalizePeriodMonth(record.periodMonth),
    sponsorshipReceived: record.sponsorshipReceived,
    deliveredToGuardian: record.deliveredToGuardian,
    sponsorshipAmount: record.sponsorshipAmount,
    currency: record.currency,
  });

  return savedRecord;
}
