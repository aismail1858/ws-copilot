import { useEffect, useRef } from "react";
import type { Message } from "../../lib/types";
import MessageItem from "./MessageItem";
import LoadingSpinner from "../ui/LoadingSpinner";

interface MessageListProps {
  messages: Message[];
  streaming?: boolean;
  onFeedback?: (messageId: string) => void;
}

export default function MessageList({
  messages,
  streaming,
  onFeedback,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        <p className="text-sm">Send a message to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          onFeedback={onFeedback}
        />
      ))}
      {streaming && (
        <div className="flex justify-start mb-4">
          <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
            <LoadingSpinner className="text-slate-400" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
