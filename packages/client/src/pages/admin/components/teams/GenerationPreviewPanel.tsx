import { GeneratedTeamPreview } from "../../types/team";
import { PreviewTeamCard } from "./PreviewTeamCard";
import { CheckCircle, XCircle, Users, AlertTriangle, Loader2 } from "lucide-react";

interface GenerationPreviewPanelProps {
  previewData: GeneratedTeamPreview;
  onFinalize: () => void;
  onDiscard: () => void;
  onMoveStudent: (studentId: string, fromTempId: string, toTempId: string) => void;
  onRemoveStudent: (studentId: string, fromTempId: string) => void;
  onRenameTeam?: (tempId: string, newName: string) => void;
  isFinalizing?: boolean;
}

export function GenerationPreviewPanel({
  previewData,
  onFinalize,
  onDiscard,
  onMoveStudent,
  onRemoveStudent,
  onRenameTeam,
  isFinalizing = false,
}: GenerationPreviewPanelProps) {
  const totalStudents = previewData.teams.reduce((sum, t) => sum + t.members.length, 0);
  const teamsNotFull = previewData.teams.filter((t) => t.members.length < 15).length;

  const handleRenameTeam = (tempId: string, newName: string) => {
    onRenameTeam?.(tempId, newName);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Preview Tim yang Digenerate
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              {previewData.teams.length} tim • {totalStudents} mahasiswa dialokasikan
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDiscard}
              disabled={isFinalizing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4" />
              Buang Preview
            </button>
            <button
              onClick={onFinalize}
              disabled={isFinalizing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-indigo-700 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isFinalizing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isFinalizing ? "Menyimpan..." : "Finalisasi & Simpan"}
            </button>
          </div>
        </div>
      </div>

      {/* Warning if teams are not full */}
      {teamsNotFull > 0 && (
        <div className="mx-6 mt-4 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>{teamsNotFull} tim</strong> belum memiliki 15 anggota. Anda bisa
            drag-and-drop anggota antar tim sebelum finalisasi.
          </span>
        </div>
      )}

      {/* Team Grid */}
      <div className="p-6 space-y-8">
        {/* Unassigned Students Pool */}
        {previewData.unassignedStudents.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Mahasiswa Belum Terpilih ({previewData.unassignedStudents.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {previewData.unassignedStudents.map((student) => (
                <div
                  key={student.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("studentId", student.id);
                    e.dataTransfer.setData("fromTempId", "unassigned");
                  }}
                  className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center gap-2"
                >
                  {student.name}
                  <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">
                    {student.major}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-3 italic">
              💡 Drag mahasiswa dari sini ke dalam tim untuk menambahkan anggota.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {previewData.teams.map((team) => (
            <PreviewTeamCard
              key={team.tempId}
              team={team}
              allTeams={previewData.teams}
              onMoveStudent={onMoveStudent}
              onRemoveStudent={onRemoveStudent}
              onRenameTeam={handleRenameTeam}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          💡 Klik nama tim untuk mengubah namanya. Drag anggota untuk memindahkan antar tim.
          Anggota pertama setiap tim akan otomatis menjadi ketua.
        </p>
        <div className="flex gap-3 flex-shrink-0 ml-4">
          <button
            onClick={onDiscard}
            disabled={isFinalizing}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Buang
          </button>
          <button
            onClick={onFinalize}
            disabled={isFinalizing}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isFinalizing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isFinalizing ? "Menyimpan..." : "Finalisasi & Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
