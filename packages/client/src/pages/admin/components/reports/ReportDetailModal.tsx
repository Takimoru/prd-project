import { X, CheckCircle, Download, FileText, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ReportDetailModalProps {
  report: any; // FinalReport type
  teamName: string;
  onClose: () => void;
  onApprove: (reportId: string) => void;
  onRequestRevision: (reportId: string, comment: string) => void;
}

export function ReportDetailModal({
  report,
  teamName,
  onClose,
  onApprove,
  onRequestRevision,
}: ReportDetailModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Detail Laporan Akhir</h2>
            <p className="text-muted-foreground">{teamName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Judul Laporan</h3>
                <p className="font-semibold text-lg">{report.title}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                {getStatusBadge(report.status)}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Diunggah Oleh</h3>
                <p>{report.uploadedBy?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(report.createdAt), "d MMMM yyyy, HH:mm")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Deskripsi</h3>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {report.description || "Tidak ada deskripsi"}
                </p>
              </div>

              {report.reviewNotes && (
                <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-1">Catatan Revisi</h3>
                  <p className="text-sm text-yellow-700">{report.reviewNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* File Preview Section */}
          <div className="border rounded-lg overflow-hidden bg-muted/20">
            <div className="flex items-center justify-between p-3 bg-muted/40 border-b">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">
                  {report.fileName}
                </span>
              </div>
              <Button size="sm" variant="outline" asChild>
                <a href={report.fileUrl} download={report.fileName} target="_blank" rel="noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Unduh PDF
                </a>
              </Button>
            </div>
            <div className="aspect-[16/9] w-full bg-white relative">
              <iframe
                src={`${report.fileUrl}#toolbar=0`}
                className="w-full h-full absolute inset-0"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-muted/10 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          
          {report.status !== "approved" && (
            <>
              <Button 
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
                onClick={() => {
                  const comment = prompt("Masukkan catatan revisi:");
                  if (comment) {
                    onRequestRevision(report.id, comment);
                  }
                }}
              >
                Minta Revisi
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                    if(confirm("Apakah Anda yakin ingin menyetujui laporan ini?")) {
                        onApprove(report.id);
                    }
                }}
              >
                Setujui Laporan
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
