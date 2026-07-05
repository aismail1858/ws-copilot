import type { Message } from "../../lib/types";

interface MessageItemProps {
  message: Message;
  onFeedback?: (messageId: string) => void;
}

export default function MessageItem({ message, onFeedback }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-slate-800 text-slate-100 rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-600/50">
            <p className="text-xs text-slate-400 mb-1">Sources</p>
            <div className="flex flex-wrap gap-1">
              {message.citations.map((c: any, i: number) => (
                <span
                  key={i}
                  className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded"
                >
                  {c.filename || c.source || `Source ${i + 1}`}
                </span>
              ))}
            </div>
          </div>
        )}
        {!isUser && onFeedback && (
          <button
            onClick={() => onFeedback(message.id)}
            className="mt-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Rate response
          </button>
        )}
      </div>
    </div>
  );
}
