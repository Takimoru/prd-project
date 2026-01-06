import { ReactNode } from "react";
import { SupervisorSidebar } from "./SupervisorSidebar";

interface SupervisorLayoutProps {
  children: ReactNode;
}

export function SupervisorLayout({ children }: SupervisorLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <SupervisorSidebar />
      <div className="lg:ml-64 pt-16 lg:pt-0 px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {children}
      </div>
    </div>
  );
}
