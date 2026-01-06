import { format } from "date-fns";
import { CheckCircle } from "lucide-react";
import { Registration } from "../../types/student";
interface RegistrationCardProps {
  registration: Registration;
  variant: "pending" | "approved";
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function RegistrationCard({
  registration,
  variant,
  onApprove,
  onReject,
}: RegistrationCardProps) {
  const isApproved = variant === "approved";

  return (
    <div
      className={`border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
        isApproved ? "bg-green-50 border-green-200" : ""
      }`}
    >
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {registration.fullName || "Unspecified"}
          </h3>
          {isApproved && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Approved
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{registration.email}</p>
        <p className="text-sm text-gray-600">
          Student ID: {registration.studentId || "—"}
        </p>
        <p className="text-sm text-gray-600">
          Phone: {registration.phone || "—"}
        </p>
        <p className="text-sm text-gray-600">
          Program: {registration.program?.title || "Unknown"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Submitted: {format(new Date(registration.submittedAt), "MMM dd, yyyy")}
        </p>
        
        {isApproved && registration.reviewedAt && (
          <p className="text-xs text-gray-500">
            Approved: {format(new Date(registration.reviewedAt), "MMM dd, yyyy")}
            {registration.reviewedBy && (
              <span> by {registration.reviewedBy.name || "Admin"}</span>
            )}
          </p>
        )}
        
        {isApproved && registration.user && (
          <p className="text-xs text-green-600 mt-1">
            ✓ User account active: {registration.user.name}
          </p>
        )}
      </div>
      
      <div className="flex flex-col items-end space-y-2">
        {registration.paymentProofUrl && (
          <a
            href={registration.paymentProofUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 border border-primary-200 text-primary-700 rounded text-sm hover:bg-primary-50"
          >
            View Payment Proof
          </a>
        )}
        
        {!isApproved && onApprove && onReject && (
          <div className="flex space-x-2">
            <button
              onClick={() => onApprove(registration.id)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(registration.id)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
