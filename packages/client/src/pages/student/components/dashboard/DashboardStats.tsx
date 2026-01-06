import { Calendar, Users, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Doc } from "@/convex/_generated/dataModel";

interface DashboardStatsProps {
  programs: Doc<"programs">[] | undefined;
  userRegistrations: Doc<"registrations">[] | undefined | null;
}

export function DashboardStats({
  programs,
  userRegistrations,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Today's Date</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {format(new Date(), "MMM dd, yyyy")}
            </p>
          </div>
          <Calendar className="w-8 h-8 text-primary-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Programs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {programs?.length || 0}
            </p>
          </div>
          <Users className="w-8 h-8 text-primary-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">My Registrations</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {userRegistrations?.filter((r) => r.status === "approved")
                .length || 0}
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-primary-500" />
        </div>
      </div>
    </div>
  );
}
