import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, CheckCircle, FileText, PlusCircle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { Id } from "../../../../../convex/_generated/dataModel";

interface RecentActivityProps {
  teamId?: Id<"teams">;
}

export function RecentActivity({ teamId }: RecentActivityProps) {
  const activities = useQuery(api.activities.get, { teamId });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "created_task":
        return <PlusCircle className="w-4 h-4 text-green-500" />;
      case "completed_task":
        return <CheckCircle className="w-4 h-4 text-primary-500" />;
      case "updated_task":
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityMessage = (activity: {
    action: string;
    targetTitle: string;
    details?: string;
    userName: string;
    timestamp: string;
  }) => {
    switch (activity.action) {
      case "created_task":
        return (
          <span>
            created task <span className="font-medium">{activity.targetTitle}</span>
          </span>
        );
      case "completed_task":
        return (
          <span>
            completed <span className="font-medium">{activity.targetTitle}</span>
          </span>
        );
      case "updated_task":
        return (
          <span>
            updated {activity.details?.toLowerCase().includes("progress") ? "progress of" : ""} <span className="font-medium">{activity.targetTitle}</span>
          </span>
        );
      default:
        return <span>performed an action</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary-500" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!activities ? (
            <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No recent activity
            </p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity._id} className="flex gap-3">
                  <div className="mt-1">{getActivityIcon(activity.action)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{activity.userName}</span>{" "}
                      {getActivityMessage(activity)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

