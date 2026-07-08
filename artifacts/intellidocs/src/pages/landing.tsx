import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Brain, Zap, Shield, Search, FileText, CheckCircle2 } from "lucide-react";
import heroImage from "@assets/generated_images/hero-abstract.png";
import feature1Image from "@assets/generated_images/feature-1.png";
import feature2Image from "@assets/generated_images/feature-2.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div className="container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            IntelliDocs AI is now in early access
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Chat with your documents.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Extract knowledge instantly.
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            The premium knowledge workspace for professionals. Upload PDFs, Word docs, and text files. Ask questions, get summaries, and accelerate your deep work with intelligent AI.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all">
                Get Started for Free <ArrowRight className="ml-2 size-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/10 bg-white/5 hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Image / Mockup area */}
        <div className="container mx-auto mt-20 relative animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <div className="rounded-2xl border border-white/10 bg-card/50 p-2 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-50"></div>
            <div className="rounded-xl overflow-hidden aspect-video relative bg-background flex items-center justify-center border border-white/5">
              <img src={heroImage} alt="IntelliDocs Interface Abstract" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Deep work, uninterrupted.</h2>
            <p className="text-lg text-muted-foreground">Built for researchers, analysts, and students who need to extract insights from dense materials without losing focus.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Brain className="size-10 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-3">Intelligent Extraction</h3>
              <p className="text-muted-foreground">Instantly generate summaries, study notes, and flashcards. Our AI understands context, not just keywords.</p>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="size-10 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">Ask questions and get answers in milliseconds. Powered by Gemini AI for unparalleled speed and accuracy.</p>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Shield className="size-10 text-primary mb-6" />
              <h3 className="text-xl font-semibold mb-3">Private & Secure</h3>
              <p className="text-muted-foreground">Your documents remain yours. We process them securely and never use them to train public models.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight 1 */}
      <section className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute -inset-4 bg-primary/20 blur-[50px] rounded-full" />
              <img src={feature1Image} alt="Document Scanning" className="relative rounded-2xl border border-white/10 shadow-2xl" />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-6">
                <Search className="size-4 text-primary" /> Multi-format Support
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Any document, instantly readable.</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Upload PDFs, Word documents, or plain text files. Our ingestion engine parses dense formatting, tables, and complex layouts so the AI can understand exactly what you're looking at.
              </p>
              <ul className="space-y-4">
                {["Support for complex PDFs", "Automatic OCR for scanned docs", "Preserves document structure"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight 2 */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-6">
                <FileText className="size-4 text-primary" /> Generative Palettes
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Stop reading, start learning.</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Don't just chat. Use our one-click feature palettes to transform static documents into dynamic learning materials.
              </p>
              <ul className="space-y-4">
                {["Generate comprehensive summaries", "Extract key points and dates", "Create quiz questions and flashcards"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-[50px] rounded-full" />
              <img src={feature2Image} alt="AI Chat" className="relative rounded-2xl border border-white/10 shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to upgrade your mind?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join thousands of professionals using IntelliDocs AI to work smarter and faster.</p>
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-[0_0_20px_rgba(var(--primary),0.4)]">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}