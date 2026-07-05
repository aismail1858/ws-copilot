import { CheckCircle, Clock, Loader } from "lucide-react";

interface Step {
  key: string;
  label: string;
}

interface PipelineTabsProps {
  steps: Step[];
  currentStep: number;
  processingStatus: string;
}

export default function PipelineTabs({
  steps,
  currentStep,
  processingStatus,
}: PipelineTabsProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = step.key === processingStatus;
        const isPending = index > currentStep;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isCompleted
                  ? "bg-green-100 text-green-700"
                  : isCurrent
                  ? "bg-blue-100 text-blue-700"
                  : isPending
                  ? "bg-slate-100 text-slate-400"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {isCompleted ? (
                <CheckCircle size={12} />
              ) : isCurrent ? (
                <Loader size={12} className="animate-spin" />
              ) : (
                <Clock size={12} />
              )}
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div className="w-4 h-px bg-slate-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}
