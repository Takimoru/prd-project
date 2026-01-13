import { TeamForm } from "../../types/team";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { Label } from "../../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { ScrollArea } from "../../../../components/ui/scroll-area";

interface ManageTeamModalProps {
  formData: TeamForm;
  isEditing: boolean;
  availableStudents: any[];
  availableSupervisors?: any[];
  onChange: (data: TeamForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function ManageTeamModal({
  formData,
  isEditing,
  availableStudents,
  availableSupervisors,
  onChange,
  onSubmit,
  onClose,
}: ManageTeamModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Team" : "Create New Team"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              placeholder="e.g., Alpha Squad"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leader">Select Leader</Label>
            <Select
              value={formData.leaderId}
              onValueChange={(value) =>
                onChange({ ...formData, leaderId: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a leader" />
              </SelectTrigger>
              <SelectContent>
                {availableStudents?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supervisor">Select Supervisor (Optional)</Label>
            <Select
              value={formData.supervisorId || "none"}
              onValueChange={(value) =>
                onChange({
                  ...formData,
                  supervisorId: value === "none" ? undefined : (value as any),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Supervisor</SelectItem>
                {availableSupervisors?.map((supervisor) => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>
                    {supervisor.name} ({supervisor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Members</Label>
            <ScrollArea className="h-[240px] border rounded-md p-4">
              <div className="space-y-2">
                {availableStudents?.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors"
                    onClick={() => {
                      const newMembers = formData.memberIds.includes(student.id)
                        ? formData.memberIds.filter((id) => id !== student.id)
                        : [...formData.memberIds, student.id];
                      onChange({ ...formData, memberIds: newMembers });
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.memberIds.includes(student.id)}
                      readOnly
                      className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">
                        {student.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {student.email}
                      </p>
                    </div>
                  </div>
                ))}
                {availableStudents?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No available students found
                  </p>
                )}
              </div>
            </ScrollArea>
            <p className={`text-xs mt-1 ${formData.memberIds.length < 7 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              Selected: {formData.memberIds.length} members {formData.memberIds.length < 7 && "(Minimum 7 required)"}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isEditing && formData.memberIds.length < 7}
              title={!isEditing && formData.memberIds.length < 7 ? "At least 7 members are required to create a team" : ""}
            >
              {isEditing ? "Update Team" : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
