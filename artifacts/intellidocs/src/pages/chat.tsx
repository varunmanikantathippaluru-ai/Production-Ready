import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { 
  useGetConversation, 
  useSendMessage,
  getGetConversationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  Bot, 
  User,
  MoreHorizontal,
  Copy,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function Chat({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: conv, isLoading } = useGetConversation(conversationId, {
    query: { queryKey: getGetConversationQueryKey(conversationId), enabled: !!conversationId }
  });

  const sendMessageMutation = useSendMessage();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conv?.messages, sendMessageMutation.isPending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessageMutation.isPending) return;

    const messageContent = input.trim();
    // Clear input optimistically so the field feels responsive
    setInput("");

    // Add user message to cache immediately for a snappy UI
    queryClient.setQueryData(getGetConversationQueryKey(conversationId), (old: unknown) => {
      if (!old || typeof old !== 'object') return old;
      const prev = old as { messages: unknown[] };
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `temp-${Date.now()}`,
            role: "user",
            content: messageContent,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    try {
      await sendMessageMutation.mutateAsync({
        id: conversationId,
        data: { content: messageContent },
      });
      // Refresh to get the real assistant reply from the server
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
    } catch (error: unknown) {
      // Restore the input so the user doesn't lose their message
      setInput(messageContent);
      // Roll back the optimistic update
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(conversationId) });
      toast.error((error as Error).message || "Failed to send message. Please try again.");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="h-16 border-b border-white/5 px-6 flex items-center bg-card/50 backdrop-blur shrink-0">
          <Skeleton className="h-6 w-1/3" />
        </header>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-20 w-3/4 ml-auto rounded-2xl rounded-tr-sm" />
          <Skeleton className="h-40 w-3/4 rounded-2xl rounded-tl-sm" />
        </div>
      </div>
    );
  }

  if (!conv) return <div className="p-8">Conversation not found</div>;

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <header className="h-16 border-b border-white/5 px-4 md:px-6 flex items-center justify-between bg-card/50 backdrop-blur shrink-0 z-10">
        <div className="flex items-center gap-4 overflow-hidden">
          <Link href={`/documents/${conv.documentId}`}>
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="size-5" />
            </Button>
          </Link>
          <div className="overflow-hidden">
            <h2 className="font-semibold truncate">{conv.title || "Chat"}</h2>
            {conv.documentName && (
              <div className="flex items-center text-xs text-muted-foreground truncate">
                <FileText className="size-3 mr-1 inline" /> {conv.documentName}
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="size-5" />
        </Button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 scroll-smooth" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          {conv.messages.length === 0 ? (
            <div className="h-[40vh] flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Bot className="size-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Hello!</h3>
              <p className="text-muted-foreground max-w-md">
                I've analyzed {conv.documentName}. You can ask me questions about it, request summaries, or have me extract specific data.
              </p>
            </div>
          ) : (
            conv.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="size-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="size-4 text-primary" />
                  </div>
                )}
                
                <div className={`group relative max-w-[85%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'glass-panel border-white/10 rounded-tl-sm'
                }`}>
                  <div className={`prose max-w-none ${msg.role === 'user' ? 'text-white prose-invert' : 'prose-invert'} prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  
                  {msg.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                    >
                      {copiedId === msg.id ? <CheckCheck className="size-4 text-green-500" /> : <Copy className="size-4 text-muted-foreground" />}
                    </Button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="size-8 rounded-full bg-secondary border flex items-center justify-center shrink-0 mt-1 hidden md:flex">
                    <User className="size-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {sendMessageMutation.isPending && (
            <div className="flex gap-4 justify-start">
              <div className="size-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                <Bot className="size-4 text-primary" />
              </div>
              <div className="glass-panel border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5 h-[52px]">
                <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="size-2 bg-primary rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSend}
            className="relative flex items-center glass-panel rounded-full overflow-hidden border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(var(--primary),0.2)] transition-all bg-card/80"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this document..." 
              className="border-0 bg-transparent h-14 pl-6 pr-14 text-base focus-visible:ring-0 placeholder:text-muted-foreground/70"
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || sendMessageMutation.isPending}
              className="absolute right-2 rounded-full size-10 bg-primary hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
            >
              <Send className="size-4 -ml-0.5" />
            </Button>
          </form>
          <div className="text-center mt-2 text-xs text-muted-foreground/60 font-medium">
            AI can make mistakes. Verify important information against the source document.
          </div>
        </div>
      </div>
    </div>
  );
}