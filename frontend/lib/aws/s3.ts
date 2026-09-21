import "server-only";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, isS3Configured } from "@/lib/env";
import { createId } from "@/lib/data/ids";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

const MAX_BYTES = 8 * 1024 * 1024;

let client: S3Client | undefined;

function s3(): S3Client {
  if (!isS3Configured() || !env.s3BucketName || !env.awsRegion) {
    throw new Error("S3 is not configured.");
  }
  if (!client) {
    client = new S3Client({ region: env.awsRegion });
  }
  return client;
}

export function assertUploadType(contentType: string, byteSize: number): string {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    throw new Error("File type is not allowed.");
  }
  if (byteSize > MAX_BYTES) {
    throw new Error("File is too large.");
  }
  return ext;
}

export async function presignUpload(input: {
  userId: string;
  folder: "avatars" | "projects" | "documents";
  contentType: string;
  byteSize: number;
}): Promise<{ url: string; key: string; expiresIn: number }> {
  const ext = assertUploadType(input.contentType, input.byteSize);
  const key = `${input.folder}/${input.userId}/${createId()}.${ext}`;
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: env.s3BucketName,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.byteSize,
      ServerSideEncryption: "AES256",
    }),
    { expiresIn: 60 },
  );
  return { url, key, expiresIn: 60 };
}

export async function presignDownload(key: string): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: env.s3BucketName,
      Key: key,
    }),
    { expiresIn: 120 },
  );
}