import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  useGetProfile, 
  useUpdateProfile,
  getGetProfileQueryKey
} from "@workspace/api-client-react";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  ShieldAlert,
  Loader2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  preferredLanguage: z.string(),
  emailNotifications: z.boolean(),
});

export default function Settings() {
  const { theme, setTheme } = useTheme();
  
  const { data: profile, isLoading } = useGetProfile({
    query: { queryKey: getGetProfileQueryKey() }
  });

  const updateProfileMutation = useUpdateProfile();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      preferredLanguage: "en",
      emailNotifications: true,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName || "",
        preferredLanguage: profile.preferredLanguage || "en",
        emailNotifications: profile.emailNotifications,
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    try {
      await updateProfileMutation.mutateAsync({
        data: {
          fullName: values.fullName,
          preferredLanguage: values.preferredLanguage,
          emailNotifications: values.emailNotifications,
        }
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Section */}
        <Card className="bg-card/40 backdrop-blur border-white/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-primary" /> Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-8">
              <Avatar className="size-20 border-2 border-primary/20">
                <AvatarImage src={profile?.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{profile?.email}</h3>
                <p className="text-sm text-muted-foreground">Member since {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background/50 max-w-md" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredLanguage"
                  render={({ field }) => (
                    <FormItem className="max-w-md">
                      <FormLabel>Preferred Output Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50">
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>The default language for AI summaries and chat.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="bg-card/40 backdrop-blur border-white/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="size-5 text-primary" /> Preferences
            </CardTitle>
            <CardDescription>Customize your app experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Appearance</FormLabel>
                <FormDescription>Toggle between light and dark mode</FormDescription>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="size-4 text-muted-foreground" />
                <Switch 
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <Moon className="size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Email Notifications</FormLabel>
                <FormDescription>Receive updates about new features</FormDescription>
              </div>
              <Switch 
                checked={form.watch('emailNotifications')}
                onCheckedChange={(checked) => {
                  form.setValue('emailNotifications', checked);
                  form.handleSubmit(onSubmit)();
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 bg-destructive/5 backdrop-blur shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" /> Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated documents.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}