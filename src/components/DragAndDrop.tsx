"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { motion } from "motion/react";
import { CloudUpload, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { SignedIn, SignInButton } from "@clerk/nextjs";
import { SignUpButton } from "@clerk/nextjs";
import { SignedOut } from "@clerk/nextjs";
import { Link } from "@/i18n/navigation";
import { useSession } from "@clerk/nextjs";
import { Progress } from "@/components/ui/progress";
import { initializeUpload, completeUpload } from "@/actions/UploadActions";
import { toast } from "@pheralb/toast";

interface DragAndDropProps {
  className?: string;
  onUploadComplete?: () => void;
  currentPath?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export default function DragAndDrop({
  className = "",
  onUploadComplete,
  currentPath = "",
}: DragAndDropProps) {
  const t = useTranslations("DragAndDrop");
  const { session } = useSession();
  const sessionId = session?.id;
  const userId = session?.user?.id;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onFilesDrop = useCallback((files: File[]) => {
    console.log("Files dropped:", files);
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        onFilesDrop(accepted);
      }
    },
    [onFilesDrop]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({ onDrop, multiple: true });

  const uploadFile = useCallback(
    async (file: File) => {
      if (!userId) {
        setError(
          t("errors.userNotIdentified") ||
            "No se pudo cargar el archivo. Usuario no identificado."
        );
        return null;
      }

      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const parts = Math.ceil(file.size / CHUNK_SIZE);

      try {
        setIsUploading(true);
        setUploadingFile(file.name);
        setUploadProgress(null);
        setError(null);

        // Ensure we have a valid file path
        const folder = currentPath ? `${userId}/${currentPath}/` : `${userId}/`;
        const filePath = `${folder}${file.name}`;

        if (!filePath.trim()) {
          throw new Error(
            t("errors.invalidPath") || "Ruta de archivo inválida"
          );
        }

        console.log("Inicializando carga para:", filePath);

        const initData = await initializeUpload({
          filename: filePath,
          parts,
          fileSize: file.size,
        });

        const { uploadId, key, urls } = initData;

        if (!uploadId || !key || !urls || !Array.isArray(urls)) {
          throw new Error(
            t("errors.initError") || "Error durante la inicialización"
          );
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
              throw new Error(
                t("errors.connectionError") || "Error de conexión"
              );
            }
            throw new Error(
              t("errors.uploadError") || "Error durante la carga"
            );
          }

          const etag =
            uploadResponse.headers.get("etag") ||
            uploadResponse.headers.get("ETag");

          if (!etag) {
            throw new Error(
              t("errors.serverError") || "Error en la respuesta del servidor"
            );
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
          throw new Error(
            t("errors.completeError") || "Error al completar la carga"
          );
        }

        console.log("Carga completada exitosamente");
        return completeData.location || "";
      } catch (err) {
        console.error("Error de carga:", err);
        toast.error({
          text:
            err instanceof Error
              ? err.message
              : t("errors.uploadRetry") ||
                "Error al subir el archivo. Inténtelo de nuevo.",
        });
        setError(
          err instanceof Error
            ? err.message
            : t("errors.uploadRetry") ||
                "Error al subir el archivo. Inténtelo de nuevo."
        );
        return null;
      }
    },
    [userId, currentPath, t]
  );

  const handleUpload = useCallback(async () => {
    if (acceptedFiles.length === 0) return;

    setError(null);

    try {
      for (const file of acceptedFiles) {
        await uploadFile(file);
      }

      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        setUploadingFile(null);
        setUploadProgress(null);
        setUploadedFiles(Array.from(acceptedFiles) as File[]);
        setUploadSuccess(true);
        onUploadComplete?.();
        toast.success({
          text:
            t("successMessages.filesUploaded") ||
            "Archivos subidos exitosamente",
        });
      }, 500);
    } catch (err) {
      setError(t("errors.uploadFailed") || "Error al subir archivos");
      setIsUploading(false);
    }
  }, [acceptedFiles, uploadFile, onUploadComplete, t]);

  // Filtrar props problemáticos para Motion v11+
  const rootProps = getRootProps();
  const dropProps = Object.fromEntries(
    Object.entries(rootProps).filter(([key]) => !key.startsWith("onAnimation"))
  );

  // Prevent opening file dialog when upload is successful
  const conditionalDropProps = uploadSuccess ? {} : dropProps;

  return (
    <motion.div
      {...conditionalDropProps}
      whileHover={{ scale: uploadSuccess ? 1 : 1.02 }}
      className={`relative w-full aspect-square md:aspect-[4/3] rounded-3xl p-8 md:p-12 backdrop-blur-2xl bg-white/5 border border-white/20 shadow-xl ${
        !uploadSuccess ? "cursor-pointer" : ""
      } flex flex-col items-center justify-center text-center transition ${
        isDragActive && !uploadSuccess ? "ring-4 ring-purple-400/80" : ""
      } ${className}`}
    >
      {!uploadSuccess && <input {...getInputProps()} />}
      {acceptedFiles.length === 0 ? (
        <>
          <CloudUpload className="h-16 w-16 text-purple-300 mb-6" />
          <h3 className="text-2xl font-semibold mb-2 text-white">
            {isDragActive ? t("dropActive") : t("dropInactive")}
          </h3>
          <p className="text-gray-300 text-sm mb-6 max-w-xs mx-auto">
            {t("description")}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 px-6 bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            {t("selectButton")}
          </Button>
        </>
      ) : (
        <>
          {isUploading ? (
            <div className="w-full space-y-4">
              <CloudUpload className="h-14 w-14 text-purple-300 mb-3 mx-auto animate-pulse" />
              <h4 className="text-xl font-medium mb-3 text-white">
                {uploadingFile
                  ? `${t("uploading")} ${uploadingFile}...`
                  : t("uploading")}
              </h4>

              <div className="space-y-2 w-full px-4">
                <div className="flex justify-between text-xs text-gray-300 w-full">
                  <span>{t("progress") || "Progreso"}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {uploadProgress && (
                  <div className="text-xs text-center text-gray-400">
                    {Math.round(uploadProgress.loaded / 1024 / 1024)}MB{" "}
                    {t("of") || "de"}{" "}
                    {Math.round(uploadProgress.total / 1024 / 1024)}MB
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <CheckCircle2 className="h-14 w-14 text-emerald-400 mb-3" />
              <h4 className="text-xl font-medium mb-3 text-white">
                {uploadSuccess
                  ? t("filesUploaded") || "Archivos subidos"
                  : t("filesSelected") || "Archivos seleccionados"}
              </h4>
              {error && (
                <div className="mb-4 p-2 bg-red-500/20 text-red-400 rounded-md text-xs max-w-xs mx-auto">
                  {error}
                </div>
              )}
              <ul className="text-gray-300 text-xs space-y-1 max-h-32 overflow-y-auto w-full px-4 mb-4">
                {acceptedFiles.map((f) => (
                  <li key={f.name} className="truncate">
                    {f.name}
                  </li>
                ))}
              </ul>
              <SignedOut>
                <SignInButton
                  mode="modal"
                  fallbackRedirectUrl="/redirect-after-signin"
                >
                  <Button
                    size="lg"
                    className="gap-2 px-6 bg-purple-600 hover:bg-purple-700 text-white"
                    // disabled={isUploading}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {isUploading
                      ? t("uploading") || "Uploading..."
                      : t("upload")}
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                {uploadSuccess ? (
                  <Link
                    href={`/${sessionId}`}
                    className="flex items-center justify-center gap-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-md cursor-pointer"
                  >
                    {t("goToApp") || "Ir a la aplicación"}{" "}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpload();
                    }}
                    size="lg"
                    className="gap-2 px-6 bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isUploading}
                  >
                    {isUploading
                      ? t("uploading") || "Uploading..."
                      : t("upload")}
                  </Button>
                )}
              </SignedIn>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
