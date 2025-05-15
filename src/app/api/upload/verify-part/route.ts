import { NextResponse } from "next/server";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET_NAME!;

export async function POST(request: Request) {
  try {
    const { key, uploadId, partNumber } = await request.json();

    const command = new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const response = await s3.send(command);
    const etag = response.ETag;

    if (!etag) {
      return NextResponse.json(
        { error: "No ETag found for part" },
        { status: 404 }
      );
    }

    return NextResponse.json({ etag });
  } catch (error) {
    console.error("Error verifying part:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify part",
      },
      { status: 500 }
    );
  }
}
