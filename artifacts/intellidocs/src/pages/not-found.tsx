import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      
      <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
        <FileQuestion className="size-12 text-primary" />
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page not found</h2>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-10 text-lg">
        The page you are looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      
      <Link href="/">
        <Button size="lg" className="rounded-full px-8 h-12">
          <ArrowLeft className="mr-2 size-4" /> Back to Home
        </Button>
      </Link>
    </div>
  );
}