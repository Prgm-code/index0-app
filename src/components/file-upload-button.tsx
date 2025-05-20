"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { FilePlus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { initializeUpload, completeUpload } from "@/actions/UploadActions";
import { toast } from "@pheralb/toast";
import { useDropzone } from "react-dropzone";

interface FileUploadButtonProps {
  onUploadComplete?: () => void;
  userId?: string | null;
  currentPath?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function FileUploadButton({
  onUploadComplete,
  userId,
  currentPath = "",
}: FileUploadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter out video and audio files
    const filteredFiles = acceptedFiles.filter(
      (file) =>
        !file.type.startsWith("video/") && !file.type.startsWith("audio/")
    );
    setFiles((prev) => [...prev, ...filteredFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: false, // Allow clicking to open file dialog
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Filter out video and audio files
      const filteredFiles = newFiles.filter((file) => {
        return (
          !file.type.startsWith("video/") && !file.type.startsWith("audio/")
        );
      });
      setFiles((prev) => [...prev, ...filteredFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = useCallback(
    async (file: File) => {
      if (!userId) {
        setError("No se pudo cargar el archivo");
        return null;
      }

      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const parts = Math.ceil(file.size / CHUNK_SIZE);

      try {
        setUploading(true);
        setUploadingFile(file.name);
        setUploadProgress(null);
        setError(null);

        // Ensure we have a valid file path
        const folder = currentPath ? `${userId}/${currentPath}/` : `${userId}/`;
        const filePath = `${folder}${file.name}`;

        if (!filePath.trim()) {
          throw new Error("Ruta de archivo inválida");
        }

        console.log("Inicializando carga para:", filePath);

        const initData = await initializeUpload({
          filename: filePath,
          parts,
          fileSize: file.size,
        });

        const { uploadId, key, urls } = initData;

        if (!uploadId || !key || !urls || !Array.isArray(urls)) {
          throw new Error("Error durante la inicialización");
        }

        console.log("Carga inicializada:", {
          uploadId,
          key,
          urlsCount: urls.length,
        });

        let totalLoaded = 0;
        const uploadPromises = urls.map(async (url: string, index: number) => {
          const start = index * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          console.log(`Subiendo parte ${index + 1}/${parts}`, {
            start,
            end,
            size: chunk.size,
          });

          const uploadResponse = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Length": chunk.size.toString(),
            },
            body: chunk,
          });

          if (!uploadResponse.ok) {
            if (uploadResponse.status === 0) {
              throw new Error("Error de conexión");
            }
            throw new Error("Error durante la carga");
          }

          const etag =
            uploadResponse.headers.get("etag") ||
            uploadResponse.headers.get("ETag");

          if (!etag) {
            throw new Error("Error en la respuesta del servidor");
          }

          totalLoaded += chunk.size;
          const progress = {
            loaded: totalLoaded,
            total: file.size,
            percentage: Math.round((totalLoaded / file.size) * 100),
          };
          setUploadProgress(progress);
          setProgress(progress.percentage);

          return {
            ETag: etag.replace(/"/g, ""),
            PartNumber: index + 1,
          };
        });

        console.log("Iniciando carga paralela de partes...");
        const partsInfo = await Promise.all(uploadPromises);
        console.log("Todas las partes subidas exitosamente:", partsInfo);

        console.log("Completando carga multiparte...");

        const completeData = await completeUpload({
          key,
          uploadId,
          partsInfo,
          fileSize: file.size,
        });

        if (!completeData.success) {
          throw new Error("Error al completar la carga");
        }

        console.log("Carga completada exitosamente");
        return completeData.location || "";
      } catch (err) {
        console.error("Error de carga:", err);
        toast.error({
          text:
            err instanceof Error
              ? err.message
              : "Error al subir el archivo. Inténtelo de nuevo.",
        });
        setError(
          err instanceof Error
            ? err.message
            : "Error al subir el archivo. Inténtelo de nuevo."
        );
        return null;
      }
    },
    [userId, currentPath]
  );

  const handleUpload = async () => {
    if (files.length === 0) return;

    setError(null);

    try {
      for (const file of files) {
        await uploadFile(file);
      }

      setTimeout(() => {
        setUploading(false);
        setFiles([]);
        setProgress(0);
        setUploadingFile(null);
        setUploadProgress(null);
        setIsOpen(false);
        onUploadComplete?.();
      }, 500);
    } catch (err) {
      setError("Error al subir archivos");
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FilePlus className="h-4 w-4 mr-2" />
          Subir archivo
        </Button>
      </DialogTrigger>
      <DialogContent
        className="w-full sm:max-w-2xl"
        onEscapeKeyDown={(e) => uploading && e.preventDefault()}
        onPointerDownOutside={(e) => uploading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Subir archivos</DialogTitle>
          <DialogDescription>
            Sube documentos para ser indexados y procesados por IA.
            <br />
            <span className="text-xs text-muted-foreground">
              Formatos soportados: PDF, DOCX, XLSX, TXT, PNG, JPG
            </span>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-2 bg-red-50 text-red-500 rounded-md text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="files">Archivos</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent/50 transition-colors ${
                isDragActive ? "border-primary bg-accent" : ""
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Suelta los archivos aquí"
                  : "Haz clic para seleccionar o arrastra y suelta"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máximo 10MB por archivo
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Archivos selecionados</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-accent/50 p-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <FilePlus className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate max-w-[500px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>
                  {uploadingFile
                    ? `Subiendo ${uploadingFile}...`
                    : "Subiendo..."}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              {uploadProgress && (
                <div className="text-xs text-center text-muted-foreground">
                  {Math.round(uploadProgress.loaded / 1024 / 1024)}MB de{" "}
                  {Math.round(uploadProgress.total / 1024 / 1024)}MB
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? "Subiendo..." : "Subir archivos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
