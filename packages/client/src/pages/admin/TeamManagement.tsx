import {
  Users,
  Plus,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

import { AdminHeader } from "./components/AdminHeader";
import { TeamList } from "./components/teams/TeamList";
import { ManageTeamModal } from "./components/teams/ManageTeamModal";
import { TeamAttendanceModal } from "./components/teams/TeamAttendanceModal";
import { GenerationPreviewPanel } from "./components/teams/GenerationPreviewPanel";
import { GenerateTeamsButton } from "./components/teams/GenerateTeamsButton";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useTeamManagement } from "./hooks/useTeamManagement";

export function TeamManagement() {
  const {
    selectedProgram,
    setSelectedProgram,
    isCreating,
    setIsCreating,
    editingTeam,
    viewingAttendanceTeam,
    setViewingAttendanceTeam,
    formData,
    setFormData,
    programs,
    teams,
    availableStudents,
    supervisors,
    handleCreateTeam,
    handleUpdateTeam,
    handleDeleteTeam,
    startEditing,
    resetForm,
    // Auto-generation
    isGenerating,
    isFinalizing,
    isPreviewMode,
    previewData,
    handleGenerateTeams,
    handleFinalizeTeams,
    discardPreview,
    moveStudentBetweenPreviewTeams,
    removeStudentFromPreviewTeam,
    renamePreviewTeam,
  } = useTeamManagement();

  const selectedProgramData = programs?.find((p: any) => p.id === selectedProgram);

  return (
    <div className="space-y-6">
      <AdminHeader
        title={
          selectedProgram
            ? `Tim: ${selectedProgramData?.title}`
            : "Manajemen Tim"
        }
        description={
          selectedProgram
            ? isPreviewMode
              ? "Mode preview — review dan finalisasi tim yang digenerate"
              : "Kelola tim untuk program ini"
            : "Pilih program untuk mengelola tim"
        }
        action={
          selectedProgram ? (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => { discardPreview(); setSelectedProgram(null); }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Program
              </Button>
              {!isPreviewMode && (
                <>
                  <GenerateTeamsButton
                    onGenerate={handleGenerateTeams}
                    isGenerating={isGenerating}
                    unassignedCount={availableStudents.length}
                  />
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Tim
                  </Button>
                </>
              )}
            </div>
          ) : null
        }
      />

      {!selectedProgram ? (
        // Program List View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs?.map((program: any) => (
            <Card
              key={program.id}
              className="hover:shadow-lg hover:shadow-blue-100 transition-all border-blue-100/50 hover:border-blue-300 bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent">
                <CardTitle className="text-blue-950">{program.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-blue-900/60">
                  {program.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-sm text-blue-900/70 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    <span>
                      {format(new Date(program.startDate), "d MMM yyyy")} -{" "}
                      {format(new Date(program.endDate), "d MMM yyyy")}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-blue-50/30">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-md"
                  onClick={() => setSelectedProgram(program.id)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Kelola Tim
                </Button>
              </CardFooter>
            </Card>
          ))}
          {programs?.length === 0 && (
            <div className="col-span-full text-center py-12 text-blue-900/50 bg-blue-50/30 rounded-xl border border-blue-100 border-dashed">
              Tidak ada program ditemukan.
            </div>
          )}
        </div>
      ) : isPreviewMode && previewData ? (
        // Generation Preview View
        <GenerationPreviewPanel
          previewData={previewData}
          onFinalize={handleFinalizeTeams}
          onDiscard={discardPreview}
          onMoveStudent={moveStudentBetweenPreviewTeams}
          onRemoveStudent={removeStudentFromPreviewTeam}
          onRenameTeam={renamePreviewTeam}
          isFinalizing={isFinalizing}
        />
      ) : (
        // Team List View
        <TeamList
          teams={teams || []}
          onEdit={startEditing}
          onDelete={handleDeleteTeam}
          onViewAttendance={setViewingAttendanceTeam}
        />
      )}

      {/* Modals */}
      {isCreating && (
        <ManageTeamModal
          formData={formData}
          isEditing={!!editingTeam}
          availableStudents={availableStudents}
          availableSupervisors={supervisors}
          onChange={setFormData}
          onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
          onClose={resetForm}
        />
      )}

      {viewingAttendanceTeam && (
        <TeamAttendanceModal
          team={viewingAttendanceTeam}
          onClose={() => setViewingAttendanceTeam(null)}
        />
      )}
    </div>
  );
}
