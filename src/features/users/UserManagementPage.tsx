import { useEffect, useState } from "react";
import { 
  UserCog, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Loader2, 
  AlertCircle, 
  Plus, 
  Settings, 
  History, 
  HardDrive, 
  Mail, 
  Phone, 
  Globe, 
  RefreshCw, 
  FileText 
} from "lucide-react";

// Inline brand SVGs since brand icons were removed in newer lucide-react versions
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
import { supabase } from "../../lib/supabase";
import type { UserProfile, Role, Permission } from "../../types/user.types";
import { getAllRoles, getAllPermissions } from "./permissions.service";
import { usePermissions } from "../../hooks/usePermissions";
import { useToast } from "../../components/ui/ToastProvider";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { logActivity } from "../audit/activityLog.service";

type SettingsSubTab = "users" | "general" | "audit" | "storage" | "maintenance";

export function UserManagementPage() {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { hasPermission } = usePermissions();
  const { addToast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserProfile | null>(null);

  const canViewSettings = hasPermission("page.settings.view");

  useEffect(() => {
    async function loadCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    }
    loadCurrentUser();
  }, []);

  async function toggleUserStatus(user: UserProfile) {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: nextStatus })
        .eq("id", user.id);
      if (error) throw error;
      
      await logActivity(
        nextStatus === "suspended" ? "تجميد حساب مشرف" : "تنشيط حساب مشرف",
        "المستخدمين",
        user.id,
        { email: user.email }
      );
      addToast(`تم ${nextStatus === "suspended" ? "تجميد" : "تنشيط"} الحساب بنجاح`, "success");
      triggerRefresh();
    } catch (err) {
      console.error(err);
      addToast("فشل في تعديل حالة الحساب", "error");
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      const { error } = await supabase.rpc("delete_system_user_v1", {
        target_user_id: userId
      });
      if (error) throw error;
      
      await logActivity("حذف حساب مشرف", "المستخدمين", userId);
      addToast("تم حذف حساب المشرف بنجاح", "success");
      triggerRefresh();
    } catch (err) {
      console.error(err);
      addToast(err instanceof Error ? err.message : "فشل حذف المشرف", "error");
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [usersData, rolesData, permsData] = await Promise.all([
          supabase.from("profiles").select("*, roles:user_roles(role:roles(*))").order("created_at", { ascending: false }),
          getAllRoles(),
          getAllPermissions()
        ]);
        
        // Format users with roles
        const formattedUsers = usersData.data?.map((u: any) => ({
          ...u,
          roles: u.roles.map((ur: any) => ur.role)
        })) || [];
        
        setUsers(formattedUsers);
        setRoles(rolesData || []);
        setPermissions(permsData || []);
      } catch (err) {
        console.error("Failed to load user management data", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (hasPermission("users.view") && activeSubTab === "users") {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [hasPermission, refreshTrigger, activeSubTab]);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  if (!hasPermission("users.view")) {
    return (
      <div className="glass-card p-12 text-center border border-rose-200 bg-rose-50/50">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-black text-rose-900">صلاحيات غير كافية</h2>
        <p className="text-sm font-bold text-rose-600 mt-2">عذراً، ليس لديك الصلاحية لعرض هذه الصفحة.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Subtitle */}
      <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-800">لوحة التحكم المركزية والإعدادات</h3>
          </div>
          <p className="text-xs font-bold text-slate-500">
            تهيئة خيارات المنصة العامة، سجل الرقابة والعمليات، وإدارة صلاحيات مشرفي المنصة.
          </p>
        </div>
      </div>

      {/* Modern Glassmorphic Sub-Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-inner-glass">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
            activeSubTab === "users"
              ? "bg-slate-900 text-white shadow-md scale-[1.02]"
              : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
          }`}
        >
          <UserCog className="h-4 w-4 text-indigo-500" />
          <span>المشرفين والصلاحيات</span>
        </button>

        {canViewSettings && (
          <button
            onClick={() => setActiveSubTab("general")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
              activeSubTab === "general"
                ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
            }`}
          >
            <Settings className="h-4 w-4 text-blue-500" />
            <span>الإعدادات العامة</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
            activeSubTab === "audit"
              ? "bg-slate-900 text-white shadow-md scale-[1.02]"
              : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
          }`}
        >
          <History className="h-4 w-4 text-emerald-500" />
          <span>سجل الرقابة</span>
        </button>

        {canViewSettings && (
          <button
            onClick={() => setActiveSubTab("storage")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
              activeSubTab === "storage"
                ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
            }`}
          >
            <HardDrive className="h-4 w-4 text-amber-500" />
            <span>قواعد التخزين</span>
          </button>
        )}

        {canViewSettings && (
          <button
            onClick={() => setActiveSubTab("maintenance")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-300 ${
              activeSubTab === "maintenance"
                ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-950"
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span>وضع الصيانة</span>
          </button>
        )}
      </div>

      {/* Render Active Sub-Tab Panel */}
      {activeSubTab === "users" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex justify-between items-center bg-white/40 border border-white/60 p-4 rounded-3xl backdrop-blur-xl">
            <div>
              <h3 className="text-sm font-black text-slate-800">إدارة صلاحيات المستخدمين</h3>
              <p className="text-[11px] text-slate-500 font-bold mt-1">تحديد رتب المشرفين وتعديل استثناءات الوصول بشكل حي.</p>
            </div>
            {hasPermission("users.create") && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="primary-btn text-xs font-black shadow-md shrink-0"
              >
                <Plus className="h-4 w-4" />
                إضافة مستخدم جديد
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="glass-card p-12 text-center text-sm font-bold text-slate-500 border border-white/50 bg-white/40">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-slate-900" />
              جاري تحميل نظام الصلاحيات والمستخدمين...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 text-slate-600 font-black">
                  <tr>
                    <th className="p-3 whitespace-nowrap">الاسم</th>
                    <th className="p-3 whitespace-nowrap">البريد الإلكتروني</th>
                    <th className="p-3 whitespace-nowrap">الحالة</th>
                    <th className="p-3 whitespace-nowrap">الأدوار</th>
                    <th className="p-3 whitespace-nowrap text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{user.full_name || "غير محدد"}</td>
                      <td className="p-3 text-slate-600 text-xs">{user.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ${
                          user.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {user.status === "active" ? "نشط" : "موقوف"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map(r => (
                              <span key={r.id} className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                {r.label}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">لا يوجد أدوار</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {hasPermission("users.assign_permissions") && (
                            <button 
                              onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                              className="text-xs font-black text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                              title="تعديل الأدوار والصلاحيات"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              الصلاحيات
                            </button>
                          )}
                          {hasPermission("users.update") && user.id !== currentUserId && (
                            <button
                              onClick={() => toggleUserStatus(user)}
                              className={`text-xs font-black px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1 ${
                                user.status === "active"
                                  ? "text-amber-600 hover:text-amber-900 bg-amber-50/80 hover:bg-amber-100"
                                  : "text-emerald-600 hover:text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100"
                              }`}
                              title={user.status === "active" ? "تجميد الحساب" : "تنشيط الحساب"}
                            >
                              {user.status === "active" ? "تجميد" : "تنشيط"}
                            </button>
                          )}
                          {hasPermission("users.delete") && user.id !== currentUserId && (
                            <button
                              onClick={() => setConfirmDeleteUser(user)}
                              className="text-xs font-black text-rose-600 hover:text-rose-900 bg-rose-50/80 hover:bg-rose-100 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                              title="حذف الحساب نهائياً"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-bold">لا يوجد مستخدمين لعرضهم</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected User Permissions Panel */}
          {selectedUser && hasPermission("users.assign_permissions") && (
            <UserPermissionsPanel 
              user={selectedUser} 
              allRoles={roles} 
              allPermissions={permissions} 
              onClose={() => setSelectedUser(null)} 
              onSuccess={triggerRefresh}
            />
          )}

          {/* Add User Modal */}
          {showAddUserModal && (
            <AddUserModal 
              allRoles={roles}
              onClose={() => setShowAddUserModal(false)}
              onSuccess={() => {
                setShowAddUserModal(false);
                triggerRefresh();
              }}
            />
          )}
        </div>
      )}

      {activeSubTab === "general" && canViewSettings && (
        <div className="animate-in fade-in-50 duration-200">
          <GeneralSettingsPanel />
        </div>
      )}

      {activeSubTab === "audit" && (
        <div className="animate-in fade-in-50 duration-200">
          <AuditLogsPanel />
        </div>
      )}

      {activeSubTab === "storage" && canViewSettings && (
        <div className="animate-in fade-in-50 duration-200">
          <StorageRulesPanel />
        </div>
      )}

      {activeSubTab === "maintenance" && canViewSettings && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <MaintenanceToggleCard />
        </div>
      )}

      {confirmDeleteUser && (
        <ConfirmDialog
          isOpen={!!confirmDeleteUser}
          title="حذف حساب المشرف"
          message={`هل أنت متأكد من رغبتك في حذف حساب المشرف (${confirmDeleteUser.full_name || confirmDeleteUser.email}) نهائياً؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف كافة صلاحياته وأدواره.`}
          confirmText="نعم، احذف الحساب"
          cancelText="إلغاء"
          onConfirm={async () => {
            await handleDeleteUser(confirmDeleteUser.id);
            setConfirmDeleteUser(null);
          }}
          onCancel={() => setConfirmDeleteUser(null)}
        />
      )}
    </div>
  );
}

// Sub-component for managing individual user permissions
function UserPermissionsPanel({ 
  user, 
  allRoles, 
  allPermissions, 
  onClose,
  onSuccess
}: { 
  user: UserProfile, 
  allRoles: Role[], 
  allPermissions: Permission[], 
  onClose: () => void,
  onSuccess: () => void
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles?.map(r => r.id) || []);
  const [overrides, setOverrides] = useState<Record<string, "allow"|"deny">>({});
  const { addToast } = useToast();
  
  useEffect(() => {
    async function fetchOverrides() {
      const { data } = await supabase.from("user_permissions").select("permission_id, effect").eq("user_id", user.id);
      if (data) {
        const obs: Record<string, "allow"|"deny"> = {};
        data.forEach((d: any) => {
          obs[d.permission_id] = d.effect;
        });
        setOverrides(obs);
      }
    }
    fetchOverrides();
    setSelectedRoles(user.roles?.map(r => r.id) || []);
  }, [user]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const roleIds = selectedRoles;
      const overrideInserts = Object.entries(overrides).map(([permission_id, effect]) => ({
        permission_id,
        effect
      }));

      const { error } = await supabase.rpc("update_user_roles_and_permissions_v1", {
        target_user_id: user.id,
        role_ids: roleIds,
        permission_overrides: overrideInserts
      });

      if (error) throw error;

      await logActivity("تعديل صلاحيات مشرف", "المستخدمين", user.id, {
        roles: roleIds,
        overridesCount: overrideInserts.length
      });

      addToast("تم حفظ الصلاحيات بنجاح", "success");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      addToast("حدث خطأ أثناء حفظ الصلاحيات", "error");
    } finally {
      setIsSaving(false);
    }
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const setOverride = (permId: string, effect: "allow"|"deny"|null) => {
    setOverrides(prev => {
      const next = { ...prev };
      if (effect === null) {
        delete next[permId];
      } else {
        next[permId] = effect;
      }
      return next;
    });
  };

  const categories = Array.from(new Set(allPermissions.map(p => p.category)));

  return (
    <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            صلاحيات المستخدم: <span className="text-indigo-700">{user.full_name}</span>
          </h3>
          <p className="text-xs font-bold text-slate-500 mt-1">تحديد الأدوار والاستثناءات المخصصة للمستخدم</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-extrabold text-sm">
          إلغاء
        </button>
      </div>

      <div className="space-y-8">
        {/* Roles */}
        <div>
          <h4 className="text-sm font-black text-slate-800 mb-3 border-r-4 border-indigo-500 pr-2">الأدوار الممنوحة</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allRoles.map(role => (
              <label key={role.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedRoles.includes(role.id) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200 hover:border-indigo-300"
              }`}>
                <input 
                  type="checkbox" 
                  checked={selectedRoles.includes(role.id)} 
                  onChange={() => toggleRole(role.id)}
                  className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                />
                <div>
                  <div className="text-sm font-black text-slate-800">{role.label}</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">{role.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Overrides */}
        <div>
          <h4 className="text-sm font-black text-slate-800 mb-3 border-r-4 border-rose-500 pr-2">الاستثناءات (Overrides)</h4>
          <p className="text-xs text-slate-500 font-bold mb-4 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            يمكنك إجبار إعطاء صلاحية معينة (مسموح) أو سحبها (ممنوع) بغض النظر عن الأدوار المحددة مسبقاً.
          </p>

          <div className="space-y-6">
            {categories.map(cat => (
              <div key={cat} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 font-black text-sm text-slate-700 border-b border-slate-200">
                  {cat}
                </div>
                <div className="divide-y divide-slate-100">
                  {allPermissions.filter(p => p.category === cat).map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50">
                      <div>
                        <div className="text-xs font-black text-slate-800">{p.label}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{p.description}</div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                        <button 
                          onClick={() => setOverride(p.id, "allow")}
                          className={`px-3 py-1 text-[10px] font-black rounded-md transition-colors ${
                            overrides[p.id] === "allow" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          مسموح
                        </button>
                        <button 
                          onClick={() => setOverride(p.id, null)}
                          className={`px-3 py-1 text-[10px] font-black rounded-md transition-colors ${
                            overrides[p.id] === undefined ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          حسب الدور
                        </button>
                        <button 
                          onClick={() => setOverride(p.id, "deny")}
                          className={`px-3 py-1 text-[10px] font-black rounded-md transition-colors ${
                            overrides[p.id] === "deny" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          ممنوع
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
          إلغاء
        </button>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="primary-btn text-sm px-6"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {isSaving ? "جاري الحفظ..." : "حفظ الصلاحيات"}
        </button>
      </div>
    </div>
  );
}

// Sub-component for adding a new user
function AddUserModal({
  allRoles,
  onClose,
  onSuccess
}: {
  allRoles: Role[],
  onClose: () => void,
  onSuccess: () => void
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  async function handleSave() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      addToast("يرجى ملء جميع الحقول المطلوبة", "error");
      return;
    }

    if (password.length < 6) {
      addToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Create the Auth User
      const { data: newUserId, error: createError } = await supabase.rpc("create_new_user_v1", {
        user_email: email,
        user_password: password,
        user_full_name: fullName
      });

      if (createError) throw createError;

      // 2. Assign the Roles if any selected
      if (selectedRoles.length > 0) {
        const { error: roleError } = await supabase.rpc("update_user_roles_and_permissions_v1", {
          target_user_id: newUserId,
          role_ids: selectedRoles,
          permission_overrides: []
        });

        if (roleError) throw roleError;
      }

      await logActivity("إنشاء حساب مشرف جديد", "المستخدمين", newUserId, {
        email,
        full_name: fullName,
        roles: selectedRoles
      });

      addToast("تم إنشاء المستخدم الجديد وتعيين أدواره بنجاح", "success");
      onSuccess();
    } catch (err) {
      console.error(err);
      addToast(err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء المستخدم", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-xl scale-100 transform rounded-3xl border border-white/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-6 shadow-2xl transition-all duration-300 animate-in fade-in-50 zoom-in-95 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-indigo-600" />
              إضافة مستخدم جديد للنظام
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-1">إنشاء حساب مشرف جديد وتخصيص أدواره فوراً</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-extrabold text-sm">
            إلغاء
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-right">
          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">الاسم الكامل *</label>
              <input 
                className="glass-input text-sm" 
                placeholder="أدخل الاسم الرباعي للمشرف"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">البريد الإلكتروني *</label>
              <input 
                type="email"
                className="glass-input text-sm" 
                placeholder="example@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">كلمة المرور المؤقتة *</label>
            <input 
              type="password"
              className="glass-input text-sm" 
              placeholder="يجب ألا تقل عن 6 أحرف"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {/* Roles Selection */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-3 border-r-4 border-indigo-500 pr-2">الأدوار الممنوحة</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allRoles.map(role => (
                <label key={role.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedRoles.includes(role.id) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200 hover:border-indigo-300"
                }`}>
                  <input 
                    type="checkbox" 
                    checked={selectedRoles.includes(role.id)} 
                    onChange={() => toggleRole(role.id)}
                    className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-800">{role.label}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">{role.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-sm font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            إلغاء
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={isSaving}
            className="primary-btn text-sm px-6"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isSaving ? "جاري الحفظ..." : "حفظ الحساب"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-component for toggling maintenance mode
function MaintenanceToggleCard() {
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("users.assign_permissions");

  const [isMaintenance, setIsMaintenance] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isTableMissing, setIsTableMissing] = useState<boolean>(false);
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    async function fetchStatus() {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        if (error) {
          if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
            if (isMounted) setIsTableMissing(true);
          }
          throw error;
        }

        if (data && isMounted) {
          let val = data.value;
          if (typeof val === 'string') {
            val = val === 'true';
          } else {
            val = Boolean(val);
          }
          setIsMaintenance(val);
        }

        // Only subscribe if table exists
        if (isMounted) {
          channel = supabase
            .channel("maintenance_toggle_sync")
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "system_settings",
                filter: "key=eq.maintenance_mode",
              },
              (payload) => {
                if (payload.new) {
                  let val = (payload.new as any).value;
                  if (typeof val === 'string') {
                    val = val === 'true';
                  } else {
                    val = Boolean(val);
                  }
                  if (isMounted) setIsMaintenance(val);
                }
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.warn("Failed to load maintenance status (table might be missing)", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void fetchStatus();

    return () => {
      isMounted = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  async function handleToggle() {
    if (isTableMissing) {
      addToast("جدول الإعدادات غير متوفر بعد في قاعدة البيانات", "error");
      return;
    }
    setIsUpdating(true);
    const nextState = !isMaintenance;
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key: "maintenance_mode", value: nextState });

      if (error) throw error;

      await logActivity(nextState ? "تفعيل وضع الصيانة" : "إلغاء وضع الصيانة", "النظام", "maintenance_mode", {
        state: nextState
      });

      setIsMaintenance(nextState);
      addToast(
        nextState 
          ? "تم تفعيل وضع الصيانة وحجب المنصة عن الزوار بنجاح" 
          : "تم إلغاء وضع الصيانة وإتاحة المنصة للجميع بنجاح",
        nextState ? "warning" : "success"
      );
    } catch (err) {
      console.error(err);
      addToast("حدث خطأ أثناء محاولة تعديل حالة الصيانة", "error");
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card p-4 flex items-center justify-between border border-white/60 bg-white/50 animate-pulse text-xs font-bold text-slate-400">
        جاري التحقق من إعدادات وضع الصيانة...
      </div>
    );
  }

  if (isTableMissing) {
    return (
      <div className="glass-card p-5 border border-amber-200/80 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/20 shadow-lg shadow-amber-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
              تنبيه: ميزة وضع الصيانة غير مفعلة برمجياً بعد
            </h4>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              لم يتم العثور على جدول إعدادات النظام `system_settings` في قاعدة البيانات. يرجى تشغيل استعلام SQL الخاص بملفات الهجرة لتثبيت وتفعيل لوحة التحكم بوضع الصيانة والتحقق بنجاح.
            </p>
          </div>
        </div>
        <div className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 shrink-0">
          بانتظار تثبيت SQL
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-card p-5 border transition-all duration-300 ${
      isMaintenance 
        ? "border-rose-200/80 bg-rose-50/40 dark:border-rose-900/30 dark:bg-rose-950/20 shadow-lg shadow-rose-500/5" 
        : "border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10"
    } flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-colors ${
          isMaintenance 
            ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" 
            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
        }`}>
          <ShieldAlert className={`h-5 w-5 ${isMaintenance ? "animate-pulse" : ""}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
              إيقاف المنصة مؤقتاً (وضع الصيانة)
            </h4>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isMaintenance ? "bg-rose-400" : "bg-emerald-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isMaintenance ? "bg-rose-500" : "bg-emerald-500"
              }`}></span>
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            {isMaintenance 
              ? "تنبيه: المنصة قيد الصيانة حالياً. تم حجب الواجهة العامة وجميع المستخدمين العاديين، ويُسمح فقط لمدراء النظام بالدخول وإدارة المحتوى."
              : "المنصة تعمل بشكل طبيعي ومتاحة للجميع. تفعيل هذا الخيار سيحجب الموقع فوراً عن كافة الزوار والمشرفين غير الإداريين."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
        <button
          onClick={handleToggle}
          disabled={isUpdating || !canUpdate}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            isMaintenance ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isMaintenance ? "-translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// Sub-component for editing general platform details
function GeneralSettingsPanel() {
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("users.assign_permissions");

  const [platformName, setPlatformName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.from("system_settings").select("key, value");
        if (error) throw error;
        
        if (data) {
          data.forEach((row: any) => {
            let val = row.value;
            if (typeof val === 'string') {
              try {
                val = JSON.parse(val);
              } catch (e) {
                // Keep as string
              }
            }
            switch(row.key) {
              case "platform_name": setPlatformName(String(val) || ""); break;
              case "contact_email": setContactEmail(String(val) || ""); break;
              case "contact_phone": setContactPhone(String(val) || ""); break;
              case "whatsapp_url": setWhatsappUrl(String(val) || ""); break;
              case "logo_url": setLogoUrl(String(val) || ""); break;
              case "social_links":
                if (val && typeof val === 'object') {
                  setFacebookUrl(val.facebook || "");
                  setTwitterUrl(val.twitter || "");
                  setInstagramUrl(val.instagram || "");
                }
                break;
            }
          });
        }
      } catch (err) {
        console.error("Failed to load platform settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      const socialLinks = {
        facebook: facebookUrl,
        twitter: twitterUrl,
        instagram: instagramUrl
      };

      await Promise.all([
        supabase.from("system_settings").upsert({ key: "platform_name", value: platformName }),
        supabase.from("system_settings").upsert({ key: "contact_email", value: contactEmail }),
        supabase.from("system_settings").upsert({ key: "contact_phone", value: contactPhone }),
        supabase.from("system_settings").upsert({ key: "whatsapp_url", value: whatsappUrl }),
        supabase.from("system_settings").upsert({ key: "logo_url", value: logoUrl }),
        supabase.from("system_settings").upsert({ key: "social_links", value: socialLinks }),
      ]);

      await logActivity("تحديث الإعدادات العامة للمنصة", "النظام", "system_settings", {
        platformName,
        contactEmail,
        contactPhone
      });

      addToast("تم حفظ إعدادات الهوية والاتصال بنجاح", "success");
    } catch (err) {
      console.error(err);
      addToast("حدث خطأ أثناء حفظ الإعدادات العامة", "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card p-12 text-center text-sm font-bold text-slate-500 border border-white/50 bg-white/40">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-slate-900" />
        جاري تحميل الهوية والإعدادات...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="bg-white/40 border border-white/60 p-4 rounded-3xl backdrop-blur-xl">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
          <Settings className="h-4 w-4 text-blue-500" />
          تعديل إعدادات الهوية والتواصل
        </h3>
        <p className="text-[11px] text-slate-500 font-bold mt-1">تحديد اسم المنصة وقنوات التواصل الاجتماعي والشعار لتحديثها تلقائياً بالمنصة.</p>
      </div>

      <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
        <fieldset disabled={!canUpdate} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 border-r-4 border-blue-500 pr-2">اسم المنصة / الجمعية</label>
            <input 
              className="glass-input text-sm" 
              placeholder="مثال: منصة رِفْق لرعاية الأيتام"
              value={platformName}
              onChange={e => setPlatformName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 border-r-4 border-blue-500 pr-2">رابط شعار المنصة (Logo URL)</label>
            <input 
              className="glass-input text-sm" 
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 border-r-4 border-blue-500 pr-2">البريد الإلكتروني الرسمي</label>
            <div className="relative">
              <input 
                type="email"
                className="glass-input text-sm pr-10" 
                placeholder="info@domain.com"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
              />
              <Mail className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 border-r-4 border-blue-500 pr-2">هاتف التواصل</label>
            <div className="relative">
              <input 
                className="glass-input text-sm pr-10" 
                placeholder="+970 599 123 456"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
              />
              <Phone className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 border-r-4 border-blue-500 pr-2">رابط واتساب المباشر</label>
            <div className="relative">
              <input 
                className="glass-input text-sm pr-10" 
                placeholder="https://wa.me/..."
                value={whatsappUrl}
                onChange={e => setWhatsappUrl(e.target.value)}
              />
              <Globe className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-3 border-r-4 border-blue-500 pr-2">روابط قنوات التواصل الاجتماعي</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <input 
                className="glass-input text-sm pr-10" 
                placeholder="رابط فيسبوك"
                value={facebookUrl}
                onChange={e => setFacebookUrl(e.target.value)}
              />
              <FacebookIcon className="absolute right-3.5 top-3.5 h-4 w-4 text-blue-600 pointer-events-none" />
            </div>
            <div className="relative">
              <input 
                className="glass-input text-sm pr-10" 
                placeholder="رابط تويتر / إكس"
                value={twitterUrl}
                onChange={e => setTwitterUrl(e.target.value)}
              />
              <TwitterIcon className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-800 pointer-events-none" />
            </div>
            <div className="relative">
              <input 
                className="glass-input text-sm pr-10" 
                placeholder="رابط إنستغرام"
                value={instagramUrl}
                onChange={e => setInstagramUrl(e.target.value)}
              />
              <InstagramIcon className="absolute right-3.5 top-3.5 h-4 w-4 text-pink-600 pointer-events-none" />
            </div>
          </div>
        </div>

        </fieldset>

        <div className="mt-8 flex justify-end pt-4 border-t border-slate-200">
          <button 
            onClick={handleSave} 
            disabled={isSaving || !canUpdate}
            className="primary-btn text-sm px-6 bg-gradient-to-l from-blue-600 to-cyan-500"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-component for displaying system-wide audit logs
function AuditLogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addToast } = useToast();

  async function loadLogs() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          id,
          action,
          entity_type,
          entity_id,
          metadata,
          created_at,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error(err);
      addToast("فشل في تحميل سجل العمليات والرقابة", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLogs();
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-sm font-bold text-slate-500 border border-white/50 bg-white/40">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-slate-900" />
        جاري جلب سجل العمليات والرقابة الفنية...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex justify-between items-center bg-white/40 border border-white/60 p-4 rounded-3xl backdrop-blur-xl">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-500" />
            سجل مراقبة وتتبع العمليات (Audit Logs)
          </h3>
          <p className="text-[11px] text-slate-500 font-bold mt-1">عرض آخر 50 عملية إدارية مسجلة على المنصة لضمان الشفافية والرقابة العالية.</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="secondary-btn text-xs font-black gap-1.5 shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          تحديث السجل
        </button>
      </div>

      <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
        {logs.length === 0 ? (
          <p className="text-center py-8 text-xs font-bold text-slate-500">لا توجد عمليات مسجلة في النظام بعد.</p>
        ) : (
          <div className="relative border-r-2 border-indigo-100 pr-6 space-y-6">
            {logs.map((log) => {
              const profile = log.profiles;
              const adminName = profile?.full_name || profile?.email || "مشرف غير معروف";
              const formattedDate = new Date(log.created_at).toLocaleString("ar-EG", {
                dateStyle: "medium",
                timeStyle: "short"
              });

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot */}
                  <span className="absolute -right-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-indigo-500 ring-4 ring-white shadow-sm transition-transform duration-300 group-hover:scale-125">
                    <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                  </span>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-xs font-black text-slate-800">
                        {adminName} <span className="text-slate-500 font-bold font-mono">({log.action})</span>
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">{formattedDate}</span>
                    </div>
                    {log.entity_type && (
                      <p className="text-[10px] font-extrabold text-indigo-600 mt-1">
                        القسم المتأثر: {log.entity_type} {log.entity_id ? `(مُعرّف: ${log.entity_id})` : ""}
                      </p>
                    )}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-[9px] bg-slate-50 font-mono text-slate-600 rounded-lg p-2 mt-1.5 border border-slate-100 overflow-x-auto text-left" dir="ltr">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for managing system uploads & sizes
function StorageRulesPanel() {
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("users.assign_permissions");

  const [maxSize, setMaxSize] = useState(10);
  const [allowedExtensions, setAllowedExtensions] = useState<string[]>(["pdf", "png", "jpg", "jpeg"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadStorageRules() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("system_settings")
          .select("key, value")
          .in("key", ["max_file_size", "allowed_extensions"]);

        if (error) throw error;
        
        if (data) {
          data.forEach((row: any) => {
            let val = row.value;
            if (typeof val === 'string') {
              try {
                val = JSON.parse(val);
              } catch (e) {
                // leave as is
              }
            }
            if (row.key === "max_file_size") {
              setMaxSize(Number(val) || 10);
            } else if (row.key === "allowed_extensions") {
              setAllowedExtensions(Array.isArray(val) ? val : ["pdf", "png", "jpg", "jpeg"]);
            }
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStorageRules();
  }, []);

  const handleToggleExtension = (ext: string) => {
    setAllowedExtensions(prev => 
      prev.includes(ext) ? prev.filter(e => e !== ext) : [...prev, ext]
    );
  };

  async function handleSave() {
    setIsSaving(true);
    try {
      await Promise.all([
        supabase.from("system_settings").upsert({ key: "max_file_size", value: maxSize }),
        supabase.from("system_settings").upsert({ key: "allowed_extensions", value: allowedExtensions })
      ]);

      await logActivity("تحديث قواعد رفع المرفقات والتخزين", "النظام", "storage_rules", {
        maxSize,
        allowedExtensions
      });

      addToast("تم حفظ قواعد رفع الملفات بنجاح", "success");
    } catch (err) {
      console.error(err);
      addToast("حدث خطأ أثناء حفظ قواعد التخزين", "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="glass-card p-12 text-center text-sm font-bold text-slate-500 border border-white/50 bg-white/40">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-slate-900" />
        جاري تحميل قواعد التخزين...
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="bg-white/40 border border-white/60 p-4 rounded-3xl backdrop-blur-xl">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
          <HardDrive className="h-4 w-4 text-amber-500" />
          تهيئة قواعد التخزين ورفع المستندات
        </h3>
        <p className="text-[11px] text-slate-500 font-bold mt-1">تحديد الحجم الأقصى ونوعية المرفقات الثبوتية التي يمكن للمتقدمين رفعها للمنصة.</p>
      </div>

      <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass">
        <fieldset disabled={!canUpdate} className="space-y-6">
        <div>
          <label className="block text-xs font-black text-slate-700 mb-2 border-r-4 border-amber-500 pr-2">الحجم الأقصى للملف الواحد (ميغابايت)</label>
          <div className="flex items-center gap-3 max-w-xs">
            <input 
              type="number"
              min="1"
              max="100"
              className="glass-input text-sm text-center" 
              value={maxSize}
              onChange={e => setMaxSize(Math.max(1, Number(e.target.value)))}
            />
            <span className="text-xs font-black text-slate-500 shrink-0">ميغابايت (MB)</span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-1">القيمة الافتراضية الموصى بها هي 10 ميغابايت لتجنب استنزاف مساحة التخزين.</p>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 mb-3 border-r-4 border-amber-500 pr-2">صيغ الملفات المسموح برفعها</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["pdf", "png", "jpg", "jpeg", "docx"].map(ext => (
              <label key={ext} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                allowedExtensions.includes(ext) ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-200 hover:border-amber-300"
              }`}>
                <input 
                  type="checkbox" 
                  checked={allowedExtensions.includes(ext)} 
                  onChange={() => handleToggleExtension(ext)}
                  className="h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <span className="text-xs font-black text-slate-800 uppercase font-mono">{ext}</span>
              </label>
            ))}
          </div>
        </div>

        </fieldset>

        <div className="mt-8 flex justify-end pt-4 border-t border-slate-200">
          <button 
            onClick={handleSave} 
            disabled={isSaving || !canUpdate}
            className="primary-btn text-sm px-6 bg-gradient-to-l from-amber-600 to-yellow-500"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {isSaving ? "جاري الحفظ..." : "حفظ القواعد الفنية"}
          </button>
        </div>
      </div>
    </div>
  );
}
