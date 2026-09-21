import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { ensureProfile } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallback,
  head: () => ({
    meta: [
      { title: "সাইন ইন সম্পন্ন হচ্ছে | Smart Pantry" },
      { name: "description", content: "Google সাইন ইন যাচাই করা হচ্ছে, এক মুহূর্ত অপেক্ষা করুন।" },
      { property: "og:title", content: "সাইন ইন সম্পন্ন হচ্ছে | Smart Pantry" },
      {
        property: "og:description",
        content: "Google সাইন ইন যাচাই করা হচ্ছে, এক মুহূর্ত অপেক্ষা করুন।",
      },
    ],
  }),
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const finish = async () => {
      if (done) return;
      const ok = await ensureProfile();
      if (!ok) return;
      done = true;
      toast.success("স্বাগতম!");
      navigate({ to: "/" });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") void finish();
    });

    void finish();

    const timer = window.setTimeout(() => {
      if (!done) {
        toast.error("Google সাইন ইন ব্যর্থ। আবার চেষ্টা করুন।");
        navigate({ to: "/" });
      }
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">সাইন ইন সম্পন্ন হচ্ছে…</p>
    </div>
  );
}
