import React, { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/settings`,
      });

      if (error) throw error;
      setIsSent(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="size-4 mr-2" /> Back to login
        </Link>
        
        <div className="glass-panel p-8 rounded-2xl relative z-10 text-center">
          <div className="size-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="size-6 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight mb-2">Reset Password</h1>
          
          {isSent ? (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                We've sent a password reset link to <br/>
                <span className="font-medium text-foreground">{form.getValues().email}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsSent(false)}
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-8">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" className="bg-background/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 mt-6" disabled={isLoading}>
                    {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    Send Reset Link
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}