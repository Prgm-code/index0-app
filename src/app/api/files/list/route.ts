import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Configurar el cliente S3 para R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Importante para R2
});

const BUCKET = process.env.S3_BUCKET_NAME || "";

export async function GET(request: Request) {
  try {
    // Verificar configuración
    if (
      !process.env.S3_ENDPOINT ||
      !process.env.S3_ACCESS_KEY_ID ||
      !process.env.S3_SECRET_ACCESS_KEY ||
      !BUCKET
    ) {
      console.error("Missing env vars:", {
        endpoint: !!process.env.S3_ENDPOINT,
        accessKey: !!process.env.S3_ACCESS_KEY_ID,
        secretKey: !!process.env.S3_SECRET_ACCESS_KEY,
        bucket: !!BUCKET,
      });
      throw new Error(
        "Missing required environment variables for R2 configuration"
      );
    }

    const { searchParams } = new URL(request.url);
    let prefix = searchParams.get("prefix") || "";

    // Limpiar el prefix
    prefix = prefix.replace(/^\/+/, "");

    console.log("Config:", {
      endpoint: process.env.S3_ENDPOINT,
      bucket: BUCKET,
      prefix: prefix,
    });

    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        Delimiter: "/",
      });

      const response = await s3.send(command);
      console.log("R2 response success:", JSON.stringify(response, null, 2));

      // Procesar los resultados
      const files = (response.Contents || [])
        .filter((item) => item.Key && item.Key !== prefix)
        .map((item) => ({
          key: item.Key || "",
          size: item.Size || 0,
          lastModified:
            item.LastModified?.toISOString() || new Date().toISOString(),
          type: "file",
        }));

      const folders = (response.CommonPrefixes || [])
        .filter((p) => p.Prefix && p.Prefix !== prefix)
        .map((prefix) => ({
          key: prefix.Prefix || "",
          type: "folder",
        }));

      return NextResponse.json({
        files,
        folders,
        prefix,
      });
    } catch (listError) {
      console.error("Error in ListObjectsV2Command:", listError);
      throw listError;
    }
  } catch (error) {
    console.error("Error listing files:", error);

    let errorMessage = "Failed to list files";
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// CORS headers
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
