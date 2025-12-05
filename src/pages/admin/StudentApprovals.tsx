import { useStudentApprovals } from "./hooks/useStudentApprovals";
import { RegistrationList } from "./components/student-approvals/RegistrationList";
import { AdminHeader } from "./components/AdminHeader";


export function StudentApprovals() {
  const {
    activeTab,
    setActiveTab,
    pendingRegistrations,
    approvedRegistrations,
    handleApproveRegistration,
    handleRejectRegistration,
  } = useStudentApprovals();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Student Approvals"
        description="Review and approve student registrations"
      />

      {/* Tabs */}
      <div className="bg-card rounded-lg shadow-lg border border-border">
        <div className="border-b border-border">
          <div className="flex">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "pending"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
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
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
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
                <h2 className="text-xl font-semibold text-foreground">
                  Pending Student Registrations
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review documents and grant access based on submission email.
                </p>
              </div>
            </div>
            <RegistrationList
              registrations={pendingRegistrations}
              variant="pending"
              onApprove={handleApproveRegistration}
              onReject={handleRejectRegistration}
              emptyMessage="No pending registrations 🎉"
            />
          </div>
        )}

        {/* Approved Tab Content */}
        {activeTab === "approved" && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Approved Student Registrations
                </h2>
                <p className="text-sm text-muted-foreground">
                  List of students who have been approved and granted access.
                </p>
              </div>
            </div>
            <RegistrationList
              registrations={approvedRegistrations}
              variant="approved"
              emptyMessage="No approved registrations yet"
            />
          </div>
        )}
      </div>
    </div>
  );
}
