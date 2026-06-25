import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { getOrphanPhotoSignedUrl } from "../../features/orphans/orphanPhoto.service";

interface OrphanAvatarProps {
  photoPath?: string | null;
  childName: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const iconClassMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const urlCache = new Map<string, string | null>();

export function OrphanAvatar({ photoPath, childName, size = "sm" }: OrphanAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null | undefined>(
    photoPath ? urlCache.get(photoPath) : undefined
  );

  useEffect(() => {
    if (!photoPath) {
      setPhotoUrl(null);
      return;
    }

    if (urlCache.has(photoPath)) {
      setPhotoUrl(urlCache.get(photoPath)!);
      return;
    }

    let cancelled = false;
    getOrphanPhotoSignedUrl(photoPath).then((url) => {
      urlCache.set(photoPath, url);
      if (!cancelled) setPhotoUrl(url);
    });

    return () => { cancelled = true; };
  }, [photoPath]);

  const sizeClass = sizeMap[size];
  const iconClass = iconClassMap[size];

  return (
    <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center`}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={childName}
          className="h-full w-full object-cover"
        />
      ) : (
        <User className={`${iconClass} text-slate-400`} />
      )}
    </div>
  );
}
