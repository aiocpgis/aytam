import { useEffect, useState } from "react";
import { Save, Settings2, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import {
  PublicFormSettings,
  defaultFormSettings,
  getPublicFormSettings,
  updatePublicFormSettings,
} from "./settings.service";
import { useToast } from "../../components/ui/ToastProvider";

const fieldLabels: Record<keyof PublicFormSettings, string> = {
  childFullName: "اسم الطفل رباعي",
  birthDate: "تاريخ الميلاد",
  gender: "الجنس",
  orphanType: "حالة اليتيم",
  guardianName: "اسم الوصي بالكامل",
  guardianRelation: "صلة قرابة الوصي بالطفل",
  guardianPhone: "رقم جوال الوصي للتواصل",
  governorateCity: "المحافظة / المدينة",
  address: "مكان السكن الحالي بالتفصيل",
  transferAccountName: "طريقة استقبال الكفالة",
  transferAccountNumber: "رقم الجوال المرتبط بالحساب",
  sponsorshipStatus: "حالة الكفالة",
  sponsorName: "اسم الكفيل",
  sponsorCountry: "دولة الكفيل",
  notes: "ملاحظات إضافية",
  files: "المستندات الثبوتية",
};

export function FormSettingsPanel() {
  const [settings, setSettings] = useState<PublicFormSettings>(defaultFormSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getPublicFormSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error loading form settings", error);
        addToast("فشل تحميل إعدادات النموذج", "error");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [addToast]);

  const handleToggleRequired = (field: keyof PublicFormSettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        required: !prev[field].required,
      },
    }));
  };

  const handleToggleHidden = (field: keyof PublicFormSettings) => {
    setSettings((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        hidden: !prev[field].hidden,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePublicFormSettings(settings);
      addToast("تم حفظ إعدادات النموذج بنجاح", "success");
    } catch (error) {
      console.error("Error saving form settings", error);
      addToast("فشل حفظ إعدادات النموذج", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <Settings2 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">إعدادات نموذج الكفالة</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              تحكم في الحقول التي تظهر في نموذج التسجيل العام للأيتام، وحدد الحقول الإلزامية والاختيارية.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="primary-btn shrink-0"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ التعديلات
          </button>
        </div>
      </div>

      <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-5 w-5 text-slate-400" />
          <h3 className="text-base font-black text-slate-800">قائمة حقول النموذج</h3>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>
                <th className="px-4 py-3">اسم الحقل</th>
                <th className="px-4 py-3 text-center w-32">إلزامي (Required)</th>
                <th className="px-4 py-3 text-center w-32">مخفي (Hidden)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {(Object.keys(defaultFormSettings) as Array<keyof PublicFormSettings>).map((field) => (
                <tr key={field} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-700">
                    {fieldLabels[field]}
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5" dir="ltr">
                      {field}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={settings[field].required}
                        onChange={() => handleToggleRequired(field)}
                        disabled={settings[field].hidden}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:right-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:-translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-disabled:opacity-50"></div>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={settings[field].hidden}
                        onChange={() => handleToggleHidden(field)}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:right-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-rose-500 peer-checked:after:-translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs font-bold text-slate-500 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
          <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p>
            ملاحظة: عند تعيين الحقل كـ "مخفي"، سيتم إخفاؤه تماماً من النموذج العام ولن يكون مطلوباً بغض النظر عن حالة "إلزامي". الحقول المخفية لن ترسل أي بيانات عند تقديم الطلب.
          </p>
        </div>
      </div>
    </div>
  );
}
