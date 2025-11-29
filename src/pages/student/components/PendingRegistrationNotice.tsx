
export function PendingRegistrationNotice() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
      <h2 className="font-semibold text-yellow-900">
        Registration Pending Verification
      </h2>
      <p className="mt-1">
        Your documents are under review by the admin team. Please make sure you
        have completed the program registration and submitted proof of payment.
        You will automatically gain full access once your data is verified and
        your role is upgraded to <span className="font-medium">student</span>.
      </p>
    </div>
  );
}
