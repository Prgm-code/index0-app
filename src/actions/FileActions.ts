"use server";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_STORAGE = process.env.MAX_STORAGE || 209715200;
const BUCKET = process.env.S3_BUCKET_NAME || "";
const CUSTOM_DOMAIN = process.env.S3_CUSTOMISE_URL || "";

// Configurar el cliente S3 para R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

// Función para formatear bytes a unidad legible
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = 2; // decimales
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export async function listFiles(data: { prefix: string; clerkId: string }) {
  try {
    const [sessionClaims, client] = await Promise.all([auth(), clerkClient()]);

    if (sessionClaims?.userId !== data.clerkId) {
      return { error: "Unauthorized", success: false };
    }

    if (
      !process.env.S3_ENDPOINT ||
      !process.env.S3_ACCESS_KEY_ID ||
      !process.env.S3_SECRET_ACCESS_KEY ||
      !BUCKET
    ) {
      throw new Error(
        "Missing required environment variables for R2 configuration"
      );
    }

    const { prefix } = data;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      Delimiter: "/",
    });
    const response = await s3.send(command);

    const files = (response.Contents || [])
      .filter((item) => item.Key && item.Key !== prefix)
      .map((item) => ({
        key: item.Key || "",
        size: item.Size || 0,
        lastModified:
          item.LastModified?.toISOString() ?? new Date().toISOString(),
        type: "file",
      }));

    const folders = (response.CommonPrefixes || [])
      .filter((p) => p.Prefix && p.Prefix !== prefix)
      .map((p) => ({
        key: p.Prefix || "",
        type: "folder",
      }));

    // Cálculo del tamaño total
    const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);
    const totalSize = formatBytes(totalSizeBytes);

    await client.users.updateUserMetadata(data.clerkId, {
      privateMetadata: {
        filesSize: totalSizeBytes,
        maxStorage: MAX_STORAGE,
      },
    });

    return {
      success: true,
      prefix,
      files,
      folders,
      totalSizeBytes,
      totalSize,
    };
  } catch (error: any) {
    return {
      error: `${error.name || "Error"}: ${error.message}`,
      success: false,
    };
  }
}

export async function deleteFile(data: { key: string; clerkId: string }) {
  try {
    const sessionClaims = await auth();

    if (sessionClaims?.userId !== data.clerkId) {
      return { error: "Unauthorized", success: false };
    }

    if (
      !process.env.S3_ENDPOINT ||
      !process.env.S3_ACCESS_KEY_ID ||
      !process.env.S3_SECRET_ACCESS_KEY ||
      !BUCKET
    ) {
      throw new Error(
        "Missing required environment variables for R2 configuration"
      );
    }

    if (!data.key) {
      return { error: "Key parameter is required", success: false };
    }

    // console.log("Deleting file:", { key: data.key });

    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: data.key,
    });

    await s3.send(command);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting file:", error);
    return {
      error: error.message || "Failed to delete file",
      success: false,
    };
  }
}

export async function getFileUrl(data: { key: string }) {
  try {
    const sessionClaims = await auth();

    if (
      !process.env.S3_ENDPOINT ||
      !process.env.S3_ACCESS_KEY_ID ||
      !process.env.S3_SECRET_ACCESS_KEY ||
      !BUCKET
    ) {
      throw new Error(
        "Missing required environment variables for R2 configuration"
      );
    }

    if (!data.key) {
      return { error: "Key parameter is required", success: false };
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: data.key,
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 600, // 10 minutos
    });

    // Crear una URL con el dominio personalizado que incluye el token presignado
    let url = presignedUrl;

    if (CUSTOM_DOMAIN) {
      const customUrl = new URL(data.key, CUSTOM_DOMAIN);
      // Agregar los parámetros de autenticación de la URL presignada
      const presignedParams = new URL(presignedUrl).searchParams;
      presignedParams.forEach((value, key) => {
        customUrl.searchParams.append(key, value);
      });
      url = customUrl.toString();
    }

    return {
      success: true,
      url,
      presignedUrl,
    };
  } catch (error: any) {
    console.error("Error generating presigned URL:", error);
    return {
      error: error.message || "Failed to generate URL",
      success: false,
    };
  }
}
