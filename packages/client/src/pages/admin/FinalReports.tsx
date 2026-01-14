import { useFinalReports } from "./hooks/useFinalReports";
import { ReportList } from "./components/reports/ReportList";
import { ReportDetailModal } from "./components/reports/ReportDetailModal";
import { AdminHeader } from "./components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, LayoutGrid, Users, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function FinalReports() {
  const {
    selectedProgram,
    setSelectedProgram,
    selectedTeam,
    setSelectedTeam,
    selectedReportId,
    setSelectedReportId,
    programs,
    teamsForProgram,
    reportsForTeam,
    selectedReportData,
    handleApproveReport,
    handleRequestRevision,
  } = useFinalReports();

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Final Reports"
        description="Review and approve weekly progress reports submitted by teams."
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
                setSelectedTeam(null);
                setSelectedReportId(null);
              }}
            >
              <SelectTrigger className="w-full bg-background transition-all">
                <SelectValue placeholder="Choose a program" />
              </SelectTrigger>
            <SelectContent>
                {programs?.map((program: any) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.title}
                  </SelectItem>
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
              onValueChange={(val) => {
                setSelectedTeam(val);
                setSelectedReportId(null);
              }}
              disabled={!selectedProgram}
            >
              <SelectTrigger className="w-full bg-background transition-all">
                <SelectValue placeholder={!selectedProgram ? "Select program first" : "Choose a team"} />
              </SelectTrigger>
              <SelectContent>
                {teamsForProgram?.map((team: any) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name || `Team ${team.id?.slice(-6)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Reports List Section */}
      <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
        {!selectedTeam ? (
          <div className="text-center py-24 bg-muted/5 rounded-xl border border-dashed border-muted-foreground/20 m-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Team Selected</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Please select a program and then a team to review their weekly reports and progress.
            </p>
          </div>
        ) : !reportsForTeam ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              Loading reports...
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b bg-muted/30">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                Weekly Reports
                <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                  {reportsForTeam.length} submissions
                </span>
              </h2>
            </div>
            <div className="p-6">
              <ReportList
                reports={reportsForTeam}
                onSelectReport={setSelectedReportId}
              />
            </div>
          </>
        )}
      </Card>

      {/* Report Detail Modal */}
      {selectedReportId && selectedReportData && (
        <ReportDetailModal
          report={selectedReportData}
          teamName={teamsForProgram?.find((t: any) => t.id === selectedTeam)?.name || "Team"}
          onClose={() => setSelectedReportId(null)}
          onApprove={handleApproveReport}
          onRequestRevision={handleRequestRevision}
        />
      )}
    </div>
  );
}

