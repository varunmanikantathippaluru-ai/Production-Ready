import { Link } from "wouter";
import { MailCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        <div className="glass-panel p-10 rounded-2xl relative z-10 text-center">
          <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <MailCheck className="size-8 text-primary relative z-10" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-4">Check your email</h1>
          
          <p className="text-muted-foreground mb-8 text-lg">
            We've sent a verification link to your email address. Please click the link to activate your account.
          </p>
          
          <Link href="/login">
            <Button className="w-full h-12 group">
              Continue to Login <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}