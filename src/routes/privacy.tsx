import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/LegalPage";
import { useLang } from "@/lib/i18n";
import { APP_NAME, LEGAL_UPDATED_BN, LEGAL_UPDATED_EN, SUPPORT_EMAIL } from "@/lib/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${APP_NAME}` },
      {
        name: "description",
        content:
          "How Smart Pantry AI collects, uses, stores and deletes your data: account email, ingredient photos, approximate location and contact details.",
      },
      { property: "og:title", content: `Privacy Policy — ${APP_NAME}` },
      {
        property: "og:description",
        content: "What data Smart Pantry AI collects, why, and how to delete your account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { lang } = useLang();
  const bn = lang === "bn";

  return (
    <LegalPage
      title={bn ? "প্রাইভেসি পলিসি" : "Privacy Policy"}
      updated={bn ? LEGAL_UPDATED_BN : LEGAL_UPDATED_EN}
    >
      <p className="text-muted-foreground">
        {bn
          ? `${APP_NAME} আপনার রান্নাঘরের উপকরণ থেকে রেসিপি তৈরি করে। এই পলিসিতে আমরা কোন তথ্য নিই, কেন নিই, কোথায় রাখি এবং আপনি কীভাবে তা মুছতে পারেন তা পরিষ্কারভাবে বলা আছে।`
          : `${APP_NAME} turns the ingredients in your kitchen into recipes. This policy explains exactly what we collect, why, where it is stored, and how you can delete it.`}
      </p>

      <LegalSection heading={bn ? "১. আমরা যে তথ্য সংগ্রহ করি" : "1. Data we collect"}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b>{bn ? "অ্যাকাউন্ট ও ইমেইল — " : "Account and email — "}</b>
            {bn
              ? "আপনি ইমেইল/পাসওয়ার্ড বা Google দিয়ে সাইন ইন করলে আমরা আপনার ইমেইল ঠিকানা ও ব্যবহারকারী আইডি সংরক্ষণ করি। সাইন ইন ছাড়াও গেস্ট হিসেবে অ্যাপ ব্যবহার করা যায়।"
              : "When you sign in with email/password or Google we store your email address and a user ID. You can also use the app as a guest without signing in."}
          </li>
          <li>
            <b>{bn ? "ক্যামেরা ও ছবি — " : "Camera and photos — "}</b>
            {bn
              ? "উপকরণ বা রসিদ শনাক্ত করতে আপনি ছবি তুললে সেই ছবিটি শুধু শনাক্তকরণের জন্য আমাদের AI প্রসেসিং সার্ভিসে পাঠানো হয়। ছবি আমাদের সার্ভারে স্থায়ীভাবে রাখা হয় না; শুধু শনাক্ত হওয়া উপকরণের নামগুলো আপনার প্যান্ট্রিতে থাকে।"
              : "If you take a photo of ingredients or a receipt, the image is sent to our AI processing service only to identify items. Photos are not stored permanently on our servers — only the recognised ingredient names are saved to your pantry."}
          </li>
          <li>
            <b>{bn ? "লোকেশন — " : "Location — "}</b>
            {bn
              ? "কাছের বাজার বা খাবার ভাগাভাগির জায়গা দেখাতে আপনি অনুমতি দিলে আমরা আপনার আনুমানিক অবস্থান ব্যবহার করি। এটি শুধু অনুরোধের সময় ব্যবহৃত হয় এবং আপনার লোকেশন ইতিহাস আমরা রাখি না।"
              : "To show nearby markets or food-sharing spots we use your approximate location, only after you grant permission. It is used for that request and we do not keep a location history."}
          </li>
          <li>
            <b>{bn ? "কনট্যাক্ট নম্বর — " : "Contact number — "}</b>
            {bn
              ? "খাবার দান বা অনুরোধ পোস্ট করলে আপনি নিজে যে ফোন নম্বর বা যোগাযোগের তথ্য লেখেন তা সেই পোস্টের সাথে সংরক্ষিত হয় এবং যাদের সাথে আপনি শেয়ার করছেন তারা দেখতে পারেন। এটি সম্পূর্ণ ঐচ্ছিক।"
              : "If you post a food donation or request, any phone number or contact detail you type is stored with that post and visible to the people you are sharing with. This is entirely optional."}
          </li>
          <li>
            <b>{bn ? "অ্যাপ ব্যবহারের তথ্য — " : "App content — "}</b>
            {bn
              ? "আপনার প্যান্ট্রির উপকরণ, সেভ করা রেসিপি, খরচের হিসাব, রেসিপি চ্যাট, রেটিং ও পছন্দের সেটিংস আপনার অ্যাকাউন্টের সাথে সংরক্ষিত হয়।"
              : "Your pantry items, saved recipes, purchase/cost entries, recipe chats, ratings and preference settings are stored against your account."}
          </li>
          <li>
            <b>{bn ? "ভয়েস ইনপুট — " : "Voice input — "}</b>
            {bn
              ? "ভয়েস দিয়ে উপকরণ যোগ করলে আপনার ডিভাইসের স্পিচ রিকগনিশন ব্যবহার করে কথাকে লেখায় রূপ দেওয়া হয়; আমরা অডিও রেকর্ডিং সংরক্ষণ করি না।"
              : "Voice entry uses your device's speech recognition to convert speech to text; we do not store audio recordings."}
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading={bn ? "২. কেন ব্যবহার করি" : "2. Why we use it"}>
        <p>
          {bn
            ? "রেসিপি তৈরি ও ব্যক্তিগতকরণ, প্যান্ট্রি ও মেয়াদ ট্র্যাকিং, কাছের বাজার দেখানো, কমিউনিটি শেয়ারিং চালানো, নোটিফিকেশন পাঠানো এবং অ্যাপের ত্রুটি ঠিক করা — শুধু এই কাজে। আমরা আপনার তথ্য বিজ্ঞাপনের জন্য বিক্রি করি না।"
            : "Only to generate and personalise recipes, track your pantry and expiry dates, show nearby markets, run community sharing, send notifications you enabled, and fix app errors. We do not sell your data or use it for advertising."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "৩. কাদের সাথে শেয়ার হয়" : "3. Who we share it with"}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            {bn
              ? "AI মডেল সরবরাহকারী — রেসিপি তৈরি ও ছবি থেকে উপকরণ শনাক্ত করার জন্য প্রয়োজনীয় টেক্সট বা ছবি পাঠানো হয়।"
              : "AI model providers — we send the text or image needed to generate a recipe or recognise ingredients."}
          </li>
          <li>
            {bn
              ? "ক্লাউড হোস্টিং ও ডেটাবেস সরবরাহকারী — আপনার অ্যাকাউন্ট ডেটা নিরাপদে সংরক্ষণের জন্য।"
              : "Cloud hosting and database providers — to store your account data securely."}
          </li>
          <li>
            {bn
              ? "আইনগত বাধ্যবাধকতা থাকলে প্রয়োজনীয় তথ্য প্রকাশ করা হতে পারে।"
              : "Authorities, where we are legally required to disclose information."}
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading={bn ? "৪. অনুমতিসমূহ" : "4. Permissions"}>
        <p>
          {bn
            ? "ক্যামেরা, লোকেশন, মাইক্রোফোন ও নোটিফিকেশন — প্রত্যেকটি শুধু সংশ্লিষ্ট ফিচার ব্যবহারের সময় চাওয়া হয়। আপনি চাইলে ডিভাইসের সেটিংস থেকে যেকোনো অনুমতি বাতিল করতে পারেন; তখন শুধু সেই ফিচারটি বন্ধ হবে, বাকি অ্যাপ চলবে।"
            : "Camera, location, microphone and notifications are each requested only when you use the related feature. You can revoke any permission in your device settings; only that feature stops working, the rest of the app keeps running."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "৫. কতদিন রাখা হয়" : "5. How long we keep it"}>
        <p>
          {bn
            ? "আপনার অ্যাকাউন্ট সক্রিয় থাকা পর্যন্ত আপনার ডেটা রাখা হয়। অ্যাকাউন্ট মুছে ফেললে আপনার প্রোফাইল, প্যান্ট্রি, সেভ করা রেসিপি, চ্যাট, রেটিং, খরচের হিসাব, কমিউনিটি পোস্ট ও নোটিফিকেশন স্থায়ীভাবে মুছে যায়।"
            : "We keep your data while your account is active. Deleting your account permanently removes your profile, pantry, saved recipes, chats, ratings, purchase records, community posts and notifications."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "৬. অ্যাকাউন্ট ও ডেটা মুছে ফেলা" : "6. Deleting your account and data"}>
        <p>
          {bn
            ? "অ্যাপের ভেতরে প্রোফাইল পেজে গিয়ে “অ্যাকাউন্ট মুছে ফেলুন” বাটনে চাপ দিলেই আপনার অ্যাকাউন্ট ও সব ডেটা সাথে সাথে স্থায়ীভাবে মুছে যায় — এটি ফেরানো যায় না। চাইলে "
            : "In the app, open the Profile page and tap “Delete account” — your account and all its data are permanently deleted immediately, and this cannot be undone. You can also email "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          {bn
            ? " ঠিকানায় ইমেইল করেও মুছে ফেলার অনুরোধ করতে পারেন; আমরা ৩০ দিনের মধ্যে কাজটি সম্পন্ন করি।"
            : " to request deletion; we complete such requests within 30 days."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "৭. শিশুদের তথ্য" : "7. Children"}>
        <p>
          {bn
            ? "অ্যাপটি ১৩ বছরের কম বয়সী শিশুদের জন্য নয় এবং আমরা জেনেশুনে তাদের তথ্য সংগ্রহ করি না।"
            : "The app is not directed at children under 13 and we do not knowingly collect their data."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "৮. যোগাযোগ" : "8. Contact"}>
        <p>
          {bn ? "প্রাইভেসি বিষয়ে যেকোনো প্রশ্নে: " : "For any privacy question: "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
