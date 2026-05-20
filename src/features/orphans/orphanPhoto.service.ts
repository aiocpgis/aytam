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
 * Uploads an orphan's photo to the 'orphan-photos' private bucket.
 * Returns the path in the storage on success.
 */
export async function uploadOrphanPhoto(orphanId: string, file: File): Promise<string> {
  const extension = file.name.split(".").pop();
  const timestamp = Date.now();
  const filePath = `${orphanId}/profile-${timestamp}.${extension}`;

  const { error: uploadError, data } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("حدث خطأ أثناء رفع الصورة.");
  }

  // Update the orphans table with the new photo_path and uploaded timestamp
  const { error: updateError } = await supabase
    .from("orphans")
    .update({
      photo_path: data.path,
      photo_uploaded_at: new Date().toISOString(),
    })
    .eq("id", orphanId);

  if (updateError) {
    console.error("Update DB error:", updateError);
    // Best effort cleanup
    await supabase.storage.from(BUCKET_NAME).remove([data.path]);
    throw new Error("حدث خطأ أثناء حفظ مسار الصورة في قاعدة البيانات.");
  }

  return data.path;
}

/**
 * Creates a signed URL for viewing the photo. Valid for 10 minutes.
 */
export async function getOrphanPhotoSignedUrl(photoPath: string): Promise<string | null> {
  if (!photoPath) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(photoPath, 60 * 10); // 600 seconds = 10 minutes

  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Deletes the photo from the storage bucket.
 */
export async function deleteOrphanPhoto(photoPath: string): Promise<void> {
  if (!photoPath) return;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([photoPath]);

  if (error) {
    console.error("Delete photo error:", error);
    throw new Error("حدث خطأ أثناء حذف الصورة.");
  }
}
