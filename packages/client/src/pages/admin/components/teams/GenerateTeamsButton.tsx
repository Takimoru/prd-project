import { Wand2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GenerateTeamsButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
  unassignedCount: number;
}

export function GenerateTeamsButton({
  onGenerate,
  isGenerating,
  unassignedCount,
}: GenerateTeamsButtonProps) {
  const isBlocked = unassignedCount < 15;

  const button = (
    <Button
      variant="outline"
      onClick={onGenerate}
      disabled={isGenerating || isBlocked}
      className={`border-indigo-300 text-indigo-700 hover:bg-indigo-50 ${
        isBlocked ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Wand2 className="w-4 h-4 mr-2" />
      )}
      Generate Otomatis
    </Button>
  );

  if (isBlocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{button}</TooltipTrigger>
          <TooltipContent className="bg-amber-50 text-amber-900 border-amber-200">
            <div className="flex items-center gap-2 py-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-medium">
                Jumlah Mahasiswa Belum Cukup (min. 15 mahasiswa)
              </p>
            </div>
            <p className="text-xs text-amber-700/70 mt-0.5">
              Saat ini hanya ada {unassignedCount} mahasiswa yang belum masuk tim.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
