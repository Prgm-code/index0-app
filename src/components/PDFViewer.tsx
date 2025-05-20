"use client";

import React, { useState } from "react";
import { ErrorView } from "./FileViewerClient";

interface PDFViewerProps {
  fileUrl: string;
  filename: string;
}

export function PDFViewer({ fileUrl, filename }: PDFViewerProps) {
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Handle errors
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Handle load complete
  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <ErrorView
        fileUrl={fileUrl}
        message="Unable to preview PDF file. You can download it instead."
      />
    );
  }

  return (
    <div className="overflow-auto h-[70vh] bg-white rounded-lg border flex flex-col">
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">
            Loading PDF...
          </div>
        </div>
      )}

      <iframe
        src={fileUrl}
        className="w-full h-full"
        title={filename}
        onError={handleError}
        onLoad={handleLoad}
        frameBorder="0"
      />
    </div>
  );
}
