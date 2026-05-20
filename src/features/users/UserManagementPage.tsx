import { useEffect, useState } from "react";
import { UserCog, ShieldCheck, ShieldAlert, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { UserProfile, Role, Permission } from "../../types/user.types";
import { getAllRoles, getAllPermissions } from "./permissions.service";
import { usePermissions } from "../../hooks/usePermissions";
import { AlertDialog } from "../../components/ui/AlertDialog";
import { useToast } from "../../components/ui/ToastProvider";

export function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const { hasPermission } = usePermissions();

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
    
    if (hasPermission("users.view")) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [hasPermission]);

  if (!hasPermission("users.view")) {
    return (
      <div className="glass-card p-12 text-center border border-rose-200 bg-rose-50/50">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-black text-rose-900">صلاحيات غير كافية</h2>
        <p className="text-sm font-bold text-rose-600 mt-2">عذراً، ليس لديك الصلاحية لعرض هذه الصفحة.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-card p-12 text-center text-sm font-bold text-slate-500 border border-white/50 bg-white/40">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-slate-900" />
        جاري تحميل نظام الصلاحيات والمستخدمين...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 border border-white/60 bg-white/50 shadow-glass flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-800">نظام إدارة المستخدمين والصلاحيات</h3>
          </div>
          <p className="text-xs font-bold text-slate-500 mb-6">
            إدارة حسابات مشرفي المنصة وتخصيص الأدوار والصلاحيات للتحكم بالوصول.
          </p>
        </div>

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
                    {hasPermission("users.assign_permissions") && (
                      <button 
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                        className="text-xs font-black text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        الصلاحيات
                      </button>
                    )}
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
      </div>

      {/* Selected User Permissions Panel */}
      {selectedUser && hasPermission("users.assign_permissions") && (
        <UserPermissionsPanel 
          user={selectedUser} 
          allRoles={roles} 
          allPermissions={permissions} 
          onClose={() => setSelectedUser(null)} 
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
  onClose 
}: { 
  user: UserProfile, 
  allRoles: Role[], 
  allPermissions: Permission[], 
  onClose: () => void 
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles?.map(r => r.id) || []);
  const [overrides, setOverrides] = useState<Record<string, "allow"|"deny">>({});
  const { addToast } = useToast();
  
  useEffect(() => {
    // Fetch overrides for user
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
      // 1. Save Roles
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      if (selectedRoles.length > 0) {
        await supabase.from("user_roles").insert(
          selectedRoles.map(role_id => ({ user_id: user.id, role_id }))
        );
      }

      // 2. Save Overrides
      await supabase.from("user_permissions").delete().eq("user_id", user.id);
      const overrideInserts = Object.entries(overrides).map(([permission_id, effect]) => ({
        user_id: user.id,
        permission_id,
        effect
      }));
      if (overrideInserts.length > 0) {
        await supabase.from("user_permissions").insert(overrideInserts);
      }

      addToast("تم حفظ الصلاحيات بنجاح", "success");
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
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
