import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Textarea } from "../../../../components/ui/textarea";
import { Label } from "../../../../components/ui/label";
import { Input } from "../../../../components/ui/input";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Separator } from "../../../../components/ui/separator";
import { Badge } from "../../../../components/ui/badge";
import { Loader2, Send, CheckCircle2, FileText, X, Circle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../../../../contexts/AuthContext";
import { toast } from "react-hot-toast";

interface TaskDetailModalProps {
  taskId: Id<"tasks"> | null;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const task = useQuery(api.tasks.getById, taskId ? { id: taskId } : "skip");
  const taskUpdates = useQuery(api.tasks.getUpdates, taskId ? { taskId } : "skip");
  const addUpdate = useMutation(api.tasks.addUpdate);
  const updateTask = useMutation(api.tasks.update);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // In a real app, you would upload to storage here
    // For now, we'll simulate with placeholder URLs
    const newFiles = Array.from(files).map(file => 
      `https://storage.example.com/${Date.now()}_${file.name}`
    );
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`${files.length} file(s) added`);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMarkComplete = async () => {
    if (!taskId || !user || !task) return;
    
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one file to complete the task");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask({
        id: taskId,
        userId: user._id,
        completed: true,
        completionFiles: uploadedFiles,
      });
      toast.success("Task marked as complete!");
      setUploadedFiles([]);
      setFileInputKey(prev => prev + 1);
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to complete task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !user) return;
    if (!note && progress === "") return;

    setIsSubmitting(true);
    try {
      await addUpdate({
        taskId,
        memberId: user._id,
        notes: note,
        progress: progress === "" ? undefined : Number(progress),
      });
      setNote("");
      setProgress("");
      toast.success("Update added");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add update");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!taskId) return null;

  const isCompleted = task?.completed || false;
  const canComplete = task && !isCompleted && task.assignedMembers.includes(user?._id as any);

  return (
    <Dialog open={!!taskId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{task?.title || "Task Details"}</DialogTitle>
              {task?.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
            </div>
            {isCompleted && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Completion Files Section */}
              {isCompleted && task?.completionFiles && task.completionFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Completion Files</h3>
                  <div className="space-y-2">
                    {task.completionFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">{file.split('/').pop()}</span>
                      </div>
                    ))}
                  </div>
                  {task.completedBy && task.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed on {format(new Date(task.completedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                </div>
              )}

              {/* Activity History */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Activity History</h3>
                {taskUpdates?.map((update) => (
                  <div key={update._id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-semibold text-primary text-xs">
                        {update.user?.name?.[0] || "?"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{update.user?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(update.updatedAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      {update.notes && <p className="text-foreground/90">{update.notes}</p>}
                      {update.progress !== undefined && (
                        <Badge variant="secondary" className="mt-1">
                          Progress: {update.progress}%
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {taskUpdates?.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No updates yet.</p>
                )}
              </div>
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          {/* Action Area */}
          {!isCompleted && canComplete && (
            <div className="space-y-4">
              {/* File Upload for Completion */}
              <div className="space-y-2">
                <Label>Upload Files to Complete Task</Label>
                <div className="flex items-center gap-2">
                  <Input
                    key={fileInputKey}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleMarkComplete}
                    disabled={isSubmitting || uploadedFiles.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete Task
                      </>
                    )}
                  </Button>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{file.split('/').pop()}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(idx)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Add Update Form */}
              <form onSubmit={handleSubmitUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="note">Add Progress Update</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Type your update here..."
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="flex items-end gap-4">
                  <div className="space-y-2 w-32">
                    <Label htmlFor="progress">Progress (%)</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex-1 flex justify-end">
                    <Button type="submit" disabled={isSubmitting || (!note && progress === "")}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Post Update
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {isCompleted && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              This task has been completed
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
