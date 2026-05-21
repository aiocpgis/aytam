import { useEffect, useMemo, useState } from "react";
import { 
  Baby, 
  ClipboardList, 
  HandHeart, 
  Hourglass, 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  FolderClock,
  Plus,
  Search,
  Filter,
  Trash2,
  PieChart,
  MapPin,
  Heart,
  TrendingUp,
  UserCog,
  Download
} from "lucide-react";
import type { OrphanRecord } from "../../types/orphan.types";
import { normalizeArabicText } from "../../lib/utils";
import { StatCard } from "../../components/ui/StatCard";
import { OrphanForm } from "../orphans/OrphanForm";
import { OrphansTable } from "../orphans/OrphansTable";
import { createOrphan, deleteOrphan, subscribeToOrphans, updateOrphan } from "../orphans/orphan.service";
import { ExcelImportPanel } from "./ExcelImportPanel";
import { ApplicationRequestsPanel } from "./ApplicationRequestsPanel";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { UserManagementPage } from "../users/UserManagementPage";
import { SponsorshipDonutChart } from "../../components/charts/SponsorshipDonutChart";
import { GovernorateBarChart } from "../../components/charts/GovernorateBarChart";
import { exportDashboardStatsToPDF } from "../../lib/pdfExport";
import { useToast } from "../../components/ui/ToastProvider";

type DashboardTab = "overview" | "directory" | "applications" | "import" | "users";

export function DashboardPage() {
  const [records, setRecords] = useState<OrphanRecord[]>([]);
  const [selected, setSelected] = useState<OrphanRecord | null>(null);
  const [search, setSearch] = useState("");
  const [sponsorshipFilter, setSponsorshipFilter] = useState("الكل");
  const [fileStatusFilter, setFileStatusFilter] = useState("الكل");
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation & UI control states
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToOrphans((items) => {
      setRecords(items);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const sponsored = records.filter((item) => item.sponsorshipStatus === "مكفول").length;
    const waitingSponsor = records.filter((item) => item.sponsorshipStatus === "بانتظار كافل").length;
    const stoppedSponsor = records.filter((item) => item.sponsorshipStatus === "متوقف").length;
    const newFiles = records.filter((item) => item.fileStatus === "جديد" || item.fileStatus === "جديد بانتظار المراجعة").length;
    return { total: records.length, sponsored, waitingSponsor, stoppedSponsor, newFiles };
  }, [records]);

  // Aggregated governorate data
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
      .slice(0, 5); // top 5
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
      // If the currently edited record is deleted, clear selection
      if (selected?.id === confirmDeleteId) {
        setSelected(null);
      }
    } catch (error) {
      console.error(error);
      addToast("حدث خطأ أثناء محاولة حذف السجل", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // Trigger form open automatically when editing
  useEffect(() => {
    if (selected) {
      setActiveTab("directory");
      setShowAddForm(true);
    }
  }, [selected]);

  return (
    <div className="mx-auto max-w-7xl pb-16">
      {/* Dashboard Top bar / Subheader */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 border border-white/60 p-4 rounded-3xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-black text-slate-900">لوحة التحكم</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">متابعة البيانات والكفالات وإدارة الملفات.</p>
        </div>
        
        {/* Quick actions depending on tab */}
        <div className="flex items-center gap-2">
          {activeTab === "overview" && (
            <button 
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
          {activeTab === "directory" && (
            <button 
              onClick={() => {
              if (showAddForm) setSelected(null);
              setShowAddForm(!showAddForm);
            }} 
            className="primary-btn text-xs font-black shadow-md"
          >
            <Plus className={`h-4 w-4 transition-transform ${showAddForm ? 'rotate-45' : ''}`} />
            {showAddForm ? "إغلاق النموذج" : "إضافة يتيم جديد"}
            </button>
          )}
        </div>
      </div>

      {/* Main Dashboard Layout: Sidebar + Content */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        
        {/* Navigation Sidebar */}
        <aside className="space-y-2 lg:h-fit">
          <nav className="flex lg:flex-col flex-wrap gap-2 p-2 rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl">
            <button
              onClick={() => { setActiveTab("overview"); setSelected(null); }}
              className={`flex items-center justify-center lg:justify-start gap-3 px-4 py-3 text-xs font-extrabold rounded-2xl flex-grow lg:w-full transition-all ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>الرئيسية</span>
            </button>

            <button
              onClick={() => setActiveTab("directory")}
              className={`flex items-center justify-center lg:justify-start gap-3 px-4 py-3 text-xs font-extrabold rounded-2xl flex-grow lg:w-full transition-all ${
                activeTab === "directory"
                  ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>الأيتام</span>
              {records.length > 0 && (
                <span className={`mr-auto px-2 py-0.5 rounded-full text-[10px] ${
                  activeTab === "directory" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {records.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("applications"); setSelected(null); }}
              className={`flex items-center justify-center lg:justify-start gap-3 px-4 py-3 text-xs font-extrabold rounded-2xl flex-grow lg:w-full transition-all ${
                activeTab === "applications"
                  ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
              }`}
            >
              <FolderClock className="h-4 w-4 shrink-0" />
              <span>الطلبات الجديدة</span>
            </button>

            <button
              onClick={() => { setActiveTab("import"); setSelected(null); }}
              className={`flex items-center justify-center lg:justify-start gap-3 px-4 py-3 text-xs font-extrabold rounded-2xl flex-grow lg:w-full transition-all ${
                activeTab === "import"
                  ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>استيراد ملف</span>
            </button>

            <button
              onClick={() => { setActiveTab("users"); setSelected(null); }}
              className={`flex items-center justify-center lg:justify-start gap-3 px-4 py-3 text-xs font-extrabold rounded-2xl flex-grow lg:w-full transition-all ${
                activeTab === "users"
                  ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
              }`}
            >
              <UserCog className="h-4 w-4 shrink-0" />
              <span>المستخدمين</span>
            </button>
          </nav>
        </aside>

        {/* Dynamic Content Panel */}
        <section className="space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Stat Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="الأيتام" value={stats.total} icon={<Baby className="h-6 w-6" />} tone="blue" />
                <StatCard title="طلبات جديدة" value={stats.newFiles} icon={<ClipboardList className="h-6 w-6" />} tone="amber" />
                <StatCard title="مكفولين" value={stats.sponsored} icon={<HandHeart className="h-6 w-6" />} tone="green" />
                <StatCard title="بانتظار كافل" value={stats.waitingSponsor} icon={<Hourglass className="h-6 w-6" />} tone="rose" />
              </div>

              {/* Breathtaking Custom Interactive Analytics Dashboard */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Visual 1: Sponsorship distribution donut equivalent */}
                <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <PieChart className="h-5 w-5 text-blue-600" />
                      <h3 className="text-base font-black text-slate-800">توزيع الكفالات</h3>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mb-6">نسب التكفل بالأطفال المسجلين.</p>
                  </div>

                  {/* Sleek dynamic charts */}
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
                      onClick={() => setActiveTab("directory")} 
                      className="text-blue-600 hover:underline font-extrabold flex items-center gap-0.5"
                    >
                      عرض الدليل التفصيلي ←
                    </button>
                  </div>
                </div>

                {/* Visual 2: Governorate stats bar chart */}
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
                      <GovernorateBarChart data={governorateStats.map(s => ({ name: s.name, value: s.count }))} />
                    </div>
                  )}
                </div>
              </div>

              {/* Motivational Admin Footer Quote */}
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

          {/* TAB 2: DIRECTORY */}
          {activeTab === "directory" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              
              {/* Add / Edit Form Panel */}
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

              {/* Search & Dynamic filters panel */}
              <div className="glass-card p-5 border border-white/60 bg-white/50 shadow-glass">
                <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
                  {/* Search input with inner icon */}
                  <div className="relative">
                    <input 
                      className="glass-input pr-10" 
                      placeholder="بحث بالاسم، الوصي، المدينة، الكفيل..." 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                    />
                    <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Sponsorship filter */}
                  <div className="relative">
                    <select 
                      className="glass-input pr-10 appearance-none" 
                      value={sponsorshipFilter} 
                      onChange={(e) => setSponsorshipFilter(e.target.value)}
                    >
                      <option value="الكل">جميع حالات الكفالة</option>
                      <option value="بانتظار كافل">بانتظار كافل</option>
                      <option value="مكفول">مكفول</option>
                      <option value="متوقف">متوقف</option>
                    </select>
                    <Filter className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>

                  {/* File status filter */}
                  <div className="relative">
                    <select 
                      className="glass-input pr-10 appearance-none" 
                      value={fileStatusFilter} 
                      onChange={(e) => setFileStatusFilter(e.target.value)}
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

              {/* Table Data */}
              {isLoading ? (
                <div className="glass-card p-6 border border-white/50 bg-white/40 overflow-hidden">
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl w-full"></div>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="h-12 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl w-1/4"></div>
                          <div className="h-12 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl w-1/4"></div>
                          <div className="h-12 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl w-1/4"></div>
                          <div className="h-12 bg-slate-200/40 dark:bg-slate-700/40 rounded-xl w-1/4"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <OrphansTable 
                  records={filteredRecords} 
                  onEdit={setSelected} 
                  onDelete={setConfirmDeleteId} 
                />
              )}
            </div>
          )}

          {/* TAB 3: APPLICATION REQUESTS */}
          {activeTab === "applications" && (
            <div className="animate-in fade-in-50 duration-200">
              <ApplicationRequestsPanel />
            </div>
          )}

          {/* TAB 4: EXCEL IMPORT */}
          {activeTab === "import" && (
            <div className="animate-in fade-in-50 duration-200">
              <ExcelImportPanel />
            </div>
          )}

          {/* TAB 5: USER MANAGEMENT */}
          {activeTab === "users" && (
            <div className="animate-in fade-in-50 duration-200">
              <UserManagementPage />
            </div>
          )}

        </section>
      </div>

      {/* Custom Reusable Delete Confirm Dialog */}
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
