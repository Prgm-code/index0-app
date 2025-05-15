import { useState, useCallback } from "react";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface FileUploaderProps {
  onUploadComplete?: (url: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: UploadProgress) => void;
  folder?: string;
}

export function FileUploader({
  onUploadComplete,
  onError,
  onProgress,
  folder = "",
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const parts = Math.ceil(file.size / CHUNK_SIZE);

      try {
        setIsUploading(true);
        setUploadProgress(null);

        // Ensure we have a valid file path
        const filePath = folder
          ? `${folder.endsWith("/") ? folder.slice(0, -1) : folder}/${
              file.name
            }`
          : file.name;

        if (!filePath.trim()) {
          throw new Error("Invalid file path");
        }

        console.log("Initializing upload for:", filePath);
        const initRes = await fetch("/api/upload/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: filePath,
            parts,
          }),
        });

        const initData = await initRes.json();

        if (!initRes.ok) {
          throw new Error(initData.error || "Failed to initialize upload");
        }

        const { uploadId, key, urls } = initData;

        if (!uploadId || !key || !urls || !Array.isArray(urls)) {
          throw new Error("Invalid response from server");
        }

        console.log("Upload initialized:", {
          uploadId,
          key,
          urlsCount: urls.length,
        });

        let totalLoaded = 0;
        const uploadPromises = urls.map(async (url: string, index: number) => {
          const start = index * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          console.log(`Uploading part ${index + 1}/${parts}`, {
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
              throw new Error(
                "CORS error: Make sure CORS is properly configured in your R2 bucket settings"
              );
            }
            throw new Error(
              `Failed to upload part ${index + 1}: ${uploadResponse.status} ${
                uploadResponse.statusText
              }`
            );
          }

          const etag =
            uploadResponse.headers.get("etag") ||
            uploadResponse.headers.get("ETag");

          if (!etag) {
            throw new Error(
              `No ETag received for part ${
                index + 1
              }. Make sure 'ETag' is included in ExposeHeaders in your CORS configuration`
            );
          }

          totalLoaded += chunk.size;
          const progress = {
            loaded: totalLoaded,
            total: file.size,
            percentage: Math.round((totalLoaded / file.size) * 100),
          };
          setUploadProgress(progress);
          onProgress?.(progress);

          return {
            ETag: etag.replace(/"/g, ""),
            PartNumber: index + 1,
          };
        });

        console.log("Starting parallel upload of parts...");
        const partsInfo = await Promise.all(uploadPromises);
        console.log("All parts uploaded successfully:", partsInfo);

        console.log("Completing multipart upload...");
        const completeRes = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            uploadId,
            partsInfo,
          }),
        });

        const completeData = await completeRes.json();

        if (!completeRes.ok) {
          throw new Error(completeData.error || "Failed to complete upload");
        }

        console.log("Upload completed successfully");
        onUploadComplete?.(completeData.location || "");
      } catch (error) {
        console.error("Upload error:", error);
        onError?.(
          error instanceof Error
            ? error.message
            : "Upload failed. Please check your CORS configuration."
        );
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [onUploadComplete, onError, onProgress, folder]
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await uploadFile(file);
        event.target.value = "";
      }
    },
    [uploadFile]
  );

  return (
    <div className="w-full">
      <label
        className={`
          flex flex-col justify-center w-full h-24 px-4 transition border-2 border-dashed rounded-md appearance-none cursor-pointer
          border-muted-foreground/25
          hover:border-muted-foreground/50 focus:outline-none
          ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium">
              {isUploading ? (
                <span className="flex items-center gap-2">
                  {uploadProgress ? (
                    `Subiendo (${uploadProgress.percentage}%)`
                  ) : (
                    <>
                      Procesando archivo
                      <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                    </>
                  )}
                </span>
              ) : (
                "Haz clic para subir archivos"
              )}
            </span>
            {!isUploading && folder && (
              <span className="text-xs text-muted-foreground">
                Carpeta actual: {folder}
              </span>
            )}
          </div>
        </div>

        {/* Barra de progreso */}
        {isUploading && uploadProgress && (
          <div className="w-full mt-4 px-4">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-center text-muted-foreground">
              {Math.round(uploadProgress.loaded / 1024 / 1024)}MB de{" "}
              {Math.round(uploadProgress.total / 1024 / 1024)}MB
            </div>
          </div>
        )}

        <input
          type="file"
          name="file_upload"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}
