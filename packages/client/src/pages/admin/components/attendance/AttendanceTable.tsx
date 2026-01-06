import { CheckCircle } from "lucide-react";
import { AttendanceSummary } from "../../types/attendance";

export function AttendanceTable({
  attendanceSummary,
}: {
  attendanceSummary: AttendanceSummary;
}) {
  const dates =
    attendanceSummary.students.length > 0
      ? attendanceSummary.students[0].dailyRecords.map((d) => d.date)
      : [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="p-6 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="py-2 pr-4 font-medium">Student</th>
            {dates.map((date) => (
              <th key={date} className="py-2 px-2 font-medium text-center">
                {formatDate(date)}
              </th>
            ))}
            <th className="py-2 px-2 font-medium text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {attendanceSummary.students.map((student) => {
            const isApproved = student.approvalStatus === "approved";

            return (
              <tr key={student.userId}>
                <td className="py-2 pr-4 font-medium text-gray-900">
                  {student.userName}
                  {!isApproved && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Approval
                    </span>
                  )}
                </td>

                {isApproved
                  ? // Show actual attendance data if approved
                    student.dailyRecords.map((day) => {
                      let content;

                      if (day.status === "present") {
                        content = (
                          <span title="Present">
                            <CheckCircle className="w-5 h-5 text-green-600 inline" />
                          </span>
                        );
                      } else if (day.status === "permission") {
                        content = (
                          <div className="group relative inline-block">
                            <div
                              className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-white cursor-help"
                              title={`Permission: ${day.excuse || "No excuse provided"}`}>
                              P
                            </div>
                          </div>
                        );
                      } else if (day.status === "alpha") {
                        content = (
                          <span
                            className="text-red-500 font-bold cursor-help"
                            title="Alpha (Absent)">
                            A
                          </span>
                        );
                      } else {
                        // No status usually means absent/alpha or future
                        content = (
                          <span
                            className="text-red-500 font-bold cursor-help"
                            title="Absent">
                            A
                          </span>
                        );
                      }

                      return (
                        <td
                          key={`${student.userId}-${day.date}`}
                          className="py-2 px-2 text-center">
                          {content}
                        </td>
                      );
                    })
                  : // Show placeholders if not approved
                    student.dailyRecords.map((day) => (
                      <td
                        key={`${student.userId}-${day.date}`}
                        className="py-2 px-2 text-center">
                        <span className="text-gray-300 text-xs">•</span>
                      </td>
                    ))}

                <td className="py-2 px-2 text-center font-semibold text-gray-700">
                  {isApproved ? student.presentCount || 0 : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
