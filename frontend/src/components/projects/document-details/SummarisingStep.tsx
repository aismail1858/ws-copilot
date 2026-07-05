import GenericStep from "./GenericStep";

interface SummarisingStepProps {
  status: "pending" | "processing" | "completed";
}

export default function SummarisingStep({ status }: SummarisingStepProps) {
  return <GenericStep label="Summarising" status={status} />;
}
