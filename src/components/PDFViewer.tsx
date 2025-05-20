"use client";

import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { ErrorView } from "./FileViewerClient";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  filename: string;
}

export function PDFViewer({ fileUrl, filename }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // For PDF.js viewer
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages || 1);
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  // Handle errors
  const handleError = () => {
    setHasError(true);
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
    <div className="overflow-auto h-[70vh] bg-white p-4 rounded-lg border flex flex-col">
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">
            Loading PDF...
          </div>
        </div>
      )}

      <div className="flex-grow overflow-auto flex justify-center">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={handleError}
          onSourceError={handleError}
          className="max-w-full"
          loading={
            <div className="h-[60vh] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">
                Loading PDF...
              </div>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={Math.min(window.innerWidth * 0.8, 800)}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      {numPages && (
        <div className="flex justify-between items-center mt-4 px-4 py-2 bg-gray-50 rounded">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-primary text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <p className="text-sm">
            Page {pageNumber} of {numPages}
          </p>

          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
            className="px-3 py-1 bg-primary text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
