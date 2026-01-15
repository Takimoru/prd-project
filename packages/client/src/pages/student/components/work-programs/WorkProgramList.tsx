import { useQuery } from "@apollo/client";
import { GET_WORK_PROGRAMS } from "@/graphql/student";
import { GET_TEAM_DETAILS } from "@/graphql/dashboard";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Plus, Calendar, Users, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface WorkProgramListProps {
  teamId: string;
  isLeader: boolean;
}

export function WorkProgramList({ teamId, isLeader }: WorkProgramListProps) {
  const navigate = useNavigate();
  const { data: workProgramsData, loading: workProgramsLoading } = useQuery(GET_WORK_PROGRAMS, {
    variables: { teamId },
    skip: !teamId,
  });
  const { loading: teamLoading } = useQuery(GET_TEAM_DETAILS, {
    variables: { teamId },
    skip: !teamId,
  });

  const workPrograms = workProgramsData?.workPrograms || [];


  if (workProgramsLoading || teamLoading) {
    return <div>Memuat program kerja...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Program Kerja</h2>
          <p className="text-muted-foreground">
            Kelola dan pantau inisiatif jangka panjang
          </p>
        </div>
        {isLeader && (
          <Button onClick={() => navigate(`/team/${teamId}/programs/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Program Baru
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workPrograms.map((program: any) => {
          return (
            <div
              key={program.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer group relative"
              onClick={() => navigate(`/team/${teamId}/programs/${program.id}`)}
            >
              {/* Colored top border */}
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">
                      {program.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      Aktif
                    </Badge>
                  </div>
                  <button 
                    className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add menu actions here
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {program.description}
                </p>

                {/* Progress - Simplified to avoid hooks */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progres</span>
                    <span className="font-semibold">Lihat detail</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{program.assignedMembers?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Tugas</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Tenggat {format(new Date(program.endDate), "d MMM")}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Lihat detail
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {workPrograms.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed rounded-lg bg-muted/50">
            <p className="text-muted-foreground">Tidak ada program kerja ditemukan</p>
            {isLeader && (
              <Button
                variant="link"
                onClick={() => navigate(`/team/${teamId}/programs/new`)}
              >
                Buat program kerja pertama Anda
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
