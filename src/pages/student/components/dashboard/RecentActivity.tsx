import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Activity, CheckCircle2, FileText, UserPlus } from "lucide-react";

interface RecentActivityProps {
  teams: any[];
}

export function RecentActivity({ teams }: RecentActivityProps) {
  // Simplified version - showing static placeholder
  // To properly implement this without hooks errors, we'd need a backend query
  // that fetches activities from all teams in a single call
  
  const mockActivities = [
    {
      id: '1',
      icon: CheckCircle2,
      color: 'text-green-500',
      user: 'Team member',
      message: 'completed a task',
      time: '2 hours ago'
    },
    {
      id: '2',
      icon: FileText,
      color: 'text-blue-500',
      user: 'Team member',
      message: 'uploaded files',
      time: '5 hours ago'
    },
    {
      id: '3',
      icon: UserPlus,
      color: 'text-purple-500',
      user: 'Team member',
      message: 'created a new task',
      time: '1 day ago'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(!teams || teams.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No teams yet
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Activity feed coming soon
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
