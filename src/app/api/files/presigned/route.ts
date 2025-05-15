import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
const CUSTOM_DOMAIN = process.env.S3_CUSTOMISE_URL || "";
console.log("CUSTOM_DOMAIN", CUSTOM_DOMAIN);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Key parameter is required" },
        { status: 400 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 600, // 10 minutos
    });

    // Crear una URL con el dominio personalizado que incluye el token presignado
    const customUrl = new URL(key, CUSTOM_DOMAIN);
    // Agregar los parámetros de autenticación de la URL presignada
    const presignedParams = new URL(presignedUrl).searchParams;
    presignedParams.forEach((value, key) => {
      customUrl.searchParams.append(key, value);
    });

    return NextResponse.json({
      url: customUrl.toString(),
      presignedUrl, // También enviamos la URL original por si es necesaria
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate URL",
      },
      { status: 500 }
    );
  }
}
