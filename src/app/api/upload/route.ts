// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { StorageService } from "@/services/storage.service";

// Instancia del servicio de almacenamiento
const storageService = new StorageService();

// POST /api/uploads
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    console.log("File received:", file);

    if (!file || !("arrayBuffer" in file)) {
      return NextResponse.json(
        { error: "No valid file provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convertimos a Buffer para pasarlo al servicio
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadedFile = {
      buffer,
      originalname: "name" in file ? file.name : "unknown",
      mimetype: "type" in file ? file.type : "application/octet-stream",
    };

    const result = await storageService.uploadFile({
      file: uploadedFile,
      isPublic: true,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: unknown) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handler para preflight (OPTIONS)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Encabezados CORS reutilizables
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
