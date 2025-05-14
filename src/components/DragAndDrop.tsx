"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "motion/react";
import { CloudUpload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface DragAndDropProps {
  onFilesDrop?: (files: File[]) => void;
  className?: string;
}

export default function DragAndDrop({
  onFilesDrop,
  className = "",
}: DragAndDropProps) {
  const t = useTranslations("DragAndDrop");

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (onFilesDrop) {
        onFilesDrop(accepted);
      } else {
        alert(t("uploadingAlert", { count: accepted.length }));
      }
    },
    [onFilesDrop, t]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({ onDrop, multiple: true });

  // Filtrar props problemáticos para Motion v11+
  const rootProps = getRootProps();
  const dropProps = Object.fromEntries(
    Object.entries(rootProps).filter(([key]) => !key.startsWith("onAnimation"))
  );

  return (
    <motion.div
      {...dropProps}
      whileHover={{ scale: 1.02 }}
      className={`relative w-full aspect-square md:aspect-[4/3] rounded-3xl p-8 md:p-12 backdrop-blur-2xl bg-white/5 border border-white/20 shadow-xl cursor-pointer flex flex-col items-center justify-center text-center transition ${
        isDragActive ? "ring-4 ring-purple-400/80" : ""
      } ${className}`}
    >
      <input {...getInputProps()} />
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
          <CheckCircle2 className="h-14 w-14 text-emerald-400 mb-3" />
          <h4 className="text-xl font-medium mb-3 text-white">
            {t("filesReady")}
          </h4>
          <ul className="text-gray-300 text-xs space-y-1 max-h-32 overflow-y-auto w-full px-4">
            {acceptedFiles.map((f) => (
              <li key={f.name} className="truncate">
                {f.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </motion.div>
  );
}
