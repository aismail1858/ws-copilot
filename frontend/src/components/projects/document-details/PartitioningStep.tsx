import GenericStep from "./GenericStep";

interface PartitioningStepProps {
  status: "pending" | "processing" | "completed";
}

export default function PartitioningStep({ status }: PartitioningStepProps) {
  return <GenericStep label="Partitioning" status={status} />;
}
