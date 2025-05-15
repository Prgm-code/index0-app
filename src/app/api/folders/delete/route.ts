import { NextResponse } from "next/server";
import {
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix");

    if (!prefix) {
      return NextResponse.json(
        { error: "Prefix parameter is required" },
        { status: 400 }
      );
    }

    console.log("Deleting folder:", { prefix });

    // Asegurarse de que el prefix termine con /
    const folderPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

    // 1. Listar todos los objetos en la carpeta
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: folderPrefix,
    });

    const listedObjects = await s3.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return NextResponse.json({ success: true });
    }

    // 2. Eliminar todos los objetos encontrados
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
        Quiet: false,
      },
    });

    await s3.send(deleteCommand);

    // 3. Si hay más objetos (truncated), continuar eliminando
    if (listedObjects.IsTruncated) {
      const listNextCommand = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: folderPrefix,
        ContinuationToken: listedObjects.NextContinuationToken,
      });

      const nextListedObjects = await s3.send(listNextCommand);

      if (nextListedObjects.Contents && nextListedObjects.Contents.length > 0) {
        const nextDeleteCommand = new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: {
            Objects: nextListedObjects.Contents.map(({ Key }) => ({ Key })),
            Quiet: false,
          },
        });

        await s3.send(nextDeleteCommand);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete folder",
      },
      { status: 500 }
    );
  }
}
