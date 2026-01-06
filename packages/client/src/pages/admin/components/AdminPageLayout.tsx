import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminPageLayoutProps {
  children: ReactNode;
}

export function AdminPageLayout({ children }: AdminPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  );
}
