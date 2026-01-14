import { useQuery } from "@apollo/client";
import { GET_TEAM_LOGSHEETS } from "../../graphql/logsheet";
import { GET_PROGRAMS, GET_TEAMS_BY_PROGRAM } from "../../graphql/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileText, Search, LayoutGrid, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { AdminHeader } from "./components/AdminHeader";

export function LogsheetReviewPage() {
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Programs
  const { data: programsData, loading: loadingPrograms } = useQuery(GET_PROGRAMS, {
    variables: { includeArchived: false }
  });

  // Fetch Teams for Program
  const { data: teamsData, loading: loadingTeams } = useQuery(GET_TEAMS_BY_PROGRAM, {
    variables: { programId: selectedProgram },
    skip: !selectedProgram
  });

  // Fetch Logsheets for Team
  const { data: logsheetsData, loading: loadingLogsheets } = useQuery(GET_TEAM_LOGSHEETS, {
    variables: { teamId: selectedTeam },
    skip: !selectedTeam
  });

  const programs = programsData?.programs || [];
  const teams = teamsData?.teams || [];
  const logsheets = logsheetsData?.myTeamLogsheets || [];

  const filteredLogs = logsheets.filter((log: any) => 
    log.weekNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Logsheet Reviews"
        description="Monitor and review weekly progress recaps submitted by teams."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Program Selection */}
        <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              Select Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedProgram} 
              onValueChange={(val) => {
                setSelectedProgram(val);
                setSelectedTeam("");
              }}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder={loadingPrograms ? "Loading programs..." : "Choose a program"} />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Team Selection */}
        <Card className={cn(
          "border-primary/20 shadow-sm transition-all",
          !selectedProgram && "opacity-50 grayscale pointer-events-none"
        )}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Select Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedTeam} 
              onValueChange={setSelectedTeam}
              disabled={!selectedProgram}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder={loadingTeams ? "Loading teams..." : "Choose a team"} />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} - {t.leader?.name || "No Leader"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Logsheets Table */}
      <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Team Logsheets</CardTitle>
              <CardDescription>
                Review all submissions for the selected team.
              </CardDescription>
            </div>
            {selectedTeam && (
              <div className="relative w-full md:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search week or user..."
                    className="pl-9 bg-background/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedTeam ? (
            <div className="text-center py-24 bg-muted/5">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No Team Selected</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                Please select a program and then a team to view their logsheet submissions.
              </p>
            </div>
          ) : loadingLogsheets ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-32">Week</TableHead>
                  <TableHead>Uploaded At</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors group">
                    <TableCell>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                            {log.weekNumber}
                        </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium">
                          {log.createdBy?.name?.charAt(0)}
                        </div>
                        <span className="font-medium">{log.createdBy?.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="gap-2 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all" asChild>
                        <a href={log.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20 bg-muted/10">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No logsheets submitted by this team yet.</p>
              {searchTerm && (
                 <Button 
                   variant="link" 
                   onClick={() => setSearchTerm("")}
                   className="mt-2 text-primary"
                 >
                    Clear search filters
                 </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
