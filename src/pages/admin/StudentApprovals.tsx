import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";

export function StudentApprovals() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const pendingRegistrations = useQuery(api.registrations.getPendingRegistrations, {});
  const approvedRegistrations = useQuery(api.registrations.getApprovedRegistrations, {});
  const approveRegistration = useMutation(api.registrations.approveRegistration);
  const rejectRegistration = useMutation(api.registrations.rejectRegistration);

  const handleApproveRegistration = async (registrationId: Id<"registrations">) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    try {
      await approveRegistration({
        registrationId: registrationId,
        adminId: user._id,
      });
      toast.success("Registration approved!");
    } catch (error: any) {
      console.error("Failed to approve:", error);
      toast.error(error.message || "Failed to approve registration");
    }
  };

  const handleRejectRegistration = async (registrationId: Id<"registrations">) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (confirm("Are you sure you want to reject this registration?")) {
      try {
        await rejectRegistration({
          registrationId: registrationId,
          adminId: user._id,
        });
        toast.success("Registration rejected");
      } catch (error: any) {
        console.error("Failed to reject:", error);
        toast.error(error.message || "Failed to reject registration");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Approvals</h1>
        <p className="text-gray-600 mt-2">
          Review and approve student registrations
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "pending"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending
              {pendingRegistrations && pendingRegistrations.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-yellow-600 rounded-full">
                  {pendingRegistrations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "approved"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Approved
              {approvedRegistrations && approvedRegistrations.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                  {approvedRegistrations.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pending Tab Content */}
        {activeTab === "pending" && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Pending Student Registrations
                </h2>
                <p className="text-sm text-gray-500">
                  Review documents and grant access based on submission email.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {pendingRegistrations && pendingRegistrations.length > 0 ? (
                pendingRegistrations.map((registration) => (
                  <div
                    key={registration._id}
                    className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {registration.fullName || "Unspecified"}
                      </h3>
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
                        Submitted:{" "}
                        {format(new Date(registration.submittedAt), "MMM dd, yyyy")}
                      </p>
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveRegistration(registration._id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRegistration(registration._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No pending registrations 🎉
                </p>
              )}
            </div>
          </div>
        )}

        {/* Approved Tab Content */}
        {activeTab === "approved" && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Approved Student Registrations
                </h2>
                <p className="text-sm text-gray-500">
                  List of students who have been approved and granted access.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {approvedRegistrations && approvedRegistrations.length > 0 ? (
                approvedRegistrations.map((registration) => (
                  <div
                    key={registration._id}
                    className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-green-50 border-green-200"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {registration.fullName || "Unspecified"}
                        </h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </span>
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
                        Submitted:{" "}
                        {format(new Date(registration.submittedAt), "MMM dd, yyyy")}
                      </p>
                      {registration.reviewedAt && (
                        <p className="text-xs text-gray-500">
                          Approved:{" "}
                          {format(new Date(registration.reviewedAt), "MMM dd, yyyy")}
                          {registration.reviewedBy && (
                            <span>
                              {" "}
                              by {registration.reviewedBy?.name || "Admin"}
                            </span>
                          )}
                        </p>
                      )}
                      {registration.user && (
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
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No approved registrations yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

