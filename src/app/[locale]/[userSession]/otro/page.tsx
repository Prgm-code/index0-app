"use client";

import { useState, KeyboardEvent } from "react";
import { generate } from "@/actions/ChatActions";
import { readStreamableValue } from "ai/rsc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [generation, setGeneration] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setGeneration("");

    try {
      const { output } = await generate(inputText);

      for await (const delta of readStreamableValue(output)) {
        setGeneration((currentGeneration) => {
          return currentGeneration + delta;
        });
      }
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatText = (text: string) => {
    // Handle markdown-style bold text
    const processedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Split by line breaks and create spans with proper spacing
    return processedText.split("\n").map((line, i, arr) => {
      // Process the line to render HTML tags
      const processedLine = line.includes("<strong>") ? (
        <span
          key={i}
          dangerouslySetInnerHTML={{
            __html: line,
          }}
          className="text-base leading-relaxed"
        />
      ) : (
        <span key={i} className="text-base leading-relaxed">
          {line}
        </span>
      );

      return (
        <span key={`line-${i}`} className="block mb-2 last:mb-0">
          {processedLine}
        </span>
      );
    });
  };

  return (
    <div className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Chat Asistente</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Chat display area */}
          <div className="min-h-[500px] mb-6 space-y-6 overflow-y-auto max-h-[600px] p-4">
            {!inputText && !generation && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Escribe un mensaje para comenzar la conversación</p>
              </div>
            )}

            {inputText && (
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>Tú</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-4 border w-fit max-w-[80%] bg-muted/50">
                  <div className="break-words whitespace-pre-wrap">
                    {formatText(inputText)}
                  </div>
                </div>
              </div>
            )}

            {generation && (
              <div className="flex items-start gap-3 justify-end">
                <div className="rounded-lg p-4 border w-fit max-w-[80%] bg-primary/5">
                  <div className="break-words whitespace-pre-wrap">
                    {formatText(generation)}
                  </div>
                </div>
                <Avatar>
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje aquí... (Shift + Enter para nueva línea)"
                disabled={isLoading}
                rows={2}
                className="resize-none min-h-[60px] max-h-[150px]"
              />
            </div>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Generando...</span>
                </>
              ) : (
                "Enviar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
