import React, {
  useLayoutEffect,
  useRef,
  useState,
  KeyboardEvent,
  FormEvent,
  useEffect,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { generate } from "@/actions/ChatActions";
import { readStreamableValue } from "ai/rsc";
import { TailSpin } from "react-loader-spinner";
import { useSession } from "@clerk/nextjs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DocumentMatch {
  0: string;
  1: string;
  2: string;
  index: number;
  input: string;
}

export function ChatCardComponent() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const { session } = useSession();
  const sessionId = session?.id;

  // 🟢 refs -------------------------------------------------------------
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 🟢 state ------------------------------------------------------------
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  // 🟢 auto-scroll after every DOM commit -------------------------------
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      // Usar scrollIntoView solo en el contenedor de mensajes
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [messages]);

  // Focus textarea when loading is complete
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // 🟢 helpers ----------------------------------------------------------
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  const handleNewChat = () => {
    // Save current messages to history
    if (messages.length > 0) {
      setChatHistory((prev) => [...prev, ...messages]);
    }
    // Clear current messages
    setMessages([]);
  };

  const formatDocumentLink = (content: string): React.ReactNode => {
    // Regex para detectar bloques de código con ```
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    // Regex para detectar documentos con espacios y caracteres especiales
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let contentCopy = content;

    // Buscar todas las ocurrencias de bloques de código y links
    const matches: Array<{
      type: "code" | "link";
      index: number;
      length: number;
      content: string;
      language?: string;
    }> = [];

    // Encontrar bloques de código
    let codeMatch;
    while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
      matches.push({
        type: "code",
        index: codeMatch.index,
        length: codeMatch[0].length,
        content: codeMatch[2],
        language: codeMatch[1],
      });
    }

    // Encontrar links
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      matches.push({
        type: "link",
        index: linkMatch.index,
        length: linkMatch[0].length,
        content: linkMatch[0],
      });
    }

    // Ordenar todos los matches por índice
    matches.sort((a, b) => a.index - b.index);

    // Procesar el contenido con los matches ordenados
    let currentIndex = 0;

    for (const match of matches) {
      // Texto antes del match actual
      if (match.index > currentIndex) {
        const textBefore = content
          .slice(currentIndex, match.index)
          .replace(
            /\+\+([^\+]+)\+\+/g,
            '<span class="text-green-500">$1</span>'
          )
          .replace(/#(\d+)/g, '<span class="text-blue-500">#$1</span>')
          .replace(/\*\*([^\*]+)\*\*/g, '<span class="font-bold">$1</span>');
        parts.push(
          <span
            key={`text-${currentIndex}`}
            dangerouslySetInnerHTML={{ __html: textBefore }}
          />
        );
      }

      // Procesar el match según su tipo
      if (match.type === "code") {
        parts.push(
          <pre
            key={`code-${match.index}`}
            className="w-full overflow-x-auto my-2 p-3 rounded-md bg-gray-800 dark:bg-gray-900"
          >
            <code className="font-mono text-sm text-gray-100">
              {match.content}
            </code>
          </pre>
        );
      } else if (match.type === "link") {
        const linkRegexInstance = /\[([^\]]+)\]\(([^)]+)\)/;
        const linkParts = linkRegexInstance.exec(match.content);
        if (linkParts) {
          const fileName = linkParts[1].split("/").pop() || linkParts[1];
          const documentPath = linkParts[2];
          const fileUrl = `/${sessionId}/file?key=${encodeURIComponent(
            documentPath
          )}`;

          parts.push(
            <Link
              shallow
              key={`link-${match.index}`}
              href={fileUrl}
              className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
            >
              <span className="opacity-70">📄</span>
              <span className="break-all">{fileName}</span>
            </Link>
          );
        }
      }

      currentIndex = match.index + match.length;
    }

    // Texto después del último match
    if (currentIndex < content.length) {
      const remainingText = content
        .slice(currentIndex)
        .replace(/\+\+([^\+]+)\+\+/g, '<span class="text-green-500">$1</span>')
        .replace(/#(\d+)/g, '<span class="text-blue-500">#$1</span>')
        .replace(/\*\*([^\*]+)\*\*/g, '<span class="font-bold">$1</span>');
      parts.push(
        <span
          key="remaining-text"
          dangerouslySetInnerHTML={{ __html: remainingText }}
        />
      );
    }

    return <>{parts}</>;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    // 1. add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Set a timeout for the request (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "La solicitud ha excedido el tiempo de espera (30 segundos)"
              )
            ),
          30000
        );
      });

      // 2. call LLM with current locale and conversation history
      const conversationHistory = [...messages, userMessage];

      // Race between the actual request and the timeout
      const response = (await Promise.race([
        generate(input, locale, conversationHistory),
        timeoutPromise,
      ])) as any;

      // Check if the response indicates an error
      if (response.success === false) {
        // Use the error message directly with a fallback for safety
        const errorMessage =
          response.error ||
          t("chat.genericError", {
            fallback: "Lo siento, hubo un error al procesar tu mensaje.",
          });

        setMessages((prev) => [
          ...prev,
          {
            id: "error-" + Date.now(),
            role: "assistant",
            content: errorMessage,
          },
        ]);
        return; // Exit early, don't try to stream the response
      }

      // Continue with successful response
      const { output } = response;

      // 3. add empty assistant placeholder
      const assistantMessageId = "assistant-" + Date.now();
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      // 4. stream tokens into that placeholder
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
    } catch (err: any) {
      console.error("Error generating response:", err);

      // Extract error message - handle specific error cases
      let errorMessage =
        err.message ||
        t("chat.genericError", {
          fallback: "Lo siento, hubo un error al procesar tu mensaje.",
        });

      // Check for specific error types for more readable messages
      if (err.message && err.message.includes("Rate limit exceeded")) {
        errorMessage = t("chat.rateLimitError", { fallback: err.message });
      }
      // Check for timeout error
      else if (err.message && err.message.includes("tiempo de espera")) {
        errorMessage = t("chat.timeoutError", { fallback: err.message });
      }
      // Check for network error
      else if (err.message && err.message.includes("network")) {
        errorMessage = t("chat.networkError", {
          fallback:
            "Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.",
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 render -----------------------------------------------------------
  return (
    <Card className="w-full flex flex-col flex-1 min-h-0 max-h-screen">
      <CardHeader className="flex-none pb-4 flex items-center justify-between">
        <div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNewChat}
          title="Nuevo chat"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0 p-6">
        <ScrollArea className="flex-1 w-full pr-4 -mr-4 overflow-y-auto">
          <ScrollAreaPrimitive.Viewport className="w-full h-full flex flex-col">
            <div className="space-y-4 pb-4 flex-1">
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
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start w-full"
                    } mb-4`}
                  >
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground max-w-[85%] break-words"
                          : "bg-muted w-full break-words"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-all">
                        {message.role === "assistant"
                          ? formatDocumentLink(message.content)
                          : message.content}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* 🔻 sentinel — always last element */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollAreaPrimitive.Viewport>
          <ScrollAreaPrimitive.Scrollbar
            className="flex select-none touch-none p-0.5 bg-muted/5 transition-colors duration-150 ease-out hover:bg-muted/10 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
            orientation="vertical"
          >
            <ScrollAreaPrimitive.Thumb className="flex-1 bg-muted-foreground/30 rounded-full relative" />
          </ScrollAreaPrimitive.Scrollbar>
        </ScrollArea>

        <div className="pt-4 mt-2 border-t flex-none">
          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <div className="flex-grow relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                  }
                }}
                placeholder={t("placeholder")}
                className="w-full min-h-[60px] max-h-[180px] resize-none p-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className="h-[60px] w-[60px] flex items-center justify-center mb-1"
            >
              {isLoading ? (
                <TailSpin color="#ffffff" height={26} width={26} />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
