import "server-only";
import { activeStorageProvider } from "@/lib/env";
import { presignDownload as s3Download, presignUpload as s3Upload } from "@/lib/aws/s3";
import {
  supabasePresignDownload,
  supabasePresignUpload,
} from "@/lib/supabase/storage";

export { assertUploadType } from "@/lib/storage/types";

export async function presignUpload(input: {
  userId: string;
  folder: "avatars" | "projects" | "documents";
  contentType: string;
  byteSize: number;
}): Promise<{ url: string; key: string; expiresIn: number }> {
  const provider = activeStorageProvider();
  if (provider === "supabase") {
    return supabasePresignUpload(input);
  }
  if (provider === "s3") {
    return s3Upload(input);
  }
  throw new Error("File storage is not configured.");
}

export async function presignDownload(key: string): Promise<string> {
  const provider = activeStorageProvider();
  if (provider === "supabase") {
    return supabasePresignDownload(key);
  }
  if (provider === "s3") {
    return s3Download(key);
  }
  throw new Error("File storage is not configured.");
}
