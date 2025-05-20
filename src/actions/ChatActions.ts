"use server";

import { createStreamableValue } from "ai/rsc";
import { generateId } from "ai";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { cleanDocumentReference } from "@/utils/document-utils";

const RAG_URL = process.env.RAG_URL || "";
const MAX_REQUESTS = parseInt(process.env.MAX_REQUESTS || "5");
const RATE_LIMIT_PERIOD =
  parseInt(process.env.RATE_LIMIT_PERIOD || "3") * 60 * 60 * 1000; // 3 hours in milliseconds

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export async function generate(
  query: string,
  locale: string = "es",
  history: Message[] = []
) {
  try {
    const stream = createStreamableValue("");
    let buffer = "";
    let currentResponse = "";
    const client = await clerkClient();
    const { sessionClaims } = await auth();
    const user = await client.users.getUser(sessionClaims?.sub as string);

    // Rate limiting implementation

    // Get current rate limit data from user metadata
    const chatRateLimit = (user.privateMetadata.chatRateLimit as number) || 0;
    const chatRateLimitExceeded =
      (user.privateMetadata.chatRateLimitExceeded as boolean) || false;
    const chatRateLimitReset =
      (user.privateMetadata.chatRateLimitReset as string) || "";
    const now = new Date();
    let chatRateLimitResetDate = chatRateLimitReset
      ? new Date(chatRateLimitReset)
      : null;

    // Check if we need to reset the counter (if the reset time has passed)
    if (chatRateLimitResetDate && now > chatRateLimitResetDate) {
      // Reset the rate limit since the time period has expired
      await client.users.updateUserMetadata(sessionClaims?.sub as string, {
        privateMetadata: {
          ...user.privateMetadata,
          chatRateLimit: 1, // This is the first request of a new period
          chatRateLimitExceeded: false,
          chatRateLimitReset: new Date(
            now.getTime() + RATE_LIMIT_PERIOD
          ).toISOString(),
        },
      });
    }
    // Check if user has exceeded rate limit
    else if (chatRateLimitExceeded) {
      // Make sure to mark the stream as done before returning an error
      stream.done();
      return {
        success: false,
        error: `Rate limit exceeded. Please try again after ${chatRateLimitResetDate?.toLocaleString()}`,
      };
    }
    // If this is the first request or counter needs to be incremented
    else {
      const newCount = chatRateLimit + 1;
      const isExceeded = newCount > MAX_REQUESTS;

      // If no reset date is set, set one now
      if (!chatRateLimitResetDate) {
        chatRateLimitResetDate = new Date(now.getTime() + RATE_LIMIT_PERIOD);
      }

      // Update user metadata with new count while preserving other metadata
      await client.users.updateUserMetadata(sessionClaims?.sub as string, {
        privateMetadata: {
          ...user.privateMetadata,
          chatRateLimit: newCount,
          chatRateLimitExceeded: isExceeded,
          chatRateLimitReset: chatRateLimitResetDate.toISOString(),
        },
      });

      // If the user just exceeded the limit, throw error
      if (isExceeded) {
        // Make sure to mark the stream as done before returning an error
        stream.done();
        return {
          success: false,
          type: "rate_limit_exceeded",
          timeout: chatRateLimitResetDate,
          error: `Rate limit exceeded. Maximum ${MAX_REQUESTS} requests allowed per 3 hours. Please try again after ${chatRateLimitResetDate.toLocaleString()}`,
        };
      }
    }

    const folders = Array.isArray(user.privateMetadata.folder)
      ? [...user.privateMetadata.folder]
      : [];
    const rootFolder = `${sessionClaims?.sub}/`;

    folders.push(rootFolder);

    if (!folders) {
      // Make sure to mark the stream as done before returning an error
      stream.done();
      return { success: false, error: "No folder found" };
    }
    // console.log(folders);

    // Modify query based on language
    const modifiedQuery =
      locale === "es" ? `<search lang="es">${query}</search>` : query;

    // Format conversation history for context
    const conversationContext = history
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

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
            conversation_history: conversationContext,
          }),
        });

        if (!response.ok) {
          stream.update("Error: " + response.statusText);
          stream.done();
          throw new Error(`Error in search: ${response.statusText}`);
        }

        if (!response.body) {
          stream.update("Error: No response body");
          stream.done();
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
                // Don't stop the stream for a single chunk error
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error("Stream error:", error);
        stream.update("Error: No se pudo procesar la consulta.");
        stream.done(); // Make sure to call done() even on error
      }

      stream.done();
    })();

    return { output: stream.value, success: true };
  } catch (error: any) {
    console.error("Error in generate function:", error);
    return {
      success: false,
      error: error.message || "Error al procesar la consulta",
    };
  }
}
