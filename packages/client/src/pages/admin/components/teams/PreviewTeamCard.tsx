import { useState } from "react";
import { PreviewTeam } from "../../types/team";
import { X, GripVertical } from "lucide-react";

interface PreviewTeamCardProps {
  team: PreviewTeam;
  allTeams: PreviewTeam[];
  onMoveStudent: (studentId: string, fromTempId: string | "unassigned", toTempId: string | "unassigned") => void;
  onRemoveStudent: (studentId: string, fromTempId: string) => void;
  onRenameTeam: (tempId: string, newName: string) => void;
}

export function PreviewTeamCard({
  team,
  allTeams: _allTeams,
  onMoveStudent,
  onRemoveStudent,
  onRenameTeam,
}: PreviewTeamCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(team.name);

  const [isDragOver, setIsDragOver] = useState(false);

  const handleRename = () => {
    if (nameInput.trim()) {
      onRenameTeam(team.tempId, nameInput.trim());
    }
    setIsEditing(false);
  };

  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    e.dataTransfer.setData("studentId", studentId);
    e.dataTransfer.setData("fromTempId", team.tempId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const studentId = e.dataTransfer.getData("studentId");
    const fromTempId = e.dataTransfer.getData("fromTempId");
    if (fromTempId !== team.tempId) {
      onMoveStudent(studentId, fromTempId, team.tempId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const majorColors: Record<string, string> = {
    "Teknik Informatika": "bg-blue-100 text-blue-700",
    "Sistem Informasi": "bg-purple-100 text-purple-700",
    "Teknik Elektro": "bg-yellow-100 text-yellow-700",
    "Teknik Sipil": "bg-green-100 text-green-700",
    "Manajemen": "bg-pink-100 text-pink-700",
    "Akuntansi": "bg-orange-100 text-orange-700",
    "Hukum": "bg-red-100 text-red-700",
  };

  const getMajorColor = (major: string) =>
    majorColors[major] || "bg-gray-100 text-gray-600";

  const isLeader = (index: number) => index === 0;

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all duration-200 ${
        isDragOver ? "border-blue-400 shadow-lg bg-blue-50" : "border-gray-200 hover:border-gray-300"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {isEditing ? (
          <input
            autoFocus
            className="text-sm font-semibold border border-blue-400 rounded px-2 py-1 w-full mr-2"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setNameInput(team.name); setIsEditing(false); } }}
          />
        ) : (
          <h4
            className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => { setIsEditing(true); setNameInput(team.name); }}
            title="Klik untuk rename"
          >
            {team.name}
          </h4>
        )}
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${team.members.length === 15 ? "bg-green-100 text-green-700" : team.members.length < 15 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
          {team.members.length}/15
        </span>
      </div>

      {/* Members List */}
      <div className="p-3 space-y-1.5 min-h-[200px]">
        {team.members.length === 0 && (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 italic">
            Drag mahasiswa ke sini
          </div>
        )}
        {team.members.map((member, idx) => (
          <div
            key={member.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 group cursor-grab active:cursor-grabbing transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, member.id)}
          >
            <GripVertical className="w-3 h-3 text-gray-300 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-700 font-medium truncate">{member.name}</span>
                {isLeader(idx) && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                    Ketua
                  </span>
                )}
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded mt-0.5 inline-block ${getMajorColor(member.major)}`}>
                {member.major}
              </span>
            </div>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
              onClick={() => onRemoveStudent(member.id, team.tempId)}
              title="Hapus dari tim"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Move-to Dropdown */}
      {team.members.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Drag anggota ke tim lain untuk memindahkan
          </p>
        </div>
      )}
    </div>
  );
}
