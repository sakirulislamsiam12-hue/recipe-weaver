import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/LegalPage";
import { useLang } from "@/lib/i18n";
import { APP_NAME, LEGAL_UPDATED_BN, LEGAL_UPDATED_EN, SUPPORT_EMAIL } from "@/lib/legal";

/**
 * Publicly reachable account + data deletion page.
 * Google Play requires this URL to be viewable without installing the app
 * or signing in (Data deletion URL in the Play Console Data safety form).
 */
export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: `Delete your account — ${APP_NAME}` },
      {
        name: "description",
        content:
          "How to permanently delete your Smart Pantry AI account and all associated data, in the app or by email request.",
      },
      { property: "og:title", content: `Delete your account — ${APP_NAME}` },
      {
        property: "og:description",
        content: "Permanently delete your Smart Pantry AI account and all associated data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeleteAccountInfoPage,
});

function DeleteAccountInfoPage() {
  const { lang } = useLang();
  const bn = lang === "bn";

  return (
    <LegalPage
      title={bn ? "অ্যাকাউন্ট ও ডেটা মুছে ফেলা" : "Delete your account and data"}
      updated={bn ? LEGAL_UPDATED_BN : LEGAL_UPDATED_EN}
    >
      <p className="text-muted-foreground">
        {bn
          ? `${APP_NAME}-এ আপনার অ্যাকাউন্ট ও সব ডেটা যেকোনো সময় স্থায়ীভাবে মুছে ফেলা যায়। দুইভাবে করা যায় —`
          : `You can permanently delete your ${APP_NAME} account and all its data at any time, in two ways.`}
      </p>

      <LegalSection heading={bn ? "১. অ্যাপের ভেতর থেকে" : "1. From inside the app"}>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>{bn ? "অ্যাপে সাইন ইন করুন।" : "Sign in to the app."}</li>
          <li>{bn ? "নিচের মেনু থেকে প্রোফাইল পেজে যান।" : "Open the Profile page from the bottom menu."}</li>
          <li>
            {bn
              ? "“অ্যাকাউন্ট মুছে ফেলুন” বাটনে চাপ দিন এবং নিশ্চিত করুন।"
              : "Tap “Delete account” and confirm."}
          </li>
        </ol>
      </LegalSection>

      <LegalSection heading={bn ? "২. ইমেইলে অনুরোধ করে" : "2. By email request"}>
        <p>
          {bn ? "আপনার অ্যাকাউন্টের ইমেইল থেকে " : "Email us from your account address at "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`}>
            {SUPPORT_EMAIL}
          </a>
          {bn
            ? " ঠিকানায় “Account deletion request” লিখে মেইল করুন। আমরা ৩০ দিনের মধ্যে অ্যাকাউন্ট ও ডেটা মুছে ফেলি।"
            : " with the subject “Account deletion request”. We complete such requests within 30 days."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "যা যা মুছে যায়" : "What gets deleted"}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>{bn ? "আপনার লগইন অ্যাকাউন্ট ও ইমেইল ঠিকানা" : "Your login account and email address"}</li>
          <li>{bn ? "প্রোফাইল ও পছন্দের সেটিংস" : "Profile and preference settings"}</li>
          <li>{bn ? "প্যান্ট্রির উপকরণ ও খরচের হিসাব" : "Pantry items and purchase/cost records"}</li>
          <li>{bn ? "সেভ করা ও পোস্ট করা রেসিপি, রেসিপি চ্যাট, রেটিং" : "Saved and posted recipes, recipe chats, ratings"}</li>
          <li>{bn ? "কমিউনিটি দান, অনুরোধ ও গ্রুপ পোস্ট" : "Community donations, requests and group posts"}</li>
          <li>{bn ? "নোটিফিকেশন" : "Notifications"}</li>
        </ul>
        <p>
          {bn
            ? "কিছুই আলাদা করে রাখা হয় না এবং মুছে ফেলার পর তা ফেরানো যায় না। আইনগত বাধ্যবাধকতা থাকলে শুধু সীমিত লেনদেন বা অপব্যবহার-সংক্রান্ত রেকর্ড সর্বোচ্চ ৯০ দিন ব্যাকআপে থাকতে পারে, তারপর তাও মুছে যায়।"
            : "Nothing is retained separately and deletion cannot be undone. Where the law requires it, limited transaction or abuse records may remain in backups for up to 90 days, after which they are erased too."}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
