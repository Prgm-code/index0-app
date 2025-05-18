"use server";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ServiceOutputTypes,
} from "@aws-sdk/client-s3";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

export async function createFolder(data: { path: string; clerkId: string }) {
  const { sessionClaims } = await auth();
  const { path, clerkId } = data;

  if (sessionClaims?.sub !== data.clerkId) {
    return { error: "Unauthorized", success: false };
  }
  // console.log(path, clerkId);
  if (!path || !clerkId) {
    return { error: "Path and clerkId are required", success: false };
  }
  try {
    const client = await clerkClient();

    const user = await client.users.getUser(clerkId);

    // Normalizar el path: eliminar múltiples slashes y espacios
    let normalizedPath = path
      .split("/")
      .filter(Boolean) // Eliminar elementos vacíos
      .join("/");

    // Construir el path completo
    let fullPath = `${clerkId}/${normalizedPath}/`;

    // Asegurarse de que no haya duplicación del reportId
    fullPath = fullPath.replace(
      new RegExp(`^${clerkId}/${clerkId}/`),
      `${clerkId}/`
    );

    // Eliminar cualquier slash múltiple que pueda haberse creado
    fullPath = fullPath.replace(/\/+/g, "/");

    // Validar que el nombre de la carpeta no contenga caracteres inválidos
    const folderName = normalizedPath.split("/").pop();
    if (folderName && /[<>:"/\\|?*\x00-\x1F]/.test(folderName)) {
      return {
        error:
          'Invalid folder name. Folder names cannot contain: < > : " / \\ | ? *',
        success: false,
      };
    }

    // En S3/R2, las carpetas son objetos vacíos que terminan en /
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: fullPath,
      Body: "", // Objeto vacío
    });

    await s3.send(command);

    await client.users.updateUserMetadata(clerkId, {
      privateMetadata: {
        folder: [...(user.privateMetadata.folder as string[]), fullPath],
      },
    });

    return {
      success: true,
      path: fullPath,
      clerkId,
    };
  } catch (error) {
    console.error("Error creating folder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create folder",
    };
  }
}

export async function deleteFolder(data: { prefix: string; clerkId: string }) {
  const { sessionClaims } = await auth();
  const { prefix, clerkId } = data;
  try {
    if (!prefix || !clerkId) {
      return {
        success: false,
        error: "Prefix and clerkId parameters are required",
      };
    }

    if (sessionClaims?.sub !== clerkId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Asegurarse de que el prefix termine con /
    const folderPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;

    // 1. Listar todos los objetos en la carpeta
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: folderPrefix,
    });

    const listedObjects = await s3.send(listCommand);
    const contents = listedObjects.Contents || [];

    if (contents.length === 0) {
      return {
        success: true,
      };
    }

    // 2. Eliminar todos los objetos encontrados
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: contents.map((obj) => ({ Key: obj.Key })),
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
      const nextContents = nextListedObjects.Contents || [];

      if (nextContents.length > 0) {
        const nextDeleteCommand = new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: {
            Objects: nextContents.map((obj) => ({ Key: obj.Key })),
            Quiet: false,
          },
        });

        await s3.send(nextDeleteCommand);
      }
    }

    // Update user metadata to remove the folder
    const client = await clerkClient();
    const user = await client.users.getUser(clerkId);
    const currentFolders = (user.privateMetadata.folder as string[]) || [];

    await client.users.updateUserMetadata(clerkId, {
      privateMetadata: {
        folder: currentFolders.filter((f) => !f.startsWith(folderPrefix)),
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting folder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete folder",
    };
  }
}
