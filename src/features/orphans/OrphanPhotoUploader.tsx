import { useState, useRef, useEffect } from "react";
import { Upload, X, AlertCircle, CheckCircle2, User, Loader2 } from "lucide-react";
import { 
  validateOrphanPhoto, 
  uploadOrphanPhoto, 
  getOrphanPhotoSignedUrl 
} from "./orphanPhoto.service";

interface OrphanPhotoUploaderProps {
  orphanId?: string;
  currentPhotoPath?: string | null;
  onUploaded?: (photoPath: string) => void;
}

export function OrphanPhotoUploader({ orphanId, currentPhotoPath, onUploaded }: OrphanPhotoUploaderProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the current photo via Signed URL if photo path exists
  useEffect(() => {
    let isMounted = true;
    async function fetchPhotoUrl() {
      if (!currentPhotoPath) {
        setPhotoUrl(null);
        return;
      }
      setLoadingUrl(true);
      try {
        const url = await getOrphanPhotoSignedUrl(currentPhotoPath);
        if (isMounted) setPhotoUrl(url);
      } catch (err) {
        console.error("Failed to load photo", err);
      } finally {
        if (isMounted) setLoadingUrl(false);
      }
    }
    fetchPhotoUrl();

    return () => { isMounted = false; };
  }, [currentPhotoPath]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccess(null);
    setSelectedFile(null);
    setPreviewUrl(null);

    if (!file) return;

    const validation = validateOrphanPhoto(file);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!orphanId) {
      setError("لا يمكن رفع الصورة قبل إضافة وحفظ بيانات اليتيم أولاً.");
      return;
    }

    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const newPath = await uploadOrphanPhoto(orphanId, selectedFile);
      setSuccess("تم رفع صورة الطفل بنجاح.");
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Load the new signed URL
      const newUrl = await getOrphanPhotoSignedUrl(newPath);
      if (newUrl) setPhotoUrl(newUrl);

      if (onUploaded) {
        onUploaded(newPath);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع أثناء رفع الصورة.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 rounded-3xl border border-white/60 bg-white/40 backdrop-blur-xl shadow-sm w-full max-w-sm">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-soft bg-slate-50 flex items-center justify-center">
        {loadingUrl ? (
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        ) : previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : photoUrl ? (
          <img src={photoUrl} alt="Orphan" className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 text-slate-300" />
        )}
      </div>

      <div className="flex flex-col w-full gap-3 text-center">
        <p className="text-xs font-bold text-slate-500">
          اختر صورة شخصية للطفل (JPG/PNG/WebP, الحد الأقصى 5MB)
        </p>

        {error && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold justify-center">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold justify-center">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {!selectedFile ? (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 w-full"
            >
              <Upload className="w-4 h-4" />
              اختيار صورة
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !orphanId}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  اعتماد الرفع
                </>
              )}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={isUploading}
              className="inline-flex items-center justify-center rounded-2xl bg-white border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
