"use server";

import { createStreamableValue } from "ai/rsc";
import { generateId } from "ai";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cleanDocumentReference } from "@/utils/document-utils";

const RAG_URL = process.env.RAG_URL || "";

export async function generate(query: string, locale: string = "es") {
  const stream = createStreamableValue("");
  let buffer = "";
  let currentResponse = "";
  const client = await clerkClient();
  const { sessionClaims } = await auth();
  const user = await client.users.getUser(sessionClaims?.sub as string);
  const folders = Array.isArray(user.privateMetadata.folder)
    ? [...user.privateMetadata.folder]
    : [];
  const rootFolder = `${sessionClaims?.sub}/`;

  folders.push(rootFolder);

  if (!folders) {
    throw new Error("No folder found");
  }
  // console.log(folders);

  // Modify query based on language
  const modifiedQuery =
    locale === "es" ? `<search lang="es">${query}</search>` : query;

  const decodeText = (text: string): string => {
    try {
      // Decode HTML entities and special characters
      const decoded = text
        .replace(/&aacute;/g, "á")
        .replace(/&eacute;/g, "é")
        .replace(/&iacute;/g, "í")
        .replace(/&oacute;/g, "ó")
        .replace(/&uacute;/g, "ú")
        .replace(/&ntilde;/g, "ñ")
        .replace(/\\u00f3/g, "ó")
        .replace(/\\u00e1/g, "á")
        .replace(/\\u00e9/g, "é")
        .replace(/\\u00ed/g, "í")
        .replace(/\\u00fa/g, "ú")
        .replace(/\\u00f1/g, "ñ")
        .replace(/\u00f3/g, "ó")
        .replace(/\u00e1/g, "á")
        .replace(/\u00e9/g, "é")
        .replace(/\u00ed/g, "í")
        .replace(/\u00fa/g, "ú")
        .replace(/\u00f1/g, "ñ");

      return decoded;
    } catch (e) {
      console.error("Error decoding text:", e);
      return text;
    }
  };

  (async () => {
    try {
      const response = await fetch(RAG_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
        body: JSON.stringify({
          query: modifiedQuery,
          folders,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error in search: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8", { fatal: false });

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const text = decoder.decode(value, { stream: true });
          buffer += text;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              if (trimmedLine.startsWith("data: ")) {
                const data = trimmedLine.slice(6);
                const parsed = JSON.parse(data);
                if (parsed.response) {
                  let processedResponse = decodeText(parsed.response)
                    .replace(/\\n/g, "\n")
                    .replace(/\\r/g, "")
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, "\\")
                    .normalize("NFC");

                  // Limpiar referencias a documentos y rutas
                  processedResponse = cleanDocumentReference(
                    processedResponse,
                    sessionClaims?.sub || ""
                  );

                  currentResponse = processedResponse;
                  stream.update(currentResponse);
                }
              } else {
                const match = trimmedLine.match(/^(\d+):(.*)$/);
                if (match) {
                  const [, prefix, content] = match;
                  if (prefix === "0") {
                    let processedContent = decodeText(content)
                      .replace(/^"/, "")
                      .replace(/"$/, "")
                      .replace(/\\n/g, "\n")
                      .replace(/\\r/g, "")
                      .replace(/\\"/g, '"')
                      .replace(/\\\\/g, "\\")
                      .normalize("NFC");

                    // Limpiar referencias a documentos y rutas
                    processedContent = cleanDocumentReference(
                      processedContent,
                      sessionClaims?.sub || ""
                    );

                    if (
                      processedContent &&
                      processedContent !== currentResponse
                    ) {
                      currentResponse = processedContent;
                      stream.update(currentResponse);
                    }
                  }
                }
              }
            } catch (e) {
              console.error("Error processing chunk:", e);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("Stream error:", error);
      throw error;
    }

    stream.done();
  })();

  return { output: stream.value };
}
