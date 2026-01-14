import { useQuery } from "@apollo/client";
import { GET_TEAM_LOGSHEETS } from "../../graphql/logsheet";
import { GET_PROGRAMS, GET_TEAMS_BY_PROGRAM } from "../../graphql/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Search, LayoutGrid, Users } from "lucide-react";
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
        {/* Program Selection Card */}
        <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              Select Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedProgram || ""} 
              onValueChange={(val) => {
                setSelectedProgram(val);
                setSelectedTeam("");
              }}
            >
              <SelectTrigger className="w-full bg-background transition-all">
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

        {/* Team Selection Card */}
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
              value={selectedTeam || ""} 
              onValueChange={setSelectedTeam}
              disabled={!selectedProgram}
            >
              <SelectTrigger className="w-full bg-background transition-all">
                <SelectValue placeholder={!selectedProgram ? "Select program first" : loadingTeams ? "Loading teams..." : "Choose a team"} />
              </SelectTrigger>
              <SelectContent>
                {teams.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Logsheets Table Section */}
      <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
        {!selectedTeam ? (
          <div className="text-center py-24 bg-muted/5 rounded-xl border border-dashed border-muted-foreground/20 m-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Team Selected</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Please select a program and then a team to review their weekly logsheet submissions.
            </p>
          </div>
        ) : loadingLogsheets ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              Fetching logsheets...
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b bg-muted/30 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                Logsheet Submissions
                <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                  {filteredLogs.length} found
                </span>
              </h2>
              <div className="relative w-64 text-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by week or name..." 
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[120px]">Week</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No submissions found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log: any) => (
                      <TableRow key={log.id} className="group hover:bg-primary/5 transition-colors">
                        <TableCell className="font-bold text-primary">
                          Week {log.weekNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(log.uploadedAt || log.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{log.createdBy?.name || "Anonymous"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                            asChild
                          >
                            <a href={log.fileUrl} target="_blank" rel="noreferrer">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
