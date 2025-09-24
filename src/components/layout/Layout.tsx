import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 overflow-auto">
          {/* Floating toggle button for mobile */}
          <div className="fixed top-4 left-4 z-50 lg:hidden">
            <SidebarTrigger className="h-10 w-10 bg-background/90 backdrop-blur-sm border shadow-md hover:bg-muted rounded-md" />
          </div>
          
          {/* Desktop toggle button */}
          <div className="hidden lg:block fixed top-4 left-4 z-50">
            <SidebarTrigger className="h-10 w-10 bg-background/90 backdrop-blur-sm border shadow-md hover:bg-muted rounded-md" />
          </div>

          <div className="pt-16 lg:pt-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}