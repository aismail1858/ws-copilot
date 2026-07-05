import { useState } from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { apiClient } from "../../lib/api";
import toast from "react-hot-toast";

interface MessageFeedbackModalProps {
  messageId: string;
  onClose: () => void;
}

export default function MessageFeedbackModal({
  messageId,
  onClose,
}: MessageFeedbackModalProps) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSending(true);
    try {
      await apiClient.post("/api/feedback", {
        message_id: messageId,
        rating,
        feedback_text: feedbackText,
      });
      toast.success("Feedback submitted");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-slate-800 rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-100">
            Rate this response
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-700 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setRating(1)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              rating === 1
                ? "bg-green-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <ThumbsUp size={16} />
            Like
          </button>
          <button
            onClick={() => setRating(-1)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              rating === -1
                ? "bg-red-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <ThumbsDown size={16} />
            Dislike
          </button>
        </div>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Additional feedback (optional)"
          rows={3}
          className="w-full px-3 py-2 bg-slate-700 text-slate-100 placeholder-slate-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-slate-300 hover:text-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!rating || sending}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
