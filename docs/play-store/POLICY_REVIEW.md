# Google Play policy review — Smart Pantry AI

Checked against the Developer Program Policies most relevant to this app.
Status key: **OK** = handled in the app, **ACTION** = you must do it in Play Console
or before release.

## 1. User Data / Privacy policy — OK

- Privacy policy page at `/privacy`, reachable without signing in, in English and Bengali.
- Covers: email, user ID, camera photos, location, contact number, app content, voice.
- Links to it from inside the app (LegalLinks).
- **ACTION:** paste the live `/privacy` URL into Play Console → App content → Privacy policy.

## 2. Account deletion (mandatory since 2023) — OK

- In-app: Profile → Delete account (deletes auth account + all 13 data tables).
- Public web page: `/delete-account`, no sign-in required.
- **ACTION:** enter the `/delete-account` URL as the "Data deletion" URL in the Data safety form.

## 3. Data safety declaration — ACTION

- Answers prepared in `DATA_SAFETY.md`. Fill the form exactly as written there.
- The single biggest rejection cause is a mismatch between the form and `/privacy` —
  update both together whenever data handling changes.

## 4. User Generated Content policy — OK

Community recipes and food donation/request posts are UGC, so Play requires:

- **Report:** "⋯" menu on every community post → 7 reasons, stored in `content_reports`.
- **Block:** "Block this user" in the same menu; blocked authors disappear from the feed.
- **Moderation:** posts start as `pending` and only approved posts appear; 3 reports auto-hide a post.
- **Terms:** prohibited content listed in `/terms`, with the review commitment (24h).
- **ACTION:** actually review the `content_reports` table — an unread queue is a policy failure.

## 5. Generative AI apps policy — OK

- Recipes are AI-generated; every recipe shows an AI disclosure plus
  "Report a problem" which files an in-app report.
- **ACTION:** in Play Console → App content → answer "Yes" to the AI-generated content
  question and describe the in-app reporting mechanism.

## 6. Permissions & APIs that Access Sensitive Information — OK

- Manifest declares only camera, photos, location, notifications, microphone (see `ANDROID_BUILD.md`).
- No background location, no `QUERY_ALL_PACKAGES`, no contacts/SMS, no all-files access.
- Permissions are requested in context, and the app keeps working when denied.
- **ACTION:** if you ever add background location, a Play declaration form + demo video is required.

## 7. Health / food safety claims — OK, keep it that way

- The app gives cooking and nutrition estimates, not medical advice. `/terms` says so.
- Do not add claims about curing, treating or preventing any disease, or about weight-loss
  results — that moves the app into Health content review.

## 8. Families / children — OK

- Target audience must be set to **13+** in Play Console; `/privacy` says the app is not for under-13s.
- **ACTION:** do not opt into the Designed for Families programme.

## 9. Account creation — OK

- The app is usable as a guest; sign-in is only needed for sync and community.
  (Play requires apps not to force account creation for functionality that doesn't need it.)

## 10. Payments — ACTION if premium launches

- If a premium tier is sold in-app, it must use Google Play Billing; external payment links
  for digital goods are a hard rejection. Physical goods/donations are exempt.
- No fundraising or donation collection is implemented today — food sharing is peer-to-peer,
  with no money handled by the app. Keep it that way, or the Donations policy applies.

## 11. Ads, deceptive behaviour, spam — OK

- No ads SDK, no analytics SDK, no tracking for advertising.
- Store listing must describe the app accurately; no keyword stuffing, no fake reviews.

## 12. Broken functionality / minimum quality — ACTION

- Test the release `.aab` on a real device: sign-in, camera scan, location search,
  notifications, delete account, report and block.
- Ensure the app handles no-network gracefully (offline page is included in the native shell).

## Pre-submission checklist

1. `capacitor.config.ts` → `server.url` set to the production domain.
2. Privacy policy URL + Data deletion URL entered in Play Console.
3. Data safety form completed from `DATA_SAFETY.md`.
4. AI-generated content question answered.
5. Target audience 13+.
6. Store listing, screenshots and feature graphic ready.
7. A monitored inbox for the support email in `src/lib/legal.ts` — currently the placeholder
   `support@smartpantryai.app`; replace it with the company address before submitting.
