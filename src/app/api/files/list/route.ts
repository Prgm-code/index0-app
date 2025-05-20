import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Función para formatear bytes a unidad legible
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = 2; // decimales
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

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

const BUCKET = process.env.S3_BUCKET_NAME || "";

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const prefix = (searchParams.get("prefix") || "").replace(/^\/+/, "");

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

    return NextResponse.json({
      prefix,
      files,
      folders,
      totalSizeBytes, // 42792364
      totalSize, // "40.79 MB"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `${error.name || "Error"}: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
