import { Loader, CheckCircle } from "lucide-react";

interface GenericStepProps {
  label: string;
  status: "pending" | "processing" | "completed";
}

export default function GenericStep({ label, status }: GenericStepProps) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${
        status === "completed"
          ? "bg-green-50"
          : status === "processing"
          ? "bg-blue-50"
          : "bg-slate-50"
      }`}
    >
      {status === "completed" ? (
        <CheckCircle size={18} className="text-green-600" />
      ) : status === "processing" ? (
        <Loader size={18} className="text-blue-600 animate-spin" />
      ) : (
        <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300" />
      )}
      <span
        className={`text-sm font-medium ${
          status === "completed"
            ? "text-green-800"
            : status === "processing"
            ? "text-blue-800"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
