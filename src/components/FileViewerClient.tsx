"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

// Create a fallback component for unsupported file types
const UnsupportedComponent = () => (
  <div className="flex items-center justify-center h-full min-h-[200px] bg-muted/30 rounded-lg p-6">
    <p className="text-muted-foreground text-center">
      This file type is not supported for preview.
      <br />
      <span className="text-xs">Please download to view its contents.</span>
    </p>
  </div>
);

// Extensions mapping
const EXTENSIONS = {
  // Images
  image: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "ico",
    "tiff",
    "avif",
    "heic",
    "jfif",
  ],

  // Documents
  pdf: ["pdf"],
  word: ["doc", "docx"],
  excel: ["xls", "xlsx", "csv"],
  powerpoint: ["ppt", "pptx"],

  // Text & Code
  text: [
    "txt",
    "md",
    "log",
    "nfo",
    "ini",
    "conf",
    "yml",
    "yaml",
    "json",
    "xml",
    "html",
    "htm",
    "css",
  ],
  code: [
    "js",
    "ts",
    "jsx",
    "tsx",
    "py",
    "java",
    "c",
    "cpp",
    "cs",
    "go",
    "rb",
    "php",
    "swift",
    "sh",
    "bash",
    "sql",
    "vue",
    "svelte",
  ],

  // Media
  audio: ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"],
  video: ["mp4", "webm", "mov", "avi", "mkv", "m4v", "wmv", "flv", "3gp"],
};

// Get file type from extension
function getFileTypeFromExtension(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase() || "";

  // Check all extension categories
  for (const [category, extensions] of Object.entries(EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return category;
    }
  }

  return "unknown";
}

// Helper function to get file type either from extension or content type
function determineFileType(filename: string, contentType: string): string {
  // Priority 1: Get from extension (most reliable)
  const extensionType = getFileTypeFromExtension(filename);
  if (extensionType !== "unknown") {
    return extensionType;
  }

  // Priority 2: Check content type
  if (contentType.includes("image/")) return "image";
  if (contentType.includes("application/pdf")) return "pdf";
  if (contentType.includes("text/")) return "text";
  if (
    contentType.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
  )
    return "word";
  if (
    contentType.includes(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
  )
    return "excel";
  if (
    contentType.includes("application/vnd.ms-excel") ||
    contentType.includes("text/csv")
  )
    return "excel";
  if (contentType.includes("audio/")) return "audio";
  if (contentType.includes("video/")) return "video";

  return "unknown";
}

interface FileViewerClientProps {
  fileUrl: string;
  filename: string;
  contentType: string;
}

export default function FileViewerClient({
  fileUrl,
  filename,
  contentType,
}: FileViewerClientProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Determine file type - prioritize extension over content type
  const fileType = determineFileType(filename, contentType);

  // For text and code files, fetch the content
  useEffect(() => {
    if ((fileType === "text" || fileType === "code") && !textContent) {
      setIsLoading(true);
      fetch(fileUrl)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch file");
          return response.text();
        })
        .then((text) => {
          setTextContent(text);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching text:", error);
          setError(true);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [fileType, fileUrl, textContent]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-muted/10 rounded-lg">
        <div className="animate-pulse text-muted-foreground">
          Loading preview...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-muted/10 rounded-lg">
        <div className="text-red-500">
          Error loading preview. Please try downloading the file.
        </div>
      </div>
    );
  }

  // Render appropriate viewer based on file type
  switch (fileType) {
    case "image":
      return (
        <div className="flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden h-[70vh]">
          <Image
            src={fileUrl}
            alt={filename}
            width={1200}
            height={800}
            className="max-w-full max-h-[70vh] h-auto object-contain"
            unoptimized
          />
        </div>
      );

    case "pdf":
      return (
        <div className="rounded-lg overflow-hidden border bg-white h-[70vh]">
          <iframe src={fileUrl} className="w-full h-full" title={filename} />
        </div>
      );

    case "text":
    case "code":
      if (textContent) {
        return (
          <div className="rounded-lg overflow-hidden h-[70vh]">
            <pre className="bg-muted rounded-md p-4 overflow-auto h-full whitespace-pre-wrap text-sm">
              {textContent}
            </pre>
          </div>
        );
      }
      return <UnsupportedComponent />;

    case "audio":
      return (
        <div className="flex flex-col items-center justify-center space-y-4 bg-muted/10 rounded-lg p-6 h-[70vh]">
          <div className="text-center mb-2">
            <span className="text-sm text-muted-foreground">Audio File</span>
          </div>
          <audio controls className="w-full max-w-md">
            <source src={fileUrl} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );

    case "video":
      return (
        <div className="rounded-lg overflow-hidden bg-black h-[70vh]">
          <video
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            <source src={fileUrl} />
            Your browser does not support the video element.
          </video>
        </div>
      );

    case "word":
    case "excel":
    case "powerpoint":
      return (
        <div className="rounded-lg overflow-hidden border bg-white h-[70vh]">
          {/* Google Docs Viewer for Office files */}
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(
              fileUrl
            )}&embedded=true`}
            className="w-full h-full"
            title={filename}
          />
        </div>
      );

    default:
      return <UnsupportedComponent />;
  }
}
