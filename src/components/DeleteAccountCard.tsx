import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NeuCard } from "@/components/neu";
import { deleteMyAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

/**
 * In-app account + data deletion, required by Google Play policy for any
 * app that lets people create an account.
 */
export function DeleteAccountCard() {
  const { lang } = useLang();
  const bn = lang === "bn";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const runDelete = useServerFn(deleteMyAccount);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await runDelete();
      await supabase.auth.signOut();
      try {
        localStorage.clear();
      } catch {
        // storage may be unavailable; account is already deleted
      }
      toast.success(bn ? "আপনার অ্যাকাউন্ট মুছে ফেলা হয়েছে" : "Your account has been deleted");
      window.location.assign("/");
    } catch (error) {
      console.error(error);
      setBusy(false);
      setOpen(false);
      toast.error(
        bn
          ? "মুছে ফেলা যায়নি। আবার চেষ্টা করুন।"
          : "We couldn't delete your account. Please try again.",
      );
    }
  };

  return (
    <>
      <NeuCard className="space-y-2 border-destructive/30 p-4">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-bold text-destructive">
            {bn ? "অ্যাকাউন্ট মুছে ফেলুন" : "Delete account"}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {bn
            ? "আপনার প্রোফাইল, প্যান্ট্রি, সেভ করা রেসিপি, চ্যাট, খরচের হিসাব ও কমিউনিটি পোস্ট স্থায়ীভাবে মুছে যাবে। এটি ফেরানো যায় না।"
            : "Permanently removes your profile, pantry, saved recipes, chats, purchase history and community posts. This cannot be undone."}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground active:opacity-80"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {bn ? "অ্যাকাউন্ট ও ডেটা মুছে ফেলুন" : "Delete account and data"}
        </button>
      </NeuCard>

      <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bn ? "অ্যাকাউন্ট মুছে ফেলবেন?" : "Delete your account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bn
                ? "আপনার সব ডেটা স্থায়ীভাবে মুছে যাবে এবং ফেরানো যাবে না।"
                : "All of your data will be permanently deleted and cannot be recovered."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{bn ? "বাতিল" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {busy
                ? bn
                  ? "মুছে ফেলা হচ্ছে…"
                  : "Deleting…"
                : bn
                  ? "হ্যাঁ, মুছে ফেলুন"
                  : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
