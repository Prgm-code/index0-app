"use server";

import {
  S3Client,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserMetadata } from "./clerck-actions";

// Create S3 client
const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET_NAME || "";
const CUSTOM_DOMAIN = process.env.S3_CUSTOMISE_URL || "";

/**
 * Initialize a multipart upload
 */
export async function initializeUpload(data: {
  filename: string;
  parts: number;
  fileSize?: number; // Optional file size parameter
}) {
  try {
    const [sessionClaims, client] = await Promise.all([auth(), clerkClient()]);

    if (!sessionClaims?.userId) {
      throw new Error("Unauthorized: User not authenticated");
    }

    const user = await client.users.getUser(sessionClaims.userId);
    const userMetadata = user.privateMetadata;

    // console.log(userMetadata);

    // Check storage limits
    const currentUsage = (userMetadata.filesSize as number) || 0;
    const maxStorage =
      (userMetadata.maxStorage as number) ||
      Number(process.env.MAX_STORAGE || 209715200);

    // If file size is provided, check if it would exceed the limit
    if (data.fileSize && currentUsage + data.fileSize > maxStorage) {
      throw new Error(
        `Upload would exceed your storage limit of ${formatBytes(
          maxStorage
        )}. Current usage: ${formatBytes(currentUsage)}`
      );
    }

    // Even without file size, reject if already at limit
    if (currentUsage >= maxStorage) {
      throw new Error(
        `You have reached your storage limit of ${formatBytes(maxStorage)}`
      );
    }

    const { filename, parts } = data;

    if (!filename || !parts) {
      throw new Error("Missing required fields: filename and parts");
    }

    // Use filename directly as the key
    const key = filename;

    // Initialize multipart upload
    const create = new CreateMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: "application/octet-stream",
      ACL: "public-read",
    });

    const { UploadId } = await s3.send(create);

    if (!UploadId) {
      throw new Error("Failed to get UploadId from S3");
    }

    // Generate presigned URLs for each part
    const urls = await Promise.all(
      Array.from({ length: parts }, (_, i) =>
        getSignedUrl(
          s3,
          new UploadPartCommand({
            Bucket: BUCKET,
            Key: key,
            UploadId,
            PartNumber: i + 1,
          }),
          { expiresIn: 3600 }
        )
      )
    );

    return {
      uploadId: UploadId,
      key,
      urls,
    };
  } catch (error) {
    console.error("Error initializing multipart upload:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to initialize upload"
    );
  }
}

// Helper function to format bytes to readable format
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = 2; // decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Complete a multipart upload
 */
export async function completeUpload(data: {
  key: string;
  uploadId: string;
  partsInfo: { PartNumber: number; ETag: string }[];
  fileSize: number; // Add file size parameter for storage tracking
}) {
  try {
    const sessionClaims = await auth();

    if (!sessionClaims?.userId) {
      throw new Error("Unauthorized: User not authenticated");
    }

    const { key, uploadId, partsInfo, fileSize } = data;

    const complete = new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: partsInfo },
    });

    const result = await s3.send(complete);

    // Update user's storage usage in private metadata
    const client = await clerkClient();
    const user = await client.users.getUser(sessionClaims.userId);
    const currentUsage = (user.privateMetadata.filesSize as number) || 0;

    await client.users.updateUserMetadata(sessionClaims.userId, {
      privateMetadata: {
        ...user.privateMetadata,
        filesSize: currentUsage + fileSize,
      },
    });

    return {
      success: true,
      location: result.Location,
      key,
    };
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to complete upload"
    );
  }
}

/**
 * Generate presigned URL for object access
 */
export async function getPresignedUrl(key: string) {
  try {
    if (!key) {
      throw new Error("Key parameter is required");
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 600, // 10 minutes
    });

    // Create a URL with the custom domain that includes the presigned token
    const customUrl = new URL(key, CUSTOM_DOMAIN);

    // Add authentication parameters from the presigned URL
    const presignedParams = new URL(presignedUrl).searchParams;
    presignedParams.forEach((value, key) => {
      customUrl.searchParams.append(key, value);
    });

    return {
      url: customUrl.toString(),
      presignedUrl, // Also send the original URL if needed
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate URL"
    );
  }
}
