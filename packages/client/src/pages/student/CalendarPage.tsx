import { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isWithinInterval,
  parseISO,
  isValid
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { DashboardSidebar } from "./components/dashboard/DashboardSidebar";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { useStudentData } from "./hooks/useStudentData";
import { cn } from "../../lib/utils";
import { CreateTaskModal } from "./components/tasks/CreateTaskModal";

export function CalendarPage() {
  const { user, myTeams, isLoading } = useStudentData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => {
    const events: any[] = [];

    // Add Work Programs (Projects)
    if (myTeams) {
      myTeams.forEach(team => {
        if (team.program?.startDate && team.program?.endDate) {
          const start = parseISO(team.program.startDate);
          const end = parseISO(team.program.endDate);
          
          if (isValid(start) && isValid(end) && start <= end) {
            if (isWithinInterval(day, { start, end })) {
              events.push({
                id: team.id || team._id,
                title: team.program.title,
                type: 'program',
                color: 'bg-blue-500/10 text-blue-600 border-blue-200'
              });
            }
          }
        }
      });
    }

    return events;
  };

  if (!user && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        user={user} 
      />

      <div className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <DashboardHeader 
            title="Calendar" 
            description="View your schedule and deadlines" 
          />

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">Schedules</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[150px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday} className="ml-2">
                Today
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="p-0 border-b bg-muted/50">
              <div className="grid grid-cols-7">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-20">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-7 auto-rows-fr">
                  {calendarDays.map((day) => {
                    const events = getEventsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                      <div
                        key={day.toString()}
                        className={cn(
                          "min-h-[120px] p-2 border-b border-r transition-colors hover:bg-accent/5",
                          !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                          isToday && "bg-accent/10"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={cn(
                              "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                              isToday
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          {events.map((event, idx) => (
                            <div
                              key={`${event.id}-${idx}`}
                              className={cn(
                                "text-xs px-2 py-1 rounded-md border truncate",
                                event.color
                              )}
                              title={event.title}
                            >
                              {event.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
