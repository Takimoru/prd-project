import { Registration } from "../../types/student";
import { RegistrationCard } from "./RegistrationCard";
interface RegistrationListProps {
  registrations?: Registration[];
  variant: "pending" | "approved";
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  emptyMessage?: string;
}

export function RegistrationList({
  registrations,
  variant,
  onApprove,
  onReject,
  emptyMessage = "No registrations found",
}: RegistrationListProps) {
  if (!registrations || registrations.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {registrations.map((registration) => (
        <RegistrationCard
          key={registration.id}
          registration={registration}
          variant={variant}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
