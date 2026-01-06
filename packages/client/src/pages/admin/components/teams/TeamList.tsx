import { Edit, Trash2, CalendarDays, Users } from "lucide-react";
import { EnrichedTeam } from "../../types/team";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { ScrollArea } from "../../../../components/ui/scroll-area";


interface TeamListProps {
  teams: EnrichedTeam[];
  onEdit: (team: EnrichedTeam) => void;
  onDelete: (teamId: string) => void;
  onViewAttendance: (team: EnrichedTeam) => void;
}

export function TeamList({
  teams,
  onEdit,
  onDelete,
  onViewAttendance,
}: TeamListProps) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-12 bg-blue-50/30 rounded-xl border border-blue-100 border-dashed">
        <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-blue-900">No teams yet</h3>
        <p className="text-blue-900/60 mt-1">
          Create a team to get started with this program.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {teams.map((team) => (
        <Card key={team.id} className="border-blue-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 transition-all group">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-blue-950">{team.name || "Unnamed Team"}</CardTitle>
                <CardDescription className="mt-1 text-blue-900/60">
                  Leader: <span className="font-medium text-blue-700">{team.leader?.name || "Unknown"}</span>
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {team.members?.length || 0} Members
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-blue-900/50 uppercase tracking-wider mb-2">
                  Team Members
                </p>
                <ScrollArea className="h-[100px] w-full rounded-md border border-blue-100 bg-blue-50/10 p-2">
                  <div className="flex flex-wrap gap-2">
                    {team.members?.map((member) => (
                      <Badge
                        key={member?.id}
                        variant="secondary"
                        className="bg-blue-100/50 text-blue-800 hover:bg-blue-100 transition-colors"
                      >
                        {member?.name}
                      </Badge>
                    ))}
                    {(!team.members || team.members.length === 0) && (
                      <span className="text-sm text-blue-900/40 italic">
                        No members assigned
                      </span>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-2 bg-blue-50/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAttendance(team)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Attendance
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(team)}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(team.id)}
              className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 shadow-none"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
