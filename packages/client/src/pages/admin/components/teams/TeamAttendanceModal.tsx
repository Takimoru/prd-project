import { EnrichedTeam } from "../../types/team";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { AttendanceReviews } from "../../AttendanceReviews";

interface TeamAttendanceModalProps {
  team: EnrichedTeam;
  onClose: () => void;
}

export function TeamAttendanceModal({
  team,
  onClose,
}: TeamAttendanceModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Attendance History - {team.name || "Team"}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Note: You may need to select the program and team from the dropdowns below.
          </p>
          <AttendanceReviews />
        </div>
      </DialogContent>
    </Dialog>
  );
}
