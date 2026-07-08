import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useGetDashboardStats, 
  useGetRecentActivity,
  getGetDashboardStatsQueryKey,
  getGetRecentActivityQueryKey,
  ActivityItemType
} from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { 
  FileText, 
  MessageSquare, 
  Database, 
  Upload, 
  Plus, 
  Activity,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatBytes as formatBytesUtil } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "User";

  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats({
    query: {
      queryKey: getGetDashboardStatsQueryKey()
    }
  });

  const { data: activityData, isLoading: isActivityLoading } = useGetRecentActivity({
    query: {
      queryKey: getGetRecentActivityQueryKey()
    }
  });

  const getActivityIcon = (type: ActivityItemType) => {
    switch (type) {
      case "document_uploaded": return <FileText className="size-4 text-blue-400" />;
      case "conversation_started": return <MessageSquare className="size-4 text-primary" />;
      case "ai_generated": return <Activity className="size-4 text-purple-400" />;
      default: return <MessageSquare className="size-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Good morning, {firstName}</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening in your workspace today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/documents">
            <Button variant="outline" className="gap-2 bg-background">
              <Upload className="size-4" /> Upload Document
            </Button>
          </Link>
          <Link href="/documents">
            <Button className="gap-2">
              <Plus className="size-4" /> New Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isStatsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur border-white/5 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="bg-card/50 backdrop-blur border-white/5 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
                <FileText className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-white/5 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
                <MessageSquare className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-white/5 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">AI Messages</CardTitle>
                <Activity className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-white/5 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
                <Database className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytesUtil(stats?.storageUsedBytes || 0)}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Documents */}
        <Card className="bg-card/50 backdrop-blur border-white/5 shadow-sm col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Your most recently uploaded files</CardDescription>
            </div>
            <Link href="/documents">
              <Button variant="ghost" size="sm" className="text-xs">View all <ArrowRight className="ml-1 size-3" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isStatsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : stats?.recentDocuments?.length ? (
                stats.recentDocuments.map((doc) => (
                  <Link key={doc.id} href={`/documents/${doc.id}`}>
                    <div className="flex items-center gap-4 group p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <FileText className="size-5 text-primary" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No documents yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-card/50 backdrop-blur border-white/5 shadow-sm col-span-1">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>What happened recently</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-6">
                {isActivityLoading ? (
                   Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="space-y-2 flex-1 pt-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))
                ) : activityData?.items?.length ? (
                  activityData.items.map((item, i) => (
                    <div key={item.id} className="flex gap-4 relative">
                      {i !== activityData.items.length - 1 && (
                        <div className="absolute top-8 bottom-[-24px] left-4 w-px bg-border" />
                      )}
                      <div className="size-8 rounded-full bg-background border flex items-center justify-center shrink-0 z-10">
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="flex-1 pt-1.5 pb-2">
                        <p className="text-sm">
                          {item.description}
                          {item.resourceName && (
                            <span className="font-medium text-foreground ml-1">
                              {item.resourceName}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No recent activity.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}