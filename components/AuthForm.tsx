"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Compass } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type AuthFormValues = z.infer<typeof authSchema>;

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const supabase = createClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword(values)
          : await supabase.auth.signUp({
              ...values,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            });

      if (result.error) {
        throw result.error;
      }

      router.push("/colleges");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <Compass className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Log in to save your shortlist." : "Sign up to start saving colleges."}
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} />
            {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
          </div>

          {formError ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</p> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "login" ? "New to CampusCompass?" : "Already have an account?"}{" "}
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={mode === "login" ? "/signup" : "/login"}>
            {mode === "login" ? "Create an account" : "Login"}
          </Link>
        </p>
      </div>
    </div>
  );
}
