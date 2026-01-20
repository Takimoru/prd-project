import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MY_TEAM_FINAL_REPORTS, UPLOAD_FINAL_REPORT } from "../../graphql/finalReport";
import { GET_MY_TEAMS } from "../../graphql/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, CheckCircle2, Clock, AlertCircle, Download, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useStudentData } from "./hooks/useStudentData";
import { DashboardSidebar } from "./components/dashboard/DashboardSidebar";

export function FinalReportPage() {
  const { user } = useStudentData();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: teamsData, loading: teamsLoading } = useQuery(GET_MY_TEAMS);
  const myTeams = teamsData?.myTeams || [];

  // Initialize selectedTeamId if not set
  useMemo(() => {
    if (myTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(myTeams[0].id);
    }
  }, [myTeams, selectedTeamId]);

  const { data: reportsData, loading: reportsLoading, refetch } = useQuery(GET_MY_TEAM_FINAL_REPORTS, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId,
  });

  const [uploadFinalReportMutation] = useMutation(UPLOAD_FINAL_REPORT);

  const reports = reportsData?.myTeamFinalReports || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Hanya file PDF yang diperbolehkan");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10 MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedTeamId || !title.trim() || !selectedFile) {
      toast.error("Silakan lengkapi judul dan pilih file PDF");
      return;
    }

    setUploading(true);
    try {
      // Upload file first
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("targetType", "final-report");
      formData.append("targetId", selectedTeamId);

      const uploadResponse = await fetch("http://localhost:4000/api/upload/single", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Gagal mengunggah file");
      }

      const uploadResult = await uploadResponse.json();
      const fileUrl = uploadResult.url.startsWith("http")
        ? uploadResult.url
        : `http://localhost:4000${uploadResult.url}`;

      // Create final report entry
      await uploadFinalReportMutation({
        variables: {
          input: {
            teamId: selectedTeamId,
            title: title.trim(),
            description: description.trim() || undefined,
            fileUrl,
            fileName: selectedFile.name,
          },
        },
      });

      toast.success("Laporan akhir berhasil diunggah!");
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      refetch();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Gagal mengunggah laporan");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "revision_requested":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertCircle className="w-3 h-3 mr-1" />
            Perlu Revisi
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu Review
          </Badge>
        );
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Laporan Akhir</h1>
            <p className="text-muted-foreground mt-1">
              Unggah laporan akhir tim Anda untuk ditinjau oleh admin.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Card */}
            <Card className="lg:col-span-1 border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Unggah Laporan
                </CardTitle>
                <CardDescription>
                  Format: PDF, Maksimal 10 MB
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myTeams.length > 1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pilih Tim</label>
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger>
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
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Judul Laporan *</label>
                  <Input
                    placeholder="Contoh: Laporan Akhir KKN Desa Sukamaju"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Deskripsi (Opsional)</label>
                  <Textarea
                    placeholder="Tambahkan catatan atau deskripsi singkat..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">File PDF *</label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Terpilih: {selectedFile.name}
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={uploading || !title.trim() || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Unggah Laporan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Reports List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Laporan Yang Diunggah
                </CardTitle>
                <CardDescription>
                  Riwayat pengiriman laporan akhir tim Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report: any) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold truncate">{report.title}</h4>
                              {getStatusBadge(report.status)}
                            </div>
                            {report.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {report.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>
                                Diunggah: {format(new Date(report.createdAt), "d MMM yyyy, HH:mm", { locale: localeId })}
                              </span>
                              <span>oleh {report.uploadedBy?.name}</span>
                            </div>
                            {report.reviewNotes && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                                <strong>Catatan Reviewer:</strong> {report.reviewNotes}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <a
                              href={report.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded hover:bg-accent"
                            >
                              <Eye className="w-3 h-3" />
                              Lihat
                            </a>
                            <a
                              href={report.fileUrl}
                              download={report.fileName}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded hover:bg-accent"
                            >
                              <Download className="w-3 h-3" />
                              Unduh
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Belum ada laporan yang diunggah</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Unggah laporan akhir tim Anda menggunakan form di samping
                    </p>
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
