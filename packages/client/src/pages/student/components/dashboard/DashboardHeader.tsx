import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

interface DashboardHeaderProps {
  title?: string;
  description?: string;
}

export function DashboardHeader({ 
  title = "Program Kerja", 
  description = "Kelola program kerja dan tugas yang sedang berjalan" 
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 sm:mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{description}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1 sm:flex-initial sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={`Cari ${title.toLowerCase()}...`} 
            className="pl-9 bg-card border-border focus:ring-primary"
          />
        </div>
        
        <Button variant="outline" className="gap-2 hidden sm:flex">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Aktif
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>

        <Button variant="outline" size="icon">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
