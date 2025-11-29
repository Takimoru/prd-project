import { format } from "date-fns";
import { Calendar, Clock, Info, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";


import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { toast } from "react-hot-toast";

import { Doc, Id } from "../../convex/_generated/dataModel";

interface Program extends Omit<Doc<"programs">, "_id"> {
  _id: Id<"programs"> | string;
}

interface Registration extends Omit<Doc<"registrations">, "_id" | "programId" | "userId"> {
  _id: string;
  programId: string;
  status: "pending" | "approved" | "rejected";
}

interface Documentation {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface Team {
  _id: Id<"teams">;
  programId: Id<"programs">;
  progress?: number;
  documentation?: Documentation[];
}

interface ProgramDetailsProps {
  program: Program;
  registration?: Registration;
  team?: Team;
  onRegister?: () => void;
}

export function ProgramDetails({ program, registration, team }: ProgramDetailsProps) {
  const updateProgress = useMutation(api.teams.updateProgress);
  const addDocumentation = useMutation(api.teams.addDocumentation);

  const [isUploading, setIsUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");

  const handleProgressChange = async (newProgress: number) => {
    if (!team) return;
    try {
      await updateProgress({ teamId: team._id, progress: newProgress });
      toast.success("Progress updated");
    } catch (error) {
      toast.error("Failed to update progress");
      console.error(error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !docName || !docUrl) return;

    setIsUploading(true);
    try {
      await addDocumentation({
        teamId: team._id,
        name: docName,
        url: docUrl,
        type: "link", // For now, assuming link. File upload would need storage.
      });
      toast.success("Documentation added");
      setDocName("");
      setDocUrl("");
    } catch (error) {
      toast.error("Failed to add documentation");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{program.title}</CardTitle>
              <CardDescription className="flex items-center space-x-2 mt-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(program.startDate), "MMMM d, yyyy")} -{" "}
                  {format(new Date(program.endDate), "MMMM d, yyyy")}
                </span>
              </CardDescription>
            </div>
            {registration && (
              <Badge
                variant={
                  registration.status === "approved"
                    ? "default" // Map to default (primary) or create success variant
                    : registration.status === "pending"
                    ? "secondary"
                    : "destructive"
                }
                className={
                   registration.status === "approved" ? "bg-green-600 hover:bg-green-700" : ""
                }
              >
                Registration: {registration.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-2">About this Program</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{program.description}</p>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {Math.ceil(
                    (new Date(program.endDate).getTime() -
                      new Date(program.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Status</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {team && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Program Progress
              </CardTitle>
              <CardDescription>Track your team's completion status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-muted-foreground">{team.progress || 0}%</span>
                </div>
                <Progress value={team.progress || 0} className="h-2" />
              </div>
              
              <div className="pt-4 space-y-2">
                <Label>Update Progress</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    min="0" 
                    max="100"
                    placeholder="0-100"
                    defaultValue={team.progress || 0}
                    onChange={(e) => {
                       const val = parseInt(e.target.value);
                       if (!isNaN(val) && val >= 0 && val <= 100) {
                          handleProgressChange(val);
                       }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Update the percentage as you complete milestones.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentation
              </CardTitle>
              <CardDescription>Upload and manage project documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Form */}
              <form onSubmit={handleUpload} className="space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input
                    id="doc-name"
                    placeholder="e.g., Project Proposal"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="doc-url">Document URL</Label>
                  <Input
                    id="doc-url"
                    placeholder="https://..."
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isUploading} className="w-full">
                  {isUploading ? "Adding..." : "Add Documentation"}
                </Button>
              </form>

              <Separator />

              {/* Documents List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Uploaded Documents</h4>
                {!team.documentation || team.documentation.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No documentation uploaded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {team.documentation.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 rounded-md bg-primary/10 text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {!registration && (
         <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-blue-800 text-sm">
               To register for this program, please use the public registration form or contact the administrator.
            </p>
         </div>
      )}
    </div>
  );
}
