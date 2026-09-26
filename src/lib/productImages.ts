import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_IMAGES_BUCKET = "product-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

export async function createProductImageUrlMap(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  const urls = new Map<string, string>();

  if (!uniquePaths.length) return urls;

  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

  if (error) throw error;

  data?.forEach((image) => {
    if (image.path && image.signedUrl) urls.set(image.path, image.signedUrl);
  });

  return urls;
}

function safeFileName(fileName: string) {
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "")}`
    : "";
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${base || "image"}${extension}`;
}

export async function uploadProductImages(productId: string, files: File[]) {
  const uploadedPaths: string[] = [];

  try {
    for (const file of files) {
      const path = `${productId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;
      uploadedPaths.push(path);
    }
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(uploadedPaths);
    }
    throw error;
  }

  return uploadedPaths;
}

export async function removeProductImages(paths: string[]) {
  if (!paths.length) return;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(paths);
  if (error) throw error;
}

