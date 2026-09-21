import { createFileRoute } from "@tanstack/react-router";

import { LegalPage, LegalSection } from "@/components/LegalPage";
import { useLang } from "@/lib/i18n";
import { APP_NAME, LEGAL_UPDATED_BN, LEGAL_UPDATED_EN, SUPPORT_EMAIL } from "@/lib/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms of Use — ${APP_NAME}` },
      {
        name: "description",
        content:
          "The rules for using Smart Pantry AI: your account, AI-generated recipes, community sharing, food safety and account termination.",
      },
      { property: "og:title", content: `Terms of Use — ${APP_NAME}` },
      {
        property: "og:description",
        content: "Rules for using Smart Pantry AI, including AI recipe and food-safety disclaimers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { lang } = useLang();
  const bn = lang === "bn";

  return (
    <LegalPage
      title={bn ? "ব্যবহারের শর্তাবলী" : "Terms of Use"}
      updated={bn ? LEGAL_UPDATED_BN : LEGAL_UPDATED_EN}
    >
      <p className="text-muted-foreground">
        {bn
          ? `${APP_NAME} ব্যবহার করলে আপনি নিচের শর্তগুলো মেনে নিচ্ছেন। রাজি না হলে অ্যাপটি ব্যবহার করবেন না।`
          : `By using ${APP_NAME} you agree to these terms. If you do not agree, please do not use the app.`}
      </p>

      <LegalSection heading={bn ? "১. আপনার অ্যাকাউন্ট" : "1. Your account"}>
        <p>
          {bn
            ? "অ্যাকাউন্টের তথ্য সঠিক রাখা এবং পাসওয়ার্ড গোপন রাখা আপনার দায়িত্ব। আপনার অ্যাকাউন্টে হওয়া কাজের জন্য আপনি দায়ী। আপনি যেকোনো সময় প্রোফাইল পেজ থেকে অ্যাকাউন্ট মুছে ফেলতে পারেন।"
            : "You are responsible for keeping your account details accurate and your password private, and for activity on your account. You may delete your account at any time from the Profile page."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "২. AI রেসিপি ও খাদ্য নিরাপত্তা" : "2. AI recipes and food safety"}>
        <p>
          {bn
            ? "রেসিপি, পুষ্টি ও খরচের হিসাব AI দিয়ে তৈরি এবং তা আনুমানিক। এগুলো চিকিৎসা বা পুষ্টি পরামর্শ নয়। উপকরণ টাটকা কিনা, অ্যালার্জি আছে কিনা এবং ঠিকভাবে রান্না হয়েছে কিনা — তা যাচাই করার দায়িত্ব আপনার।"
            : "Recipes, nutrition figures and cost estimates are AI-generated and approximate. They are not medical or dietary advice. You are responsible for checking ingredient freshness, allergens and safe cooking."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "৩. কমিউনিটি ও খাবার শেয়ারিং" : "3. Community and food sharing"}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            {bn
              ? "নিজের তৈরি বা নিজের অধিকারে থাকা কনটেন্টই পোস্ট করুন। বেআইনি, ক্ষতিকর, প্রতারণামূলক বা অন্যের কপিরাইট ভাঙা কনটেন্ট পোস্ট করা নিষিদ্ধ।"
              : "Post only content you created or have the right to share. Illegal, harmful, deceptive or infringing content is not allowed."}
          </li>
          <li>
            {bn
              ? "খাবার দান বা বিনিময় সম্পূর্ণ আপনার নিজের দায়িত্বে হয়। আমরা খাবারের গুণমান বা নিরাপত্তার নিশ্চয়তা দিই না এবং লেনদেনে কোনো পক্ষ নই।"
              : "Donating or exchanging food happens entirely at your own risk. We do not guarantee food quality or safety and are not a party to any exchange."}
          </li>
          <li>
            {bn
              ? "যৌন, ঘৃণামূলক, হিংসাত্মক, হয়রানিমূলক, স্প্যাম বা প্রতারণামূলক কনটেন্ট কঠোরভাবে নিষিদ্ধ।"
              : "Sexual, hateful, violent, harassing, spam or fraudulent content is strictly prohibited."}
          </li>
          <li>
            {bn
              ? "যেকোনো পোস্টের পাশে থাকা “⋯” মেনু থেকে রিপোর্ট করা যায় এবং যেকোনো ব্যবহারকারীকে ব্লক করা যায়। রিপোর্ট করা কনটেন্ট আমরা ২৪ ঘণ্টার মধ্যে পর্যালোচনা করি; ৩ জন রিপোর্ট করলে পোস্টটি স্বয়ংক্রিয়ভাবে লুকিয়ে যায়।"
              : "Every post has a “⋯” menu to report it and to block the person who posted it. Reported content is reviewed within 24 hours, and a post reported by 3 people is hidden automatically."}
          </li>
          <li>
            {bn
              ? "শর্ত ভাঙা কনটেন্ট আমরা সরিয়ে দিতে বা অ্যাকাউন্ট বন্ধ করতে পারি।"
              : "We may remove content or suspend accounts that break these terms."}
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading={bn ? "৪. গোপনীয়তা" : "4. Privacy"}>
        <p>
          {bn
            ? "আপনার তথ্য কীভাবে ব্যবহার হয় তা প্রাইভেসি পলিসিতে বর্ণিত আছে, যা এই শর্তাবলীর অংশ।"
            : "Our Privacy Policy explains how your data is handled and forms part of these terms."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "৫. দায়সীমা" : "5. Limitation of liability"}>
        <p>
          {bn
            ? "অ্যাপটি “যেমন আছে” সেভাবেই দেওয়া হয়। আইনে অনুমোদিত সীমা পর্যন্ত, অ্যাপ ব্যবহারের ফলে হওয়া পরোক্ষ বা আনুষঙ্গিক ক্ষতির জন্য আমরা দায়ী নই।"
            : "The app is provided “as is”. To the extent permitted by law we are not liable for indirect or incidental losses arising from your use of the app."}
        </p>
      </LegalSection>

      <LegalSection heading={bn ? "৬. পরিবর্তন ও যোগাযোগ" : "6. Changes and contact"}>
        <p>
          {bn
            ? "শর্তাবলী হালনাগাদ হলে এই পেজে নতুন তারিখ দেখানো হবে। প্রশ্ন থাকলে: "
            : "If we update these terms, the date on this page changes. Questions: "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
