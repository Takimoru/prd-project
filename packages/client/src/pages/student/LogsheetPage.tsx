import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_WEEKLY_RECAP, GET_TEAM_LOGSHEETS, UPLOAD_LOGSHEET } from "../../graphql/logsheet";
import { GET_MY_TEAMS } from "../../graphql/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Upload, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { format, startOfISOWeek, endOfISOWeek, eachWeekOfInterval, subWeeks } from "date-fns";
import { useStudentData } from "../student/hooks/useStudentData";
import { DashboardSidebar } from "../student/components/dashboard/DashboardSidebar";

export function LogsheetPage() {
  const { user } = useStudentData();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<string>("");

  const { data: teamsData, loading: teamsLoading } = useQuery(GET_MY_TEAMS);
  const myTeams = teamsData?.myTeams || [];

  // Initialize selectedTeamId if not set
  useMemo(() => {
    if (myTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams, selectedTeamId]);

  // Generate last 12 weeks for selection
  const weeks = useMemo(() => {
    const end = new Date();
    const start = subWeeks(end, 12);
    const interval = eachWeekOfInterval({ start, end });
    
    return interval.reverse().map(date => {
      const year = format(date, "yyyy");
      const week = format(date, "ww"); // ISO week number
      return {
        label: `Minggu ke-${week} (${format(startOfISOWeek(date), "d MMM")} - ${format(endOfISOWeek(date), "d MMM")}, ${year})`,
        value: `${year}-${week}`
      };
    });
  }, []);

  // Initialize selectedWeek if not set
  useMemo(() => {
    if (weeks.length > 0 && !selectedWeek) {
      setSelectedWeek(weeks[0].value);
    }
  }, [weeks, selectedWeek]);

  const { data: recapData, loading: recapLoading } = useQuery(GET_WEEKLY_RECAP, {
    variables: { teamId: selectedTeamId, week: selectedWeek },
    skip: !selectedTeamId || !selectedWeek
  });

  const { refetch: refetchLogs } = useQuery(GET_TEAM_LOGSHEETS, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId
  });

  const [uploadLogsheet, { loading: uploadLoading }] = useMutation(UPLOAD_LOGSHEET);

  const recap = recapData?.weeklyTaskRecap || [];

  const handleDownloadCSV = () => {
    if (recap.length === 0) {
      toast.error("Tidak ada data untuk diunduh");
      return;
    }

    const header = "Date,Task,Description,Work Program,Members,Completed At,Notes\n";
    const rows = recap.map((r: any) => {
      const escaped = (val?: string) => `"${(val || "").replace(/"/g, '""')}"`;
      return [
        r.date,
        escaped(r.taskTitle),
        escaped(r.taskDescription),
        escaped(r.workProgramTitle),
        escaped(r.members.join(", ")),
        new Date(r.completedAt).toLocaleString(),
        escaped(r.notes)
      ].join(",");
    }).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `logsheet-${selectedWeek}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    try {
      await uploadLogsheet({
        variables: { teamId: selectedTeamId, week: selectedWeek }
      });
      toast.success("Logbook berhasil diunggah ke Admin!");
      refetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah logbook");
    }
  };

  if (teamsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar user={user} />
      
      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Logbook Mingguan</h1>
              <p className="text-muted-foreground mt-1">
                Buat dan arsipkan rekap tugas mingguan tim Anda.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Selection Card */}
            <Card className="lg:col-span-1 border-primary/10 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary/70">Pengaturan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Pilih Tim</label>
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Pilih tim" />
                    </SelectTrigger>
                    <SelectContent>
                      {myTeams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Pilih Minggu</label>
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Pilih minggu" />
                    </SelectTrigger>
                    <SelectContent>
                      {weeks.map((week) => (
                        <SelectItem key={week.value} value={week.value}>
                          {week.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2" 
                    onClick={handleDownloadCSV}
                    disabled={recap.length === 0 || recapLoading}
                  >
                    <Download className="w-4 h-4" />
                    Ekspor CSV
                  </Button>
                  <Button 
                    className="w-full justify-start gap-2"
                    onClick={handleUpload}
                    disabled={recap.length === 0 || recapLoading || uploadLoading}
                  >
                    {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Arsipkan ke Admin
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pratinjau Rekap Mingguan</CardTitle>
                    <CardDescription>
                      Tugas selesai pada {selectedWeek.replace("Week", "Minggu")}
                    </CardDescription>
                  </div>
                  {recap.length > 0 && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recapLoading ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : recap.length > 0 ? (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Tanggal</TableHead>
                          <TableHead>Tugas</TableHead>
                          <TableHead>Anggota</TableHead>
                          <TableHead className="hidden lg:table-cell">Catatan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recap.map((row: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium whitespace-nowrap">{row.date}</TableCell>
                            <TableCell>
                              <div className="font-medium">{row.taskTitle}</div>
                              {row.workProgramTitle && (
                                <div className="text-xs text-muted-foreground">{row.workProgramTitle}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {row.members.map((m: string) => (
                                   <span key={m} className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px]">{m}</span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell max-w-[200px] truncate text-muted-foreground text-sm">
                              {row.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-muted/20 rounded-lg border border-dashed">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Tidak ada tugas yang selesai pada periode ini.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Coba pilih minggu lain atau verifikasi aktivitas tim Anda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
