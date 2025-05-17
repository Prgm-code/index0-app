// app/api/chat/route.ts
import type { NextRequest } from "next/server";
import { createDataStreamResponse } from "ai";
import type { DataStreamWriter } from "ai";

export const runtime = "nodejs";
export const maxDuration = 30;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Buffer to store incomplete chunks
let buffer = "";

function modifyChunkSomehow(chunk: Uint8Array): string {
  // 1) Decode the chunk to string
  const text = textDecoder.decode(chunk, { stream: true });

  // 2) Add to buffer and split into lines
  buffer += text;
  const lines = buffer.split("\n");
  buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

  // Process complete lines
  const outputParts: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Handle SSE data lines
    if (trimmedLine.startsWith("data: ")) {
      const data = trimmedLine.slice(6); // Remove "data: " prefix

      // Handle [DONE] message
      if (data === "[DONE]") {
        outputParts.push(
          `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`
        );
        continue;
      }

      try {
        // 3) Parse the JSON data
        const parsed = JSON.parse(data);

        // 4) Only process non-empty responses
        if (parsed.response && typeof parsed.response === "string") {
          // 5) Format as Data-Stream Text Part (tipo 0)
          outputParts.push(`0:${JSON.stringify(parsed.response)}\n`);

          // If we have usage info, add a finish step part
          if (parsed.usage) {
            outputParts.push(
              `e:{"finishReason":"stop","usage":${JSON.stringify(
                parsed.usage
              )},"isContinued":true}\n`
            );
          }
        }
      } catch (e) {
        // If parsing fails, it might be an incomplete chunk
        // We'll add it back to the buffer
        buffer = trimmedLine.slice(6) + "\n" + buffer;
      }
    }
  }

  return outputParts.join("");
}

export async function POST(request: NextRequest) {
  const { query, folder } = await request.json();

  // Reset buffer at the start of each request
  buffer = "";

  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      // Initial message
      dataStream.writeData("🔍 Consultando tu RAG local…\n\n");

      const response = await fetch(
        "http://localhost:8787/autorag/searchAi/stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query:
              "dame un resumen detallado de repaso independencia Repaso Independencia.pdf",
            folder: "user_2x7Kkwl0iiVIi63Zvr17w1sb8VZ/",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error en la búsqueda: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("No se recibió respuesta del servidor");
      }

      // Create a TransformStream to handle the response
      const { readable, writable } = new TransformStream({
        transform(chunk, controller) {
          const modifiedText = modifyChunkSomehow(chunk);
          if (modifiedText) {
            console.log(modifiedText);
            controller.enqueue(modifiedText);
          }
        },
      });

      // Set up error handling for the pipe operation
      const pipePromise = response.body.pipeTo(writable).catch((error) => {
        console.error("Error en el streaming:", error);
        throw new Error("Error al procesar la respuesta del servidor");
      });

      // Process the stream and send to client
      const reader = readable.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // The value is already in the correct format thanks to modifyChunkSomehow
          if (value) {
            dataStream.writeData(value);
          }
        }
      } catch (error) {
        console.error("Error al leer el stream:", error);
        throw new Error("Error al procesar la respuesta");
      } finally {
        // Process any remaining buffer content
        if (buffer) {
          try {
            const data = JSON.parse(buffer);
            if (data.response) {
              dataStream.writeData(`0:${JSON.stringify(data.response)}\n`);
            }
          } catch (e) {
            console.warn("Failed to parse final buffer:", e);
          }
        }

        // Send final finish message
        dataStream.writeData(
          `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`
        );

        // Ensure resources are properly cleaned up
        reader.releaseLock();
        await pipePromise.catch(() => {}); // Handle any remaining pipe errors
      }
    },

    onError: (err: unknown) =>
      err instanceof Error ? err.message : String(err),
  });
}
