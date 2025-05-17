// app/api/chat/route.ts

import { createDataStreamResponse, streamText, generateId } from "ai";
import type { DataStreamWriter } from "ai";
import { auth } from "@clerk/nextjs/server";
// import { openai } from "@ai-sdk/openai";

export const runtime = "nodejs";
export const maxDuration = 30;

const RAG_URL = process.env.RAG_URL || "";

async function fetchStreamData(query: string) {
  const { sessionClaims } = await auth();
  const folder = `${sessionClaims?.sub}/`;

  const response = await fetch(RAG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      folder,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error in search: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No response body");
  }

  return response.body.getReader();
}

async function processStreamChunk(
  chunk: Uint8Array,
  dataStream: DataStreamWriter
) {
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const text = decoder.decode(chunk, { stream: true });
  let buffer = "";
  buffer += text;
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  let currentResponse = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

    const data = trimmedLine.slice(6);

    try {
      const parsed = JSON.parse(data);
      if (parsed.response) {
        currentResponse = decodeAndCleanText(parsed.response);
        dataStream.writeMessageAnnotation({
          id: generateId(),
          chunk: currentResponse,
          timestamp: new Date().toISOString(),
        });
        dataStream.writeData(currentResponse);
      }
    } catch (e) {
      console.warn("Failed to parse chunk:", e);
    }
  }

  return buffer;
}

function decodeAndCleanText(text: string): string {
  try {
    return text
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
      .replace(/\u00f1/g, "ñ")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .normalize("NFC");
  } catch (e) {
    console.error("Error decoding text:", e);
    return text;
  }
}

export async function POST(req: Request) {
  const { query } = await req.json();

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData("initialized call");

      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let currentResponse = "";

      const processStream = async () => {
        reader = await fetchStreamData(query);

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("Stream complete");
            dataStream.writeMessageAnnotation({
              id: generateId(),
              status: "completed",
              chunk: currentResponse,
              timestamp: new Date().toISOString(),
            });
            dataStream.writeData("call completed");
            break;
          }

          const buffer = await processStreamChunk(value, dataStream);
          if (buffer) {
            currentResponse += buffer;
          }
        }
      };

      try {
        return processStream();
      } catch (error) {
        console.error("Error reading stream:", error);
        throw error;
      } finally {
        reader?.releaseLock();
      }
    },
    onError: (error) => {
      console.error("Stream error:", error);
      return error instanceof Error ? error.message : String(error);
    },
  });
}
