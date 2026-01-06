import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { useAuth } from "../../../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { GET_MY_TEAMS, CREATE_TASK_MUTATION } from "../../../../graphql/dashboard";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { user } = useAuth();
  
  const { data: teamsData } = useQuery(GET_MY_TEAMS, {
    skip: !user
  });

  const [createTaskMutation] = useMutation(CREATE_TASK_MUTATION, {
    refetchQueries: ['GetMyTasks', 'GetTeamTasks']
  });

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teamId: "",
    assignedMembers: [] as string[],
    startTime: "",
    endTime: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamId || formData.assignedMembers.length === 0) {
      toast.error("Please select a team and at least one assignee");
      return;
    }

    setIsLoading(true);
    try {
      await createTaskMutation({
        variables: {
          teamId: formData.teamId,
          title: formData.title,
          description: formData.description || undefined,
          assignedMemberIds: formData.assignedMembers,
          startTime: formData.startTime || undefined,
          endTime: formData.endTime || undefined,
        }
      });
      toast.success("Task created successfully");
      onClose();
      setFormData({
        title: "",
        description: "",
        teamId: "",
        assignedMembers: [],
        startTime: "",
        endTime: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  const myTeams = teamsData?.myTeams || [];
  const selectedTeam = myTeams?.find((t: any) => t.id === formData.teamId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Design Homepage"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Date</Label>
              <Input
                id="startTime"
                type="date"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Date</Label>
              <Input
                id="endTime"
                type="date"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select
              value={formData.teamId}
              onValueChange={(value) => setFormData({ ...formData, teamId: value, assignedMembers: [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {myTeams?.map((team: any) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name || "Untitled Team"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTeam && (
            <>
              <div className="space-y-2">
                <Label>Assign To (Select one or more)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedMembers.includes((selectedTeam as any).leader?.id)}
                      onChange={(e) => {
                        const leaderId = (selectedTeam as any).leader?.id;
                        if (!leaderId) return;
                        const newMembers = e.target.checked
                          ? [...formData.assignedMembers, leaderId]
                          : formData.assignedMembers.filter(id => id !== leaderId);
                        setFormData({ ...formData, assignedMembers: newMembers });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Leader ({(selectedTeam as any).leader?.name})</span>
                  </label>
                  {(selectedTeam as any).members?.map((member: any) => (
                    <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignedMembers.includes(member.id)}
                        onChange={(e) => {
                          const newMembers = e.target.checked
                            ? [...formData.assignedMembers, member.id]
                            : formData.assignedMembers.filter(id => id !== member.id);
                          setFormData({ ...formData, assignedMembers: newMembers });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{member.name}</span>
                    </label>
                  ))}
                </div>
                {formData.assignedMembers.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formData.assignedMembers.length} member(s) selected
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
