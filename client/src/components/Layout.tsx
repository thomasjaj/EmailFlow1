import { ReactNode } from "react";
import TopNavigation from "./TopNavigation";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <TopNavigation />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-60 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
