"use client";

import DragAndDrop from "./DragAndDrop";

/**
 * Landing page combinada – marketing + drag‑&‑drop demo interactiva
 */
export default function LandingDrag() {
  const handleFilesDrop = (files: File[]) => {
    alert(`📂 Subiendo ${files.length} archivo(s)...`);
  };

  return <DragAndDrop onFilesDrop={handleFilesDrop} />;
}
