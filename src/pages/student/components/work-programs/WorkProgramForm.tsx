import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { useAuth } from "../../../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { AdminPageLayout } from "../../../admin/components/AdminPageLayout";
import { AdminHeader } from "../../../admin/components/AdminHeader";
import { ArrowLeft, Loader2 } from "lucide-react";

export function WorkProgramForm() {
  const { teamId, programId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!programId;

  const createWorkProgram = useMutation(api.workPrograms.create);
  const updateWorkProgram = useMutation(api.workPrograms.update);
  
  const existingProgram = useQuery(
    api.workPrograms.getById,
    programId ? { id: programId as Id<"work_programs"> } : "skip"
  );

  const team = useQuery(
    api.teams.getTeam,
    teamId ? { id: teamId as Id<"teams"> } : "skip"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Load existing data
  if (isEditing && existingProgram && formData.title === "") {
    setFormData({
      title: existingProgram.title,
      description: existingProgram.description,
      startDate: existingProgram.startDate,
      endDate: existingProgram.endDate,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !user) return;

    setIsLoading(true);
    try {
      if (isEditing && programId) {
        await updateWorkProgram({
          id: programId as Id<"work_programs">,
          userId: user._id,
          ...formData,
        });
        toast.success("Work program updated successfully");
      } else {
        await createWorkProgram({
          teamId: teamId as Id<"teams">,
          ...formData,
          assignedMembers: team?.memberIds || [], // Assign all team members by default
          createdBy: user._id,
        });
        toast.success("Work program created successfully");
      }
      navigate(-1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save work program");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing && !existingProgram) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <AdminPageLayout>
      <AdminHeader
        title={isEditing ? "Edit Work Program" : "Create Work Program"}
        description={team ? `For team: ${team.name}` : "Define a new work program"}
        action={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Program Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Community Health Initiative"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the goals and scope..."
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update Program" : "Create Program"}
            </Button>
          </div>
        </form>
      </div>
    </AdminPageLayout>
  );
}
