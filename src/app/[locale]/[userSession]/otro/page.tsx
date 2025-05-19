"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { generate } from "@/actions/ChatActions";
import { readStreamableValue } from "ai/rsc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep focus on textarea after loading changes
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading, messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: inputText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    try {
      // Call LLM with current conversation history
      const conversationHistory = [...messages, userMessage];
      const { output } = await generate(inputText, locale, conversationHistory);

      // Add empty assistant placeholder
      const assistantMessageId = "assistant-" + Date.now();
      const assistantMessage = {
        id: assistantMessageId,
        role: "assistant" as const,
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Stream tokens into that placeholder
      let assistantResponse = "";
      for await (const delta of readStreamableValue(output)) {
        assistantResponse += delta;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: assistantResponse }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          role: "assistant",
          content: "Lo siento, hubo un error al procesar tu mensaje.",
        },
      ]);
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
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Escribe un mensaje para comenzar la conversación</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "" : "justify-end"
                }`}
              >
                {message.role === "user" && (
                  <Avatar>
                    <AvatarFallback>Tú</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-4 border w-fit max-w-[80%] ${
                    message.role === "user" ? "bg-muted/50" : "bg-primary/5"
                  }`}
                >
                  <div className="break-words whitespace-pre-wrap">
                    {formatText(message.content)}
                  </div>
                </div>
                {message.role === "assistant" && (
                  <Avatar>
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                autoFocus
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
