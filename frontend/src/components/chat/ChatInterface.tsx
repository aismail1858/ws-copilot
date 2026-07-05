import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import type { Message } from "../../lib/types";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import MessageFeedbackModal from "./MessageFeedbackModal";

interface ChatInterfaceProps {
  chatId: string;
}

interface SSEStatusEvent {
  type: "status";
  status: string;
}

interface SSETokenEvent {
  type: "token";
  token: string;
}

interface SSEDoneEvent {
  type: "done";
  message: Message;
}

interface SSEErrorEvent {
  type: "error";
  error: string;
}

type SSEEvent = SSEStatusEvent | SSETokenEvent | SSEDoneEvent | SSEErrorEvent;

export default function ChatInterface({ chatId }: ChatInterfaceProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const parseSSE = useCallback(
    (
      reader: ReadableStreamDefaultReader<Uint8Array>,
      onEvent: (event: SSEEvent) => void
    ) => {
      const decoder = new TextDecoder();
      let buffer = "";

      const processLines = () => {
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (eventType === "status") {
              onEvent({ type: "status", status: data });
            } else if (eventType === "token") {
              try {
                const parsed = JSON.parse(data);
                onEvent({ type: "token", token: parsed.token || data });
              } catch {
                onEvent({ type: "token", token: data });
              }
            } else if (eventType === "done") {
              try {
                const parsed = JSON.parse(data);
                onEvent({ type: "done", message: parsed.message || parsed });
              } catch {
                onEvent({ type: "done", message: { id: "", content: data, role: "assistant", created_at: new Date().toISOString() } });
              }
            } else if (eventType === "error") {
              try {
                const parsed = JSON.parse(data);
                onEvent({ type: "error", error: parsed.error || parsed.detail || data });
              } catch {
                onEvent({ type: "error", error: data });
              }
            }
            eventType = "";
          }
        }
      };

      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) return undefined;
          buffer += decoder.decode(value, { stream: true });
          processLines();
          return pump();
        });

      return pump();
    },
    []
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!projectId || streaming) return;

      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        role: "user",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        content: "",
        role: "assistant",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        abortRef.current = new AbortController();
        const res = await fetch(
          `/api/projects/${projectId}/chats/${chatId}/messages/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
            credentials: "include",
            signal: abortRef.current.signal,
          }
        );

        if (!res.ok) throw new Error("Stream request failed");
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();

        await parseSSE(reader, (event) => {
          switch (event.type) {
            case "token":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.token }
                    : m
                )
              );
              break;
            case "done":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, ...event.message } : m
                )
              );
              break;
            case "error":
              throw new Error(event.error);
          }
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content || "Error generating response" }
                : m
            )
          );
        }
      } finally {
        setStreaming(false);
      }
    },
    [projectId, chatId, streaming, parseSSE]
  );

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#0d1117" }}>
      <MessageList
        messages={messages}
        streaming={streaming}
        onFeedback={setFeedbackTarget}
      />
      <ChatInput onSend={handleSend} disabled={streaming} />
      {feedbackTarget && (
        <MessageFeedbackModal
          messageId={feedbackTarget}
          onClose={() => setFeedbackTarget(null)}
        />
      )}
    </div>
  );
}
