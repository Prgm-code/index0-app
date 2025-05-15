import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

export async function POST(request: Request) {
  try {
    const { path, reportId } = await request.json();

    if (!path || !reportId) {
      return NextResponse.json(
        { error: "Path and reportId are required" },
        { status: 400 }
      );
    }

    // Normalizar el path: eliminar múltiples slashes y espacios
    let normalizedPath = path
      .split("/")
      .filter(Boolean) // Eliminar elementos vacíos
      .join("/");

    // Construir el path completo
    let fullPath = `${reportId}/${normalizedPath}/`;

    // Asegurarse de que no haya duplicación del reportId
    fullPath = fullPath.replace(
      new RegExp(`^${reportId}/${reportId}/`),
      `${reportId}/`
    );

    // Eliminar cualquier slash múltiple que pueda haberse creado
    fullPath = fullPath.replace(/\/+/g, "/");

    // Validar que el nombre de la carpeta no contenga caracteres inválidos
    const folderName = normalizedPath.split("/").pop();
    if (folderName && /[<>:"/\\|?*\x00-\x1F]/.test(folderName)) {
      return NextResponse.json(
        {
          error:
            'Invalid folder name. Folder names cannot contain: < > : " / \\ | ? *',
        },
        { status: 400 }
      );
    }

    // En S3/R2, las carpetas son objetos vacíos que terminan en /
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: fullPath,
      Body: "", // Objeto vacío
    });

    await s3.send(command);

    return NextResponse.json({
      success: true,
      path: fullPath,
      reportId,
    });
  } catch (error) {
    console.error("Error creating folder:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create folder",
      },
      { status: 500 }
    );
  }
}
