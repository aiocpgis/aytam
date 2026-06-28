import { supabase } from "../../lib/supabase";

export type FormFieldSetting = {
  required: boolean;
  hidden: boolean;
};

export type PublicFormSettings = {
  childFullName: FormFieldSetting;
  birthDate: FormFieldSetting;
  gender: FormFieldSetting;
  orphanType: FormFieldSetting;
  guardianName: FormFieldSetting;
  guardianRelation: FormFieldSetting;
  guardianPhone: FormFieldSetting;
  governorateCity: FormFieldSetting;
  address: FormFieldSetting;
  transferAccountName: FormFieldSetting;
  transferAccountNumber: FormFieldSetting;
  sponsorshipStatus: FormFieldSetting;
  sponsorName: FormFieldSetting;
  sponsorCountry: FormFieldSetting;
  notes: FormFieldSetting;
  files: FormFieldSetting;
};

export const defaultFormSettings: PublicFormSettings = {
  childFullName: { required: true, hidden: false },
  birthDate: { required: true, hidden: false },
  gender: { required: true, hidden: false },
  orphanType: { required: true, hidden: false },
  guardianName: { required: true, hidden: false },
  guardianRelation: { required: true, hidden: false },
  guardianPhone: { required: true, hidden: false },
  governorateCity: { required: true, hidden: false },
  address: { required: true, hidden: false },
  transferAccountName: { required: true, hidden: false },
  transferAccountNumber: { required: true, hidden: false },
  sponsorshipStatus: { required: true, hidden: false },
  sponsorName: { required: true, hidden: false },
  sponsorCountry: { required: true, hidden: false },
  notes: { required: false, hidden: false },
  files: { required: true, hidden: false },
};

export async function getPublicFormSettings(): Promise<PublicFormSettings> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "public_form_settings")
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching form settings:", error);
    return defaultFormSettings;
  }

  if (data?.value) {
    return { ...defaultFormSettings, ...(data.value as Partial<PublicFormSettings>) };
  }

  return defaultFormSettings;
}

export async function updatePublicFormSettings(settings: PublicFormSettings): Promise<void> {
  const { error } = await supabase
    .from("system_settings")
    .upsert({
      key: "public_form_settings",
      value: settings as any,
    });

  if (error) {
    console.error("Error updating form settings:", error);
    throw error;
  }
}
