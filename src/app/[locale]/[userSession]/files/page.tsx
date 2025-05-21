import React from "react";
import { getAllFiles } from "@/actions/FileActions";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import SearchFilesClient from "@/components/FileComponents/SearchFilesClient";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("fileViewer");
  const sessionClaims = await auth();
  const clerkId = sessionClaims?.userId;

  if (!clerkId) {
    return <div>{t("unauthorized")}</div>;
  }

  const filesResponse = await getAllFiles({
    clerkId: clerkId,
  });

  if (!filesResponse.success || !filesResponse.files) {
    return (
      <div>
        {t("loadError", {
          error: filesResponse.error || "Unknown error",
        })}
      </div>
    );
  }

  // Transform the file data to match what SearchFilesClient expects
  const fileList = filesResponse.files.map((file, index) => ({
    id: index.toString(), // Use index as id if no actual id exists
    key: file.key,
    name: file.key.split("/").pop() || "Unknown",
    size: file.size,
    type: file.type,
    uploadedAt: file.lastModified || new Date().toISOString(),
    userId: clerkId,
  }));

  return (
    <div className="w-full mx-auto py-4 px-3 sm:px-4 space-y-4">
      <div className="border rounded-lg shadow-sm overflow-hidden bg-card p-4">
        <h1 className="text-xl font-semibold mb-4">{t("searchFiles")}</h1>
        <p className="text-muted-foreground mb-4">{t("searchPlaceholder")}</p>

        <SearchFilesClient fileList={fileList} />
      </div>
    </div>
  );
}
