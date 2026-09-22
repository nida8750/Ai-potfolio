import "server-only";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { assertUploadType } from "@/lib/storage/types";
import { createId } from "@/lib/data/ids";

const SIGNED_UPLOAD_SECONDS = 60;
const SIGNED_DOWNLOAD_SECONDS = 120;

export async function supabasePresignUpload(input: {
  userId: string;
  folder: "avatars" | "projects" | "documents";
  contentType: string;
  byteSize: number;
}): Promise<{ url: string; key: string; expiresIn: number }> {
  const ext = assertUploadType(input.contentType, input.byteSize);
  const key = `${input.folder}/${input.userId}/${createId()}.${ext}`;
  const { data, error } = await supabaseAdmin()
    .storage.from(env.supabaseStorageBucket)
    .createSignedUploadUrl(key);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not create a signed upload URL.");
  }

  return { url: data.signedUrl, key, expiresIn: SIGNED_UPLOAD_SECONDS };
}

export async function supabasePresignDownload(key: string): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .storage.from(env.supabaseStorageBucket)
    .createSignedUrl(key, SIGNED_DOWNLOAD_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Could not create a signed download URL.");
  }
  return data.signedUrl;
}
