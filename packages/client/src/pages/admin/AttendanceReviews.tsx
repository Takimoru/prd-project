import { useAttendanceReviews } from "./hooks/useAttendanceReviews";
import { AttendanceControls } from "./components/attendance/AttendanceControls";
import { AttendanceTable } from "./components/attendance/AttendanceTable";
import { AdminHeader } from "./components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, LayoutGrid, Users, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AttendanceReviews() {
  const {
    selectedProgram,
    setSelectedProgram,
    selectedTeam,
    setSelectedTeam,
    selectedWeek,
    programs,
    teamsForProgram,
    attendanceSummary,
    handleWeekChange,
    handleExportAttendance,
    formatWeekRange,
  } = useAttendanceReviews();

  const currentProgram = programs?.find((p: any) => p.id === selectedProgram);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Tinjauan Absensi"
        description="Pantau dan setujui absensi mahasiswa di semua program kerja."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Program Selection Card */}
        <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              Pilih Periode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedProgram || ""} 
              onValueChange={(val) => {
                setSelectedProgram(val);
                setSelectedTeam(null);
              }}
            >
              <SelectTrigger className="w-full bg-background transition-all">
                <SelectValue placeholder="Pilih periode" />
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
              Pilih Tim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedTeam || ""} 
              onValueChange={(val) => setSelectedTeam(val)}
              disabled={!selectedProgram}
            >
              <SelectTrigger className="w-full bg-background transition-all">
                <SelectValue placeholder={!selectedProgram ? "Pilih periode terlebih dahulu" : "Pilih tim"} />
              </SelectTrigger>
              <SelectContent>
                {teamsForProgram?.map((team: any) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name || `Team ${team.id.slice(-6)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Detail Section */}
      <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
        {!selectedTeam ? (
          <div className="text-center py-24 bg-muted/5 rounded-xl border border-dashed border-muted-foreground/20 m-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Tidak Ada Tim Dipilih</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Silakan pilih periode dan kemudian pilih tim untuk meninjau catatan absensi mingguan mereka.
            </p>
          </div>
        ) : !attendanceSummary ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              Memuat data absensi...
            </p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b bg-muted/30">
              <AttendanceControls
                weekRange={formatWeekRange(attendanceSummary)}
                selectedWeek={selectedWeek}
                programName={currentProgram?.title || "Unknown Program"}
                onWeekChange={handleWeekChange}
                onExport={handleExportAttendance}
              />
            </div>
            
            <div className="p-0">
              <AttendanceTable
                attendanceSummary={attendanceSummary}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

