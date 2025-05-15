import { NextResponse } from "next/server";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// // Verificar las variables de entorno
// if (
//   !process.env.S3_ACCESS_KEY_ID ||
//   !process.env.S3_SECRET_ACCESS_KEY ||
//   !process.env.S3_BUCKET_NAME ||
//   !process.env.S3_ENDPOINT
// ) {
//   throw new Error(
//     "Missing required environment variables. Please check your .env.local file."
//   );
// }

// Agregamos headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET_NAME;

// Handler para preflight (OPTIONS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const { filename, parts } = await request.json();

    if (!filename || !parts) {
      throw new Error("Missing required fields: filename and parts");
    }

    console.log("Initializing upload for:", { filename, parts });

    // Usar el filename directamente sin UUID
    const key = filename;

    // 1. Inicializar el multipart upload
    const create = new CreateMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: "application/octet-stream",
      ACL: "public-read",
    });

    console.log("Sending create multipart upload command...");
    const { UploadId } = await s3.send(create);

    if (!UploadId) {
      throw new Error("Failed to get UploadId from S3");
    }

    console.log("Got UploadId:", UploadId);

    // 2. Generar presigned URLs para cada parte
    console.log("Generating presigned URLs...");
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

    console.log("Generated URLs for parts:", urls.length);

    return NextResponse.json(
      {
        uploadId: UploadId,
        key,
        urls,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error initializing multipart upload:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize upload",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
