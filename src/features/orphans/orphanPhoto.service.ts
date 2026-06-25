import { supabase } from "../../lib/supabase";

const BUCKET_NAME = "orphan-photos";

/**
 * Validates the file extension and size.
 * Allowed types: image/jpeg, image/png, image/webp
 * Max size: 5MB
 */
export function validateOrphanPhoto(file: File): { valid: boolean; error?: string } {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: "صيغة الملف غير مدعومة. يرجى اختيار صورة JPG أو PNG أو WebP." };
  }

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    return { valid: false, error: "حجم الصورة يتجاوز 5 ميجابايت." };
  }

  return { valid: true };
}

/**
 * Fetches all photo paths for an orphan from the DB.
 * Uses the `photo_paths` JSONB column (array of strings).
 * Falls back to `photo_path` (single string) for backward compatibility.
 */
export async function getOrphanPhotoPaths(orphanId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("orphans")
    .select("photo_path, photo_paths")
    .eq("id", orphanId)
    .maybeSingle();

  if (error || !data) {
    console.warn("[PhotoService] could not fetch photo paths:", error?.message);
    return [];
  }

  // photo_paths is a JSONB array — use it if available
  if (Array.isArray(data.photo_paths) && data.photo_paths.length > 0) {
    return data.photo_paths as string[];
  }

  // Fallback: photo_paths column may not exist yet — use photo_path
  if (data.photo_path) {
    return [data.photo_path as string];
  }

  return [];
}

/**
 * Uploads an orphan's photo to the 'orphan-photos' private bucket.
 * Appends the new path to the photo_paths array in the DB.
 * Returns the path in the storage on success.
 */
export async function uploadOrphanPhoto(orphanId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop();
  const timestamp = Date.now();
  const filePath = `${orphanId}/profile-${timestamp}.${extension}`;

  const { error: uploadError, data } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("حدث خطأ أثناء رفع الصورة.");
  }

  const newPath = data.path;

  // Fetch existing paths first, then append
  const existing = await getOrphanPhotoPaths(orphanId);
  const merged = [...new Set([...existing, newPath])]; // deduplicate

  const { error: updateError } = await supabase
    .from("orphans")
    .update({
      photo_path: newPath,           // keep latest as primary
      photo_paths: merged,           // store all paths
      photo_uploaded_at: new Date().toISOString(),
    })
    .eq("id", orphanId);

  if (updateError) {
    console.error("Update DB error:", updateError);
    // Best effort cleanup
    await supabase.storage.from(BUCKET_NAME).remove([newPath]);
    throw new Error("حدث خطأ أثناء حفظ مسار الصورة في قاعدة البيانات.");
  }

  return newPath;
}

/**
 * Creates a signed URL for viewing the photo. Valid for 1 hour.
 */
export async function getOrphanPhotoSignedUrl(photoPath: string): Promise<string | null> {
  if (!photoPath) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(photoPath, 60 * 60); // 1 hour

  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Deletes a single photo from storage and removes its path from the DB array.
 */
export async function deleteOrphanPhoto(
  photoPath: string,
  orphanId?: string
): Promise<void> {
  if (!photoPath) return;

  // 1. Remove from storage
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([photoPath]);
  if (error) {
    console.error("Delete photo error:", error);
    throw new Error("حدث خطأ أثناء حذف الصورة.");
  }

  // 2. Remove from photo_paths array in DB
  if (orphanId) {
    const existing = await getOrphanPhotoPaths(orphanId);
    const updated = existing.filter((p) => p !== photoPath);

    await supabase
      .from("orphans")
      .update({
        photo_paths: updated,
        // If deleted was the primary, promote the last remaining
        photo_path: updated.length > 0 ? updated[updated.length - 1] : null,
        photo_uploaded_at: updated.length > 0 ? new Date().toISOString() : null,
      })
      .eq("id", orphanId);
  }
}
