"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PDFViewer } from "./PDFViewer";

// Create a fallback component for unsupported file types
const UnsupportedComponent = () => (
  <div className="flex items-center justify-center h-full w-full min-h-[200px] bg-muted/30 rounded-lg p-6">
    <p className="text-muted-foreground text-center">
      This file type is not supported for preview.
      <br />
      <span className="text-xs">Please download to view its contents.</span>
    </p>
  </div>
);

// Error view with download button
export const ErrorView = ({
  fileUrl,
  message,
}: {
  fileUrl: string;
  message: string;
}) => (
  <div className="flex flex-col items-center justify-center h-[70vh] w-full bg-muted/10 rounded-lg p-6">
    <div className="text-red-500 mb-4 text-center">
      {message || "Error loading preview."}
    </div>
    <Link
      href={fileUrl}
      target="_blank"
      download
      className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Download File
    </Link>
    <p className="text-xs text-muted-foreground mt-4">
      Note: Preview may be unavailable due to file permissions or security
      settings.
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

// Office Viewer Component with multiple fallbacks
const OfficeViewer = ({
  fileUrl,
  filename,
  fileType,
}: {
  fileUrl: string;
  filename: string;
  fileType: string;
}) => {
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerError, setViewerError] = useState(false);

  // Array of different viewer options to try
  const viewers = [
    // Microsoft Office Online viewer (good for Office formats)
    `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
      fileUrl
    )}`,
    // Google Docs viewer (alternative)
    `https://docs.google.com/viewer?url=${encodeURIComponent(
      fileUrl
    )}&embedded=true`,
  ];

  // If viewer fails, try the next one
  const handleViewerError = () => {
    if (viewerIndex < viewers.length - 1) {
      setViewerIndex(viewerIndex + 1);
    } else {
      setViewerError(true);
    }
  };

  if (viewerError) {
    return (
      <ErrorView
        fileUrl={fileUrl}
        message={`Unable to preview ${fileType.toUpperCase()} file. You can download it instead.`}
      />
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border bg-white h-[70vh] w-full relative">
      <iframe
        src={viewers[viewerIndex]}
        className="
        sm:w-full
        md:w-3/4
        lg:w-4xl
        xl:w-5xl h-[80dvh]"
        title={filename}
        onError={handleViewerError}
      />
      {/* Viewer selection info */}
      <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded text-xs">
        Using viewer {viewerIndex + 1}/{viewers.length}
      </div>
    </div>
  );
};

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
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Determine file type - prioritize extension over content type
  const fileType = determineFileType(filename, contentType);

  // For text and code files, fetch the content
  useEffect(() => {
    if ((fileType === "text" || fileType === "code") && !textContent) {
      setIsLoading(true);
      fetch(fileUrl)
        .then((response) => {
          if (!response.ok)
            throw new Error(
              `Failed to fetch: ${response.status} ${response.statusText}`
            );
          return response.text();
        })
        .then((text) => {
          setTextContent(text);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching text:", error);
          setErrorMessage(error.message || "Failed to fetch file");
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
      <div className="flex items-center justify-center h-[70vh] w-full max-w-full bg-muted/10 rounded-lg">
        <div className="animate-pulse text-muted-foreground">
          Loading preview...
        </div>
      </div>
    );
  }

  // Error state for text files
  if (error) {
    return <ErrorView fileUrl={fileUrl} message={errorMessage} />;
  }

  // Direct content viewers (less likely to have CORS issues)
  switch (fileType) {
    case "image":
      return (
        <div className="flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden h-[70vh] w-full">
          {fileUrl ? (
            <Image
              src={fileUrl}
              alt={filename}
              width={1200}
              height={800}
              className="max-w-full max-h-[70vh] h-auto object-contain"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-muted-foreground">No image found</p>
            </div>
          )}
        </div>
      );

    case "pdf":
      return <PDFViewer fileUrl={fileUrl} filename={filename} />;

    case "text":
    case "code":
      if (textContent) {
        return (
          <div className="rounded-lg overflow-hidden h-[70vh] w-full">
            <pre className="bg-muted rounded-md p-4 overflow-auto h-full whitespace-pre-wrap text-sm">
              {textContent}
            </pre>
          </div>
        );
      }
      return (
        <ErrorView fileUrl={fileUrl} message="Failed to load text content" />
      );

    case "audio":
      return (
        <div className="flex flex-col items-center justify-center space-y-4 bg-muted/10 rounded-lg p-6 h-[70vh] w-full">
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
        <div className="rounded-lg overflow-hidden bg-black h-[70vh] w-full">
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
        <div className="rounded-lg overflow-hidden mx-auto bg-black h-[70vh] ">
          <OfficeViewer
            fileUrl={fileUrl}
            filename={filename}
            fileType={fileType}
          />
        </div>
      );

    default:
      return <UnsupportedComponent />;
  }
}
