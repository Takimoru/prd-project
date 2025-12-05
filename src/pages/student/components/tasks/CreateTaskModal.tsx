import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { useAuth } from "../../../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { user } = useAuth();
  const createTask = useMutation(api.tasks.create);
  const myTeams = useQuery(api.teams.getTeamsForUser, user ? { userId: user._id } : "skip");

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teamId: "",
    workProgramId: "none",
    assignedMembers: [] as string[],
    startTime: "",
    endTime: "",
  });

  // Fetch work programs when team is selected
  const workPrograms = useQuery(
    api.workPrograms.getByTeam, 
    formData.teamId ? { teamId: formData.teamId as Id<"teams"> } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamId || formData.assignedMembers.length === 0) {
      toast.error("Please select a team and at least one assignee");
      return;
    }

    setIsLoading(true);
    try {
      // Ensure at least the creator is assigned if no one else is selected
      const assignedMembers = formData.assignedMembers.length > 0 
        ? formData.assignedMembers as Id<"users">[]
        : [user!._id];
      
      await createTask({
        teamId: formData.teamId as Id<"teams">,
        title: formData.title,
        description: formData.description,
        assignedMembers,
        startTime: formData.startTime || new Date().toISOString(),
        endTime: formData.endTime || new Date().toISOString(),
        createdBy: user!._id,
        workProgramId: formData.workProgramId === "none" ? undefined : (formData.workProgramId as Id<"work_programs">),
      });
      toast.success("Task created successfully");
      onClose();
      setFormData({
        title: "",
        description: "",
        teamId: "",
        workProgramId: "none",
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

  const selectedTeam = myTeams?.find(t => t._id === formData.teamId);

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
              onValueChange={(value) => setFormData({ ...formData, teamId: value, workProgramId: "none", assignedMembers: [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {myTeams?.map((team) => (
                  <SelectItem key={team._id} value={team._id}>
                    {team.name || "Untitled Team"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTeam && (
            <>
              <div className="space-y-2">
                <Label htmlFor="workProgram">Work Program (Optional)</Label>
                <Select
                  value={formData.workProgramId}
                  onValueChange={(value) => setFormData({ ...formData, workProgramId: value })}
                  disabled={!workPrograms}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select work program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Independent Task</SelectItem>
                    {workPrograms?.map((wp) => (
                      <SelectItem key={wp._id} value={wp._id}>
                        {wp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To (Select one or more)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedMembers.includes(selectedTeam.leaderId)}
                      onChange={(e) => {
                        const newMembers = e.target.checked
                          ? [...formData.assignedMembers, selectedTeam.leaderId]
                          : formData.assignedMembers.filter(id => id !== selectedTeam.leaderId);
                        setFormData({ ...formData, assignedMembers: newMembers });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Leader</span>
                  </label>
                  {selectedTeam.memberIds.map((memberId) => (
                    <label key={memberId} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignedMembers.includes(memberId)}
                        onChange={(e) => {
                          const newMembers = e.target.checked
                            ? [...formData.assignedMembers, memberId]
                            : formData.assignedMembers.filter(id => id !== memberId);
                          setFormData({ ...formData, assignedMembers: newMembers });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Member ({memberId.slice(0, 8)}...)</span>
                    </label>
                  ))}
                  {user && !selectedTeam.memberIds.includes(user._id as any) && selectedTeam.leaderId !== user._id && (
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignedMembers.includes(user._id)}
                        onChange={(e) => {
                          const newMembers = e.target.checked
                            ? [...formData.assignedMembers, user._id]
                            : formData.assignedMembers.filter(id => id !== user._id);
                          setFormData({ ...formData, assignedMembers: newMembers });
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Me ({user.name})</span>
                    </label>
                  )}
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
