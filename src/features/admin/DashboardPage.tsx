import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Baby,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  FolderClock,
  HandCoins,
  HandHeart,
  Heart,
  Hourglass,
  LayoutDashboard,
  MapPin,
  PieChart,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";
import type { OrphanRecord } from "../../types/orphan.types";
import { normalizeArabicText } from "../../lib/utils";
import { StatCard } from "../../components/ui/StatCard";
import { OrphanForm } from "../orphans/OrphanForm";
import { OrphansTable } from "../orphans/OrphansTable";
import { createOrphan, deleteOrphan, subscribeToOrphans, updateOrphan } from "../orphans/orphan.service";
import { ExcelImportPanel } from "./ExcelImportPanel";
import { ApplicationRequestsPanel } from "./ApplicationRequestsPanel";
import { DuplicateCheckPanel } from "./DuplicateCheckPanel";
import { SponsorshipDeliveryPanel } from "../sponsorships/SponsorshipDeliveryPanel";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { UserManagementPage } from "../users/UserManagementPage";
import { SponsorshipDonutChart } from "../../components/charts/SponsorshipDonutChart";
import { GovernorateBarChart } from "../../components/charts/GovernorateBarChart";
import { exportDashboardStatsToPDF } from "../../lib/pdfExport";
import { useToast } from "../../components/ui/ToastProvider";
import { usePermissions } from "../../hooks/usePermissions";
import * as XLSX from "xlsx";

type DashboardTab = "overview" | "directory" | "sponsorships" | "applications" | "duplicates" | "import" | "users";

type NavButtonProps = {
  tab: DashboardTab;
  activeTab: DashboardTab;
  label: string;
  icon: ReactNode;
  badge?: number;
  onClick: () => void;
};

function NavButton({ tab, activeTab, label, icon, badge, onClick }: NavButtonProps) {
  const isActive = activeTab === tab;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center lg:justify-start gap-3 px-4 py-3 text-xs font-extrabold rounded-2xl flex-grow lg:w-full transition-all ${
        isActive
          ? "bg-slate-900 text-white shadow-md scale-[1.02]"
          : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
      }`}
    >
      {icon}
      <span>{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className={`mr-auto px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export function DashboardPage() {
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const [records, setRecords] = useState<OrphanRecord[]>([]);
  const [selected, setSelected] = useState<OrphanRecord | null>(null);
  const [search, setSearch] = useState("");
  const [sponsorshipFilter, setSponsorshipFilter] = useState("الكل");
  const [fileStatusFilter, setFileStatusFilter] = useState("الكل");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  const allowedTabs = useMemo(() => {
    const tabs: DashboardTab[] = [];
    if (hasPermission("page.dashboard.view")) tabs.push("overview");
    if (hasPermission("page.orphans.view")) {
      tabs.push("directory");
      tabs.push("sponsorships");
      tabs.push("duplicates");
    }
    if (hasPermission("page.applications.view")) tabs.push("applications");
    if (hasPermission("page.import.view")) tabs.push("import");
    if (hasPermission("page.users.view")) tabs.push("users");
    return tabs;
  }, [hasPermission]);

  useEffect(() => {
    if (!permissionsLoading && allowedTabs.length > 0) {
      if (!activeTab || !allowedTabs.includes(activeTab)) {
        setActiveTab(allowedTabs[0]);
      }
    }
  }, [allowedTabs, activeTab, permissionsLoading]);

  useEffect(() => {
    const unsubscribe = subscribeToOrphans((items) => {
      setRecords(items);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    const sponsored = records.filter((item) => item.sponsorshipStatus === "مكفول").length;
    const waitingSponsor = records.filter((item) => item.sponsorshipStatus === "بانتظار كافل").length;
    const stoppedSponsor = records.filter((item) => item.sponsorshipStatus === "متوقف").length;
    const newFiles = records.filter((item) => item.fileStatus === "جديد" || item.fileStatus === "جديد بانتظار المراجعة").length;
    return { total: records.length, sponsored, waitingSponsor, stoppedSponsor, newFiles };
  }, [records]);

  const governorateStats = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((record) => {
      const city = (record.governorateCity || "غير محدد").trim();
      counts[city] = (counts[city] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: stats.total > 0 ? Math.round((count / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [records, stats.total]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = normalizeArabicText(search);

    return records.filter((record) => {
      const matchesSearch = !normalizedSearch || normalizeArabicText([
        record.childFullName,
        record.guardianName,
        record.governorateCity,
        record.sponsorName,
        record.guardianPhone,
      ].join(" ")).includes(normalizedSearch);

      const matchesSponsorship = sponsorshipFilter === "الكل" || record.sponsorshipStatus === sponsorshipFilter;
      const matchesFileStatus = fileStatusFilter === "الكل" || record.fileStatus === fileStatusFilter;

      return matchesSearch && matchesSponsorship && matchesFileStatus;
    });
  }, [records, search, sponsorshipFilter, fileStatusFilter]);

  async function handleSave(record: Parameters<typeof createOrphan>[0]) {
    if (selected?.id) {
      await updateOrphan(selected.id, record);
      setSelected(null);
      return;
    }

    await createOrphan(record);
    setShowAddForm(false);
  }

  async function handleDeleteConfirm() {
    if (!confirmDeleteId) return;

    try {
      setIsDeleting(true);
      await deleteOrphan(confirmDeleteId);
      addToast("تم حذف سجل اليتيم بنجاح", "success");
      setConfirmDeleteId(null);
      if (selected?.id === confirmDeleteId) setSelected(null);
    } catch (error) {
      console.error(error);
      addToast("حدث خطأ أثناء محاولة حذف السجل", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleExportExcel() {
    try {
      const canViewSensitive = hasPermission("orphans.view_sensitive");
      
      const maskPhone = (val: string | null | undefined) => {
        if (!val) return "-";
        const clean = val.replace(/[-\s]/g, "");
        if (clean.length > 6) return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
        return "****";
      };
      const maskAccount = (val: string | null | undefined) => {
        if (!val) return "-";
        const clean = val.replace(/[-\s]/g, "");
        if (clean.length > 4) return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
        return "****";
      };

      const dataToExport = filteredRecords.map((record) => {
        return {
          "اسم الطفل رباعي": record.childFullName,
          "تاريخ الميلاد": record.birthDate || "غير محدد",
          "الجنس": record.gender,
          "حالة اليتيم": record.orphanType,
          "المحافظة/المدينة": record.governorateCity || "غير محدد",
          "مكان السكن بالتفصيل": record.address || "غير محدد",
          "الوصي القانوني": record.guardianName || "غير محدد",
          "صلة القرابة": record.guardianRelation || "غير محدد",
          "رقم جوال الوصي": canViewSensitive ? (record.guardianPhone || "-") : maskPhone(record.guardianPhone),
          "اسم الكفيل": record.sponsorName || "بانتظار كافل",
          "رقم جوال الكفيل": canViewSensitive ? (record.sponsorPhone || "-") : maskPhone(record.sponsorPhone),
          "قيمة الكفالة الشهرية": record.sponsorshipAmount ?? "-",
          "العملة": record.sponsorshipAmount ? record.currency : "",
          "حالة الكفالة": record.sponsorshipStatus,
          "صاحب الحساب البنكي": canViewSensitive ? (record.transferAccountName || "-") : "غير مصرح",
          "رقم الحساب أو الآيبان": canViewSensitive ? (record.transferAccountNumber || "-") : maskAccount(record.transferAccountNumber),
          "حالة الأوراق": record.documentsStatus || "غير محدد",
          "حالة الملف": record.fileStatus,
          "الملاحظات": record.notes || "",
          "تاريخ التسجيل": record.createdAt ? new Date(record.createdAt).toLocaleDateString("ar-EG") : "-",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      worksheet["!dir"] = "rtl";

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "الأيتام");
      XLSX.writeFile(workbook, `دليل_الأيتام_${new Date().toISOString().slice(0, 10)}.xlsx`);
      addToast("تم تصدير ملف Excel بنجاح", "success");
    } catch (error) {
      console.error("Failed to export Excel", error);
      addToast("فشل تصدير ملف Excel", "error");
    }
  }

  useEffect(() => {
    if (selected) {
      setActiveTab("directory");
      setShowAddForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selected]);

  function switchTab(tab: DashboardTab) {
    setActiveTab(tab);
    if (tab !== "directory") {
      setSelected(null);
      setShowAddForm(false);
    }
  }

  if (permissionsLoading) {
    return (
      <div className="grid min-h-[400px] place-items-center text-sm font-bold text-slate-500">
        جاري التحقق من صلاحيات الدخول...
      </div>
    );
  }

  if (allowedTabs.length === 0) {
    return (
      <div className="glass-card p-12 text-center border border-rose-200 bg-rose-50/50 max-w-xl mx-auto mt-10" dir="rtl">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-black text-rose-900">صلاحيات غير كافية</h2>
        <p className="text-sm font-bold text-rose-600 mt-2">عذراً، ليس لديك الصلاحية لعرض أي صفحة في لوحة التحكم.</p>
      </div>
    );
  }

  if (!activeTab) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl pb-16">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 border border-white/60 p-4 rounded-3xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black text-slate-900">لوحة التحكم</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">متابعة البيانات والكفالات وإدارة الملفات.</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "overview" && (
            <button
              type="button"
              onClick={() => {
                exportDashboardStatsToPDF(records);
                addToast("تم تصدير التقرير بنجاح", "success");
              }}
              className="secondary-btn text-xs font-black shadow-sm"
              title="تصدير تقرير الإحصائيات (PDF)"
            >
              <Download className="h-4 w-4 text-indigo-500" />
              تصدير PDF
            </button>
          )}

          {activeTab === "directory" && hasPermission("orphans.export") && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="secondary-btn text-xs font-black shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              تصدير إلى Excel
            </button>
          )}

          {activeTab === "directory" && hasPermission("orphans.create") && (
            <button
              type="button"
              onClick={() => {
                if (showAddForm) setSelected(null);
                setShowAddForm(!showAddForm);
              }}
              className="primary-btn text-xs font-black shadow-md"
            >
              <Plus className={`h-4 w-4 transition-transform ${showAddForm ? "rotate-45" : ""}`} />
              {showAddForm ? "إغلاق النموذج" : "إضافة يتيم جديد"}
            </button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pb-2">
          <nav className="flex lg:flex-col flex-wrap gap-2 p-2 rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-soft">
            {allowedTabs.includes("overview") && (
              <NavButton
                tab="overview"
                activeTab={activeTab}
                label="الرئيسية"
                icon={<LayoutDashboard className="h-4 w-4 shrink-0" />}
                onClick={() => switchTab("overview")}
              />
            )}
            {allowedTabs.includes("directory") && (
              <NavButton
                tab="directory"
                activeTab={activeTab}
                label="الأيتام"
                icon={<Users className="h-4 w-4 shrink-0" />}
                badge={records.length}
                onClick={() => switchTab("directory")}
              />
            )}
            {allowedTabs.includes("sponsorships") && (
              <NavButton
                tab="sponsorships"
                activeTab={activeTab}
                label="متابعة الكفالات"
                icon={<HandCoins className="h-4 w-4 shrink-0" />}
                onClick={() => switchTab("sponsorships")}
              />
            )}
            {allowedTabs.includes("applications") && (
              <NavButton
                tab="applications"
                activeTab={activeTab}
                label="الطلبات الجديدة"
                icon={<FolderClock className="h-4 w-4 shrink-0" />}
                onClick={() => switchTab("applications")}
              />
            )}
            {allowedTabs.includes("duplicates") && (
              <NavButton
                tab="duplicates"
                activeTab={activeTab}
                label="فحص التكرار"
                icon={<ShieldCheck className="h-4 w-4 shrink-0" />}
                onClick={() => switchTab("duplicates")}
              />
            )}
            {allowedTabs.includes("import") && (
              <NavButton
                tab="import"
                activeTab={activeTab}
                label="استيراد ملف"
                icon={<FileSpreadsheet className="h-4 w-4 shrink-0" />}
                onClick={() => switchTab("import")}
              />
            )}
            {allowedTabs.includes("users") && (
              <NavButton
                tab="users"
                activeTab={activeTab}
                label="المستخدمين"
                icon={<UserCog className="h-4 w-4 shrink-0" />}
                onClick={() => switchTab("users")}
              />
            )}
          </nav>
        </aside>

        <section className="space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="الأيتام" value={stats.total} icon={<Baby className="h-6 w-6" />} tone="blue" />
                <StatCard title="طلبات جديدة" value={stats.newFiles} icon={<ClipboardList className="h-6 w-6" />} tone="amber" />
                <StatCard title="مكفولين" value={stats.sponsored} icon={<HandHeart className="h-6 w-6" />} tone="green" />
                <StatCard title="بانتظار كافل" value={stats.waitingSponsor} icon={<Hourglass className="h-6 w-6" />} tone="rose" />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PieChart className="h-5 w-5 text-blue-600" />
                      <h3 className="text-base font-black text-slate-800">توزيع الكفالات</h3>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mb-6">نسب التكفل بالأطفال المسجلين.</p>
                  </div>

                  <div className="flex-1 min-h-0">
                    <SponsorshipDonutChart data={[
                      { name: "مكفول", value: stats.sponsored },
                      { name: "بانتظار كافل", value: stats.waitingSponsor },
                      { name: "متوقف", value: stats.stoppedSponsor },
                    ]} />
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      نسبة التغطية الحالية: {stats.total > 0 ? Math.round((stats.sponsored / stats.total) * 100) : 0}%
                    </span>
                    <button
                      type="button"
                      onClick={() => switchTab("directory")}
                      className="text-blue-600 hover:underline font-extrabold flex items-center gap-0.5"
                    >
                      عرض الدليل التفصيلي ←
                    </button>
                  </div>
                </div>

                <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-base font-black text-slate-800">التوزيع الجغرافي للأطفال (أعلى 5)</h3>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mb-6">توزيع الحالات الإنسانية المعتمدة حسب المحافظة والمدينة.</p>

                  {governorateStats.length === 0 ? (
                    <div className="h-[180px] grid place-items-center text-xs font-bold text-slate-400">
                      لا تتوفر بيانات جغرافية حالياً.
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 mt-4">
                      <GovernorateBarChart data={governorateStats.map((item) => ({ name: item.name, value: item.count }))} />
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/40 p-6 flex flex-col md:flex-row items-center gap-4 text-right backdrop-blur-xl">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-l from-rose-500 to-pink-400 grid place-items-center text-white shrink-0 shadow-soft">
                  <Heart className="h-6 w-6 fill-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">"كافل اليتيم له في الجنة مقام عظيم"</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    أنت تقوم بعمل إنساني عظيم. تنظيم السجلات وتدقيق الأرقام هو الحصن الذي يضمن وصول المساعدات لمستحقيها بكل شفافية وأمانة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "directory" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {showAddForm && (
                <div className="animate-in fade-in-50 slide-in-from-top-4 duration-300">
                  <OrphanForm
                    selected={selected}
                    onSubmit={handleSave}
                    onCancel={() => {
                      setSelected(null);
                      setShowAddForm(false);
                    }}
                  />
                </div>
              )}

              <div className="glass-card p-5 border border-white/60 bg-white/50 shadow-glass">
                <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
                  <div className="relative">
                    <input
                      className="glass-input pr-10"
                      placeholder="بحث بالاسم، الوصي، المدينة، الكفيل..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      className="glass-input pr-10 appearance-none"
                      value={sponsorshipFilter}
                      onChange={(event) => setSponsorshipFilter(event.target.value)}
                    >
                      <option value="الكل">جميع حالات الكفالة</option>
                      <option value="غير مكفول">غير مكفول</option>
                      <option value="بانتظار كافل">بانتظار كافل</option>
                      <option value="مكفول">مكفول</option>
                      <option value="متوقف">متوقف</option>
                    </select>
                    <Filter className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      className="glass-input pr-10 appearance-none"
                      value={fileStatusFilter}
                      onChange={(event) => setFileStatusFilter(event.target.value)}
                    >
                      <option value="الكل">جميع حالات الملف</option>
                      <option value="جديد">جديد</option>
                      <option value="جديد بانتظار المراجعة">جديد بانتظار المراجعة</option>
                      <option value="قيد المراجعة">قيد المراجعة</option>
                      <option value="مقبول">مقبول</option>
                      <option value="مرفوض">مرفوض</option>
                      <option value="مكتمل">مكتمل</option>
                    </select>
                    <Filter className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="glass-card p-6 border border-white/50 bg-white/40 overflow-hidden">
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl w-full" />
                    <div className="space-y-3">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="h-12 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl w-1/4" />
                          <div className="h-12 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl w-1/4" />
                          <div className="h-12 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl w-1/4" />
                          <div className="h-12 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl w-1/4" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <OrphansTable records={filteredRecords} onEdit={setSelected} onDelete={setConfirmDeleteId} />
              )}
            </div>
          )}

          {activeTab === "sponsorships" && (
            <div className="animate-in fade-in-50 duration-200">
              <SponsorshipDeliveryPanel records={records} />
            </div>
          )}

          {activeTab === "applications" && (
            <div className="animate-in fade-in-50 duration-200">
              <ApplicationRequestsPanel />
            </div>
          )}

          {activeTab === "duplicates" && (
            <div className="animate-in fade-in-50 duration-200">
              <DuplicateCheckPanel officialRecords={records} />
            </div>
          )}

          {activeTab === "import" && (
            <div className="animate-in fade-in-50 duration-200">
              <ExcelImportPanel />
            </div>
          )}

          {activeTab === "users" && (
            <div className="animate-in fade-in-50 duration-200">
              <UserManagementPage />
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="تأكيد حذف اليتيم"
        message="هل أنت متأكد تماماً من رغبتك في حذف هذا السجل الإداري لليتيم؟ لا يمكن التراجع عن هذه العملية نهائياً، وسيتم حذف السجل من الخوادم."
        confirmText="نعم، حذف السجل نهائياً"
        cancelText="تراجع وإلغاء"
        tone="danger"
        isSubmitting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => !isDeleting && setConfirmDeleteId(null)}
      />
    </div>
  );
}
