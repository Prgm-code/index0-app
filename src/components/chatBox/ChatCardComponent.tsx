import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { MessageCircle, Send } from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { useTranslations } from "next-intl";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { generate } from "@/actions/chat-actions";
import { readStreamableValue } from "ai/rsc";
import { Loader2 } from "lucide-react";

export function ChatCardComponent() {
  const t = useTranslations("chat");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Función para mantener el scroll al final
  const scrollToBottom = () => {
    if (viewportRef.current) {
      const viewport = viewportRef.current;
      viewport.scrollTop = viewport.scrollHeight;
    }
  };

  // Efecto para scroll automático cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    };

    // Agregar mensaje del usuario
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const { output } = await generate(input);
      const assistantMessageId = "assistant-" + Date.now();
      let assistantResponse = "";

      // Crear mensaje inicial del asistente
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
        },
      ]);

      // Actualizar el mensaje del asistente con el stream
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
      // Mostrar mensaje de error al usuario
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
      // Asegurar que el scroll esté al final después de completar
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <Card className="w-full h-[850px] flex flex-col">
      <CardHeader className="flex-none pb-4">
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden p-6">
        <ScrollArea className="flex-1 w-full pr-4 -mr-4 h-[600px]">
          <ScrollAreaPrimitive.Viewport
            ref={viewportRef}
            className="w-full h-full"
          >
            <div className="space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>{t("emptyState")}</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] break-words whitespace-pre-wrap ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content ||
                        (isLoading && message.role === "assistant"
                          ? "..."
                          : "")}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollAreaPrimitive.Viewport>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex space-x-2 flex-none pt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t("placeholder")}
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
