"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import FileViewerClient from "@/components/FileViewerClient";
import { XIcon, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useQueryUrlFile, useQueryMetadataFile } from "@/hooks/useQueryFile";
interface FilePreviewModalProps {
  fileKey: string;
  filename: string;
  contentType: string;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
import { useUser } from "@clerk/nextjs";

export function FilePreviewModal({
  fileKey,
  filename,
  contentType,
  trigger,
  open,
  onOpenChange,
}: FilePreviewModalProps) {
  const [imageError, setImageError] = useState(false);
  const isImage =
    contentType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);

  // Función para determinar si es una URL absoluta
  const isAbsoluteUrl = (url: string) => {
    return url.startsWith("http://") || url.startsWith("https://");
  };
  const { user } = useUser();
  const clerkId = user?.id;

  const {
    data: urlRes,
    isLoading: isLoadingUrl,
    error: errorUrl,
  } = useQueryUrlFile(fileKey);
  const {
    data: metaRes,
    isLoading: isLoadingMeta,
    error: errorMeta,
  } = useQueryMetadataFile(fileKey, clerkId || "");
  const fileUrl: string = urlRes?.url as string;

  if (!clerkId) {
    return null;
  }
  const renderPreview = () => {
    // Para otros tipos de archivos usar el FileViewerClient
    return (
      <FileViewerClient
        fileUrl={fileUrl}
        filename={filename}
        contentType={contentType}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[90%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[80%] h-[90vh] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 flex flex-row items-center justify-between">
          <div className="flex items-center">
            <DialogTitle className="text-lg font-medium truncate max-w-[90%]">
              {filename}
            </DialogTitle>
            <Link
              href={fileUrl}
              download
              target="_blank"
              className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="h-4 w-4 text-gray-500" />
            </Link>
          </div>
          <DialogClose className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <XIcon className="h-5 w-5" />
          </DialogClose>
        </DialogHeader>
        <div className="flex-1 h-[calc(90vh-64px)] overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
          <div className="h-full w-full relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {renderPreview()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
