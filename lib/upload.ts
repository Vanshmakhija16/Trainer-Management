import { put } from "@vercel/blob";
import path from "node:path";

const RESUME_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export const RESUME_ACCEPT = ".pdf,.doc,.docx,.png,.jpg,.jpeg";
export const PHOTO_ACCEPT = ".png,.jpg,.jpeg,.webp";

/**
 * Single seam for file storage. Uploads a file to Vercel Blob (object storage)
 * and returns its public URL. This replaces the previous local-filesystem
 * implementation which does not work on Vercel's read-only, ephemeral runtime.
 *
 * Requires the BLOB_READ_WRITE_TOKEN environment variable to be set.
 * In Vercel: Storage → Blob → Connect to project (auto-injected).
 * Locally: copy the token from the Vercel dashboard into .env.local.
 */
async function saveFile(
  file: File | null,
  options: { folder: string; allowed: Set<string>; errorMessage: string },
): Promise<string | null> {
  if (!file || !file.size) {
    return null;
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!options.allowed.has(ext)) {
    throw new Error(options.errorMessage);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const pathname = `${options.folder}/${Date.now()}-${safeName}`;

  const { url } = await put(pathname, file, {
    access: "public",
    // Content type is inferred automatically by Vercel Blob from the file.
  });

  return url;
}

/** Uploads a resume to Vercel Blob under the /resumes prefix. */
export function saveResume(file: File | null): Promise<string | null> {
  return saveFile(file, {
    folder: "resumes",
    allowed: RESUME_EXTENSIONS,
    errorMessage:
      "Unsupported file type. Upload a PDF, DOC, DOCX, PNG, or JPG.",
  });
}

/** Uploads a profile photo to Vercel Blob under the /photos prefix. */
export function savePhoto(file: File | null): Promise<string | null> {
  return saveFile(file, {
    folder: "photos",
    allowed: IMAGE_EXTENSIONS,
    errorMessage: "Unsupported image type. Upload a PNG, JPG, WEBP, or GIF.",
  });
}
