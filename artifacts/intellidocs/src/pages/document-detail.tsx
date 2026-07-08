import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetDocument, 
  useGenerateAiContent, 
  useCreateConversation,
  getGetDocumentQueryKey,
  AiGenerateInputFeatureType
} from "@workspace/api-client-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  Sparkles,
  BookOpen,
  BrainCircuit,
  HelpCircle,
  ListChecks,
  Quote,
  Zap,
  Calendar,
  Layers,
  GraduationCap,
  CalendarDays,
  Languages,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatBytes as formatBytesUtil } from "@/lib/utils";
import { format } from "date-fns";

const FEATURE_PALETTE = [
  { id: AiGenerateInputFeatureType.summary, icon: FileText, label: "Summary", desc: "Executive overview" },
  { id: AiGenerateInputFeatureType.keyPoints, icon: ListChecks, label: "Key Points", desc: "Bulleted insights" },
  { id: AiGenerateInputFeatureType.studyNotes, icon: BookOpen, label: "Study Notes", desc: "Detailed breakdown" },
  { id: AiGenerateInputFeatureType.flashcards, icon: Zap, label: "Flashcards", desc: "Q&A format" },
  { id: AiGenerateInputFeatureType.quiz, icon: HelpCircle, label: "Quiz", desc: "Test your knowledge" },
  { id: AiGenerateInputFeatureType.definitions, icon: Quote, label: "Definitions", desc: "Glossary of terms" },
  { id: AiGenerateInputFeatureType.importantDates, icon: CalendarDays, label: "Key Dates", desc: "Timeline of events" },
  { id: AiGenerateInputFeatureType.importantConcepts, icon: BrainCircuit, label: "Concepts", desc: "Core ideas explained" },
  { id: AiGenerateInputFeatureType.explainSimply, icon: Sparkles, label: "Explain Simply", desc: "ELI5 version" },
  { id: AiGenerateInputFeatureType.actionItems, icon: ListChecks, label: "Action Items", desc: "Next steps" },
  { id: AiGenerateInputFeatureType.interviewQuestions, icon: GraduationCap, label: "Interview Qs", desc: "Prep questions" },
  { id: AiGenerateInputFeatureType.translate, icon: Languages, label: "Translate", desc: "To English/Spanish" },
];

export default function DocumentDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const [activeContent, setActiveContent] = useState<{title: string, content: string} | null>(null);

  const { data: doc, isLoading: isDocLoading } = useGetDocument(id, {
    query: { queryKey: getGetDocumentQueryKey(id), enabled: !!id }
  });

  const generateMutation = useGenerateAiContent();
  const createConvMutation = useCreateConversation();

  const handleGenerate = async (featureType: keyof typeof AiGenerateInputFeatureType, title: string) => {
    try {
      const res = await generateMutation.mutateAsync({
        data: { documentId: id, featureType }
      });
      setActiveContent({ title, content: res.content });
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartChat = async () => {
    try {
      const res = await createConvMutation.mutateAsync({
        data: { documentId: id, title: `Chat: ${doc?.name || 'Document'}` }
      });
      setLocation(`/chat/${res.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  if (isDocLoading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex flex-col gap-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] md:col-span-1 rounded-xl" />
          <Skeleton className="h-[400px] md:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!doc) return <div className="p-8">Document not found</div>;

  return (
    <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col h-full overflow-hidden">
      <div className="mb-6 shrink-0">
        <Link href="/documents" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4 mr-2" /> Back to Documents
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <FileText className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2 break-words line-clamp-2">{doc.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary" className="uppercase tracking-wider">{doc.fileType.split('/')[1] || 'DOC'}</Badge>
                <span>{formatBytesUtil(doc.fileSize)}</span>
                <span>•</span>
                <span>Added {format(new Date(doc.createdAt), "MMM d, yyyy")}</span>
                <Badge variant={doc.status === 'ready' ? "default" : "secondary"} className="ml-2 bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0">
                  {doc.status}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleStartChat}
            disabled={createConvMutation.isPending || doc.status !== 'ready'}
            className="shrink-0 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
          >
            {createConvMutation.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <MessageSquare className="size-4 mr-2" />}
            Start Chat
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: AI Features Palette */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            AI Actions
          </h3>
          <p className="text-sm text-muted-foreground mb-2">Select an action to generate insights from this document.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
            {FEATURE_PALETTE.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  disabled={generateMutation.isPending || doc.status !== 'ready'}
                  onClick={() => handleGenerate(feature.id as any, feature.label)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-card/30 hover:bg-primary/10 hover:border-primary/30 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="size-8 rounded-lg bg-background flex items-center justify-center shrink-0 group-hover:text-primary transition-colors">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">{feature.label}</div>
                    <div className="text-xs text-muted-foreground">{feature.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Generated Content */}
        <div className="md:col-span-8 lg:col-span-9 glass-panel rounded-2xl overflow-hidden flex flex-col relative border-white/10">
          {generateMutation.isPending ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/30">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full" />
                <Loader2 className="size-10 text-primary animate-spin relative z-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Generating insights...</h3>
              <p className="text-muted-foreground">Our AI is reading and analyzing your document.</p>
            </div>
          ) : activeContent ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-white/5 bg-card/50 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
                <h3 className="font-bold text-lg">{activeContent.title}</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveContent(null)}>Close</Button>
              </div>
              <ScrollArea className="flex-1 p-6 lg:p-10">
                <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeContent.content}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/20">
              <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-white/5">
                <Sparkles className="size-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold mb-2">Select an AI action</h3>
              <p className="text-muted-foreground max-w-sm">
                Choose an action from the left panel to generate summaries, study notes, or extract key points from your document.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}