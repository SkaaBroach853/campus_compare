"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirmEmail() {
      const code = searchParams.get("code");

      if (!code) {
        setError("The confirmation link is missing a login code. Please request a new confirmation email.");
        return;
      }

      const supabase = createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      router.replace("/colleges");
      router.refresh();
    }

    void confirmEmail();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Email confirmation failed</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
          <Button asChild className="mt-6 w-full">
            <Link href="/signup">Try signing up again</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Confirming your email...</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please wait while we securely finish your login.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-12">
          <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
            <h1 className="text-2xl font-semibold">Confirming your email...</h1>
            <p className="mt-3 text-sm text-muted-foreground">Please wait while we securely finish your login.</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
