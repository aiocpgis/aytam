import { useState, useRef, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2, User, Loader2, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  validateOrphanPhoto,
  uploadOrphanPhoto,
  getOrphanPhotoSignedUrl,
  deleteOrphanPhoto,
} from "./orphanPhoto.service";

interface OrphanPhotoUploaderProps {
  orphanId?: string;
  currentPhotoPath?: string | null;
  onUploaded?: (photoPath: string) => void;
}

interface PhotoItem {
  path: string;
  url: string | null;
  loadingUrl: boolean;
}

const BUCKET_NAME = "orphan-photos";

/**
 * List all photos stored under `orphanId/` in the bucket.
 * Falls back gracefully if the Storage LIST policy is restricted.
 */
async function listOrphanPhotos(orphanId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(orphanId, { sortBy: { column: "created_at", order: "asc" } });

    if (error) {
      console.warn("[PhotoUploader] storage.list error:", error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data
      .filter(
        (f) =>
          f.name !== ".emptyFolderPlaceholder" &&
          f.name !== "" &&
          f.metadata !== null           // real files have metadata; folders don't
      )
      .map((f) => `${orphanId}/${f.name}`);
  } catch (err) {
    console.warn("[PhotoUploader] unexpected list error:", err);
    return [];
  }
}

export function OrphanPhotoUploader({
  orphanId,
  currentPhotoPath,
  onUploaded,
}: OrphanPhotoUploaderProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Resolve a storage path → signed URL */
  const resolveUrl = useCallback(async (path: string): Promise<string | null> => {
    return getOrphanPhotoSignedUrl(path);
  }, []);

  /** Build the photo list and resolve signed URLs for each */
  const refreshPhotos = useCallback(async () => {
    setLoadingList(true);
    try {
      let paths: string[] = [];

      if (orphanId) {
        // ── Primary: list everything under orphanId/ in storage ──
        paths = await listOrphanPhotos(orphanId);
        console.log("[PhotoUploader] storage.list returned:", paths);
      }

      // ── Fallback: if listing returned nothing, use the DB photo_path ──
      if (paths.length === 0 && currentPhotoPath) {
        console.log("[PhotoUploader] fallback to currentPhotoPath:", currentPhotoPath);
        paths = [currentPhotoPath];
      }

      if (paths.length === 0) {
        setPhotos([]);
        return;
      }

      // Show placeholder tiles while URLs load
      setPhotos(paths.map((p) => ({ path: p, url: null, loadingUrl: true })));

      // Resolve all signed URLs in parallel
      const urls = await Promise.all(paths.map(resolveUrl));
      setPhotos(
        paths.map((p, i) => ({ path: p, url: urls[i], loadingUrl: false }))
      );
    } catch (err) {
      console.error("[PhotoUploader] refreshPhotos error:", err);
    } finally {
      setLoadingList(false);
    }
  }, [orphanId, currentPhotoPath, resolveUrl]);

  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  /* ── Upload handler ── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError(null);
    setSuccess(null);

    if (!file) return;

    const validation = validateOrphanPhoto(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    if (!orphanId) {
      setError("احفظ بيانات اليتيم أولاً قبل رفع الصورة.");
      return;
    }

    setIsUploading(true);
    try {
      const newPath = await uploadOrphanPhoto(orphanId, file);
      setSuccess("تم رفع الصورة بنجاح.");
      setTimeout(() => setSuccess(null), 3000);
      if (onUploaded) onUploaded(newPath);
      await refreshPhotos();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الرفع.");
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Delete handler ── */
  const handleDelete = async (path: string) => {
    setError(null);
    setDeletingPath(path);
    try {
      await deleteOrphanPhoto(path);

      // If deleted photo was the main photo_path, clear it in DB
      if (orphanId && path === currentPhotoPath) {
        await supabase
          .from("orphans")
          .update({ photo_path: null, photo_uploaded_at: null })
          .eq("id", orphanId);
      }

      setPhotos((prev) => prev.filter((p) => p.path !== path));
      setSuccess("تم حذف الصورة بنجاح.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "فشل حذف الصورة.");
    } finally {
      setDeletingPath(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/80 px-3 py-2 text-xs font-bold text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {success}
        </div>
      )}

      {/* Photos grid */}
      <div className="flex flex-wrap gap-3">
        {loadingList ? (
          /* Loading placeholder */
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 w-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))
        ) : photos.length === 0 ? (
          /* Empty state */
          <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-400">
            <User className="h-7 w-7" />
            <span className="text-[9px] font-bold">لا توجد صور</span>
          </div>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.path}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"
            >
              {photo.loadingUrl ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                </div>
              ) : photo.url ? (
                <img
                  src={photo.url}
                  alt="صورة اليتيم"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // URL expired — hide broken image
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-8 w-8 text-slate-300" />
                </div>
              )}

              {/* Delete overlay on hover */}
              <button
                type="button"
                title="حذف الصورة"
                onClick={() => handleDelete(photo.path)}
                disabled={deletingPath === photo.path}
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/50 group-hover:opacity-100"
              >
                {deletingPath === photo.path ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Trash2 className="h-5 w-5 text-white drop-shadow" />
                )}
              </button>
            </div>
          ))
        )}

        {/* Add photo button */}
        <button
          type="button"
          title="إضافة صورة جديدة"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 text-blue-500 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span className="text-[9px] font-extrabold">إضافة صورة</span>
            </>
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
      />

      <p className="text-[10px] font-bold text-slate-400">
        JPG / PNG / WebP — الحد الأقصى 5MB لكل صورة
      </p>
    </div>
  );
}
