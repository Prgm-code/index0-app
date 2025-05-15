import { NextResponse } from "next/server";
import { S3Client, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET_NAME!;

export async function POST(request: Request) {
  try {
    const { key, uploadId, partsInfo } = await request.json();

    const complete = new CompleteMultipartUploadCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: partsInfo },
    });

    const result = await s3.send(complete);

    return NextResponse.json({
      success: true,
      location: result.Location,
      key,
    });
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to complete upload",
      },
      { status: 500 }
    );
  }
}
