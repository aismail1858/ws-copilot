import { X } from "lucide-react";

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export default function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
      <h2 className="text-sm font-semibold text-slate-800 truncate">
        {title}
      </h2>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
      >
        <X size={18} />
      </button>
    </div>
  );
}
