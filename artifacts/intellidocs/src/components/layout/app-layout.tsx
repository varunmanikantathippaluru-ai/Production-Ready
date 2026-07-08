import React from "react";
import { Link, useLocation } from "wouter";
import { 
  FileText, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu,
  Moon,
  Sun,
  X,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useListConversations } from "@workspace/api-client-react";
import { useTheme } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getListConversationsQueryKey } from "@workspace/api-client-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const { data: conversationsData } = useListConversations({ limit: 8 }, {
    query: {
      queryKey: getListConversationsQueryKey({ limit: 8 })
    }
  });

  const handleSignOut = async () => {
    await signOut();
    setLocation("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar/50 backdrop-blur-xl border-r border-sidebar-border w-64 text-sidebar-foreground">
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary size-5"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">IntelliDocs</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1 mb-6">
          <Link href="/dashboard">
            <Button
              variant={location === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/documents">
            <Button
              variant={location.startsWith("/documents") ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
            >
              <FileText className="size-4" />
              Documents
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant={location === "/settings" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
            >
              <Settings className="size-4" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="mb-4 flex items-center justify-between px-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Chats
          </h4>
        </div>
        
        <div className="space-y-1">
          {conversationsData?.conversations.map((conv) => (
            <Link key={conv.id} href={`/chat/${conv.id}`}>
              <Button
                variant={location === `/chat/${conv.id}` ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 h-auto py-2 px-2 text-sm font-normal text-left items-start"
              >
                <MessageSquare className="size-4 shrink-0 mt-0.5" />
                <div className="grid gap-0.5 flex-1 overflow-hidden">
                  <span className="truncate">{conv.title || "Untitled Chat"}</span>
                  {conv.documentName && (
                    <span className="text-[10px] text-muted-foreground truncate opacity-70">
                      {conv.documentName}
                    </span>
                  )}
                </div>
              </Button>
            </Link>
          ))}
          {conversationsData?.conversations.length === 0 && (
            <div className="px-2 py-4 text-xs text-muted-foreground text-center">
              No recent chats
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="size-4 text-muted-foreground" />
            ) : (
              <Moon className="size-4 text-muted-foreground" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut className="size-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="size-9 border border-white/10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 overflow-hidden">
            <span className="text-sm font-medium truncate">
              {user?.user_metadata?.full_name || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <SidebarContent />
      </div>

      {/* Mobile Header & Sidebar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-white/5 bg-background/80 backdrop-blur-md z-40 flex items-center px-4 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="size-6 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary size-3">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <span className="font-bold text-sm">IntelliDocs</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-white/10">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile spacing */}
        <div className="h-14 md:hidden shrink-0" />
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-[20%] -mt-[10%] w-[50%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-[20%] -mb-[10%] w-[50%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <div className="flex-1 overflow-auto w-full z-10">
          {children}
        </div>
      </main>
    </div>
  );
}