import { Doc, Id } from "@/convex/_generated/dataModel";
import { ProjectCard } from "./ProjectCard";

interface ProjectGridProps {
  teams:
    | (Doc<"teams"> & {
        program?: Doc<"programs"> | null;
        supervisor?: Doc<"users"> | null;
        members?: (Doc<"users"> | null)[];
      })[]
    | undefined
    | null;
  userId: Id<"users">;
  todaysAttendance: Doc<"attendance">[] | undefined | null;
}

const accentColors = [
  "bg-[hsl(var(--accent-blue))]",
  "bg-[hsl(var(--accent-purple))]",
  "bg-[hsl(var(--accent-orange))]",
  "bg-[hsl(var(--accent-green))]",
];

export function ProjectGrid({
  teams,
  userId,
  todaysAttendance,
}: ProjectGridProps) {
  if (!teams || teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No projects yet
        </h3>
        <p className="text-muted-foreground max-w-md">
          You haven't joined any teams yet. Once you're part of a team, your
          projects will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teams.map((team, idx) => (
        <ProjectCard
          key={team._id}
          team={team}
          userId={userId}
          todaysAttendance={todaysAttendance}
          accentColor={accentColors[idx % accentColors.length]}
        />
      ))}
    </div>
  );
}
