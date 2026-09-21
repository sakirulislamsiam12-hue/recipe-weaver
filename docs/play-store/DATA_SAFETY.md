# Play Console — Data safety form answers (Smart Pantry AI)

Copy these answers into **Play Console → App content → Data safety**. They must
match `/privacy` exactly; a mismatch is the most common cause of a Data safety /
Deceptive behaviour rejection.

## Section 1 — Overview

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS/TLS everywhere) |
| Do you provide a way for users to request that their data be deleted? | **Yes** — in-app Profile → Delete account, plus the public URL below |

**Data deletion URL:** `https://<your-domain>/delete-account`
**Privacy policy URL:** `https://<your-domain>/privacy`

## Section 2 — Data types to declare

For every row: *Collected = Yes, Shared = only where stated, Processed ephemerally
where stated, Required or Optional as stated, Purpose as stated.*

### Personal info

| Data type | Collected | Shared | Optional? | Purposes |
| --- | --- | --- | --- | --- |
| Email address | Yes | No | Required for an account (app is usable as guest) | Account management |
| User IDs | Yes | No | Required for an account | Account management, App functionality |
| Phone number | Yes | **Yes** — visible to other users of the community post | Optional | App functionality (community food sharing) |
| Name | Yes (display name, if the user sets one) | Yes — shown on community posts | Optional | App functionality |

> Phone number and display name are shared **with other app users** through the
> community donations/requests feature. In the form, mark this as user-generated
> content published by the user, not a transfer to a third-party company.

### Location

| Data type | Collected | Shared | Optional? | Purposes |
| --- | --- | --- | --- | --- |
| Approximate location | Yes | No | Optional | App functionality (nearby markets and food sharing) |
| Precise location | Yes (only if the user grants precise) | No | Optional | App functionality |

Mark **"Data is processed ephemerally"** — location is used for the request only,
no location history is stored.

### Photos and videos

| Data type | Collected | Shared | Optional? | Purposes |
| --- | --- | --- | --- | --- |
| Photos | Yes | **Yes** — sent to the AI provider for recognition | Optional | App functionality |

Mark **"Data is processed ephemerally"** — the image is sent for ingredient/receipt
recognition and is not stored on our servers; only the recognised item names are kept.

### Audio

Do **not** declare audio. Voice entry uses the device's own speech recognition;
no recording is uploaded or stored. (`RECORD_AUDIO` in the manifest is only for
the on-device recogniser.)

### App activity / App info and performance

| Data type | Collected | Shared | Optional? | Purposes |
| --- | --- | --- | --- | --- |
| Other user-generated content (pantry items, saved & posted recipes, recipe chats, ratings, community posts) | Yes | Yes for community posts only | Optional | App functionality, Personalisation |
| Other app performance data (crash/error logs) | Yes | No | Required | App functionality, Diagnostics |

### Financial info

Declare **"Purchase history"** only if in-app purchases / premium are live at
launch. Cost entries the user types into the pantry are **not** financial info in
Play's sense — declare them under *Other user-generated content*.

## Section 3 — Security practices

- Data is encrypted in transit: **Yes**
- Users can request data deletion: **Yes**
- Committed to the Play Families Policy: **No** (app is not targeted at children)
- Independent security review: **No**

## Section 4 — Things to keep true

1. Never sell user data or use it for third-party advertising — the privacy policy states this.
2. If analytics or ads SDKs are added later, update this form **and** `/privacy` in the same release.
3. If photos ever start being stored, remove "processed ephemerally" from the Photos row.
