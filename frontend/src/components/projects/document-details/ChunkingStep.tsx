import GenericStep from "./GenericStep";

interface ChunkingStepProps {
  status: "pending" | "processing" | "completed";
}

export default function ChunkingStep({ status }: ChunkingStepProps) {
  return <GenericStep label="Chunking" status={status} />;
}
