import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CORE_TRANSLATIONS } from "./i18n-core-translations";
import { EXTENDED_A } from "./i18n-extended-a";
import { EXTENDED_B } from "./i18n-extended-b";
import { GENERATED_TRANSLATIONS } from "./i18n-generated";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  detectDeviceLanguage,
  isLanguageCode,
  type LanguageCode,
} from "./i18n-50-languages";

export type Lang = LanguageCode;

/**
 * Legacy bilingual type. Plenty of data modules (recipes, cost tables, expiry
 * copy) only carry Bengali and English content; they take a `BiLang` and every
 * other language degrades to English until that data is localised.
 */
export type BiLang = "bn" | "en";

export const toBiLang = (l: LanguageCode): BiLang => (l === "bn" ? "bn" : "en");

/** Canonical key; the legacy key is migrated on first read. */
const STORAGE_KEY = "language";
const LEGACY_STORAGE_KEY = "sp-lang";


const dict = {
  appName: { bn: "স্মার্ট প্যান্ট্রি এআই", en: "Smart Pantry AI" },
  tagline: {
    bn: "ঘরে যা আছে, তা দিয়েই দুর্দান্ত রান্না",
    en: "Great cooking from whatever you already have",
  },
  language: { bn: "Language", en: "Language" },
  next: { bn: "পরবর্তী", en: "Next" },
  skip: { bn: "স্কিপ করুন", en: "Skip" },
  skipAll: { bn: "সব প্রশ্ন স্কিপ করুন", en: "Skip all questions" },
  notNow: { bn: "এখন নয়", en: "Not now" },
  notNowHint: {
    bn: "পরে Settings-এ গিয়ে পছন্দ আপডেট করতে পারবেন",
    en: "You can update your preferences later in Settings",
  },
  prefsSaved: { bn: "আপনার পছন্দ সেভ হয়েছে", en: "Your preferences are saved" },
  prefsSavedHint: {
    bn: "এখন থেকে রেসিপিগুলো আপনার স্বাদ অনুযায়ী তৈরি হবে",
    en: "Recipes will now be tailored to your taste",
  },
  continueApp: { bn: "শুরু করুন", en: "Continue" },
  prev: { bn: "পূর্ববর্তী", en: "Back" },
  stepOf: { bn: "ধাপ", en: "Step" },
  ofWord: { bn: "এর", en: "of" },
  people: { bn: "জন", en: "people" },
  done: { bn: "শেষ করুন", en: "Finish" },
  onboardingIntro: {
    bn: "আপনার পছন্দ জানলে রেসিপি আরও নিখুঁত হবে",
    en: "Tell us your taste for sharper recipes",
  },
  q_country: { bn: "আপনি কোন দেশ থেকে?", en: "Which country are you from?" },
  q_spice: { bn: "আপনি কেমন ঝাল পছন্দ করেন?", en: "How spicy do you like it?" },
  q_salt: { bn: "আপনার লবণ খাওয়ার পছন্দ কেমন?", en: "What is your salt preference?" },
  q_diet: {
    bn: "আপনার কোনো অ্যালার্জি বা ডায়েটরি রেস্ট্রিকশন আছে?",
    en: "Any allergies or dietary restrictions?",
  },
  q_time: {
    bn: "রান্নার জন্য কত সময় দিতে চান?",
    en: "How much time do you want to spend cooking?",
  },
  ingredientsTitle: { bn: "আপনার কাছে কী আছে?", en: "What do you have?" },
  ingredientsHint: {
    bn: "উপকরণের নাম লিখে যোগ করুন",
    en: "Type an ingredient and add it",
  },
  add: { bn: "যোগ করুন", en: "Add" },
  generate: { bn: "রেসিপি তৈরি করুন", en: "Generate recipes" },
  generating: { bn: "রেসিপি তৈরি হচ্ছে…", en: "Cooking up recipes…" },
  suggestions: { bn: "পরামর্শ", en: "Suggestions" },
  recipes: { bn: "আপনার রেসিপি", en: "Your recipes" },
  utilization: { bn: "উপকরণ ব্যবহার", en: "Ingredient use" },
  minutes: { bn: "মিনিট", en: "min" },
  ingredients: { bn: "উপকরণ", en: "Ingredients" },
  steps: { bn: "প্রস্তুত প্রণালী", en: "Steps" },
  missing: { bn: "আর দরকার", en: "Still needed" },
  flavor: { bn: "স্বাদের ভারসাম্য", en: "Flavor balance" },
  back: { bn: "ফিরে যান", en: "Back" },
  chatBot: { bn: "চ্যাট বট", en: "Chat bot" },
  chatHint: {
    bn: "এই রেসিপি নিয়ে যা জানতে চান জিজ্ঞেস করুন",
    en: "Ask anything about this recipe",
  },
  send: { bn: "পাঠান", en: "Send" },
  preferences: { bn: "পছন্দসমূহ", en: "Preferences" },
  editPrefs: { bn: "পছন্দ পরিবর্তন করুন", en: "Edit preferences" },
  emptyState: {
    bn: "কয়েকটি উপকরণ যোগ করে শুরু করুন",
    en: "Add a few ingredients to get started",
  },
  errorGeneric: {
    bn: "কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।",
    en: "Something went wrong. Please try again.",
  },
  grocery: { bn: "স্মার্ট বাজারের তালিকা", en: "Smart grocery list" },
  groceryAutoSync: {
    bn: "রেসিপির অনুপস্থিত উপকরণ স্বয়ংক্রিয়ভাবে যোগ হয়",
    en: "Missing recipe items sync in automatically",
  },
  grocerySynced: { bn: "সিঙ্ক হয়েছে", en: "Synced" },
  groceryEmpty: {
    bn: "তালিকা খালি — রেসিপি তৈরি করলে প্রয়োজনীয় জিনিস এখানে আসবে",
    en: "List is empty — generate a recipe and needed items appear here",
  },
  groceryAddHint: { bn: "নিজে কিছু যোগ করুন", en: "Add your own item" },
  groceryFrom: { bn: "রেসিপি:", en: "For:" },
  groceryPending: { bn: "টি বাকি", en: "left to buy" },
  copyList: { bn: "কপি করুন", en: "Copy list" },
  copied: { bn: "কপি হয়েছে", en: "Copied" },
  clearDone: { bn: "কেনা মুছুন", en: "Clear done" },

  /* --- Section 6 premium features (items 2–20) --- */
  voiceMode: { bn: "হ্যান্ডস-ফ্রি রান্না", en: "Hands-free cooking" },
  voiceModeHint: {
    bn: "ধাপ শুনুন — বলুন “পরের ধাপ”, “আবার বলুন”, “আগের ধাপ”",
    en: "Listen to steps — say “next”, “repeat”, “back”",
  },
  startVoice: { bn: "শুরু করুন", en: "Start" },
  stopVoice: { bn: "বন্ধ করুন", en: "Stop" },
  stepLabel: { bn: "ধাপ", en: "Step" },
  listening: { bn: "শুনছি…", en: "Listening…" },
  notSupported: { bn: "এই ব্রাউজারে সমর্থিত নয়", en: "Not supported in this browser" },

  surprise: { bn: "চমক দিন", en: "Surprise Me" },
  surpriseHint: {
    bn: "একই উপকরণ, একদম আলাদা রান্না",
    en: "Same ingredients, a totally different dish",
  },
  remix: { bn: "রিমিক্স", en: "Remix" },
  remixHint: { bn: "কেমন মোড় চান? (ঐচ্ছিক)", en: "What twist? (optional)" },

  useItUp: { bn: "শেষ করে ফেলুন", en: "Use It Up" },
  useItUpHint: {
    bn: "যেগুলো দ্রুত নষ্ট হবে, আগে সেগুলো রান্না করুন",
    en: "Cook the items that will spoil first",
  },
  remindMe: { bn: "মনে করিয়ে দিন", en: "Remind me" },
  reminderOn: { bn: "রিমাইন্ডার চালু", en: "Reminders on" },

  portions: { bn: "পরিবারের পরিমাণ", en: "Household portions" },
  portionsHint: {
    bn: "একবার সদস্য যোগ করুন — রেসিপি নিজেই মাপ ঠিক করবে",
    en: "Add members once — recipes scale themselves",
  },
  applyPortions: { bn: "প্রয়োগ করুন", en: "Apply" },

  offline: { bn: "অফলাইন রেসিপি", en: "Offline recipes" },
  offlineHint: {
    bn: "ইন্টারনেট ছাড়াই সংরক্ষিত রেসিপি পড়ুন",
    en: "Read saved recipes without internet",
  },
  saveOffline: { bn: "অফলাইনে রাখুন", en: "Save offline" },
  savedOffline: { bn: "অফলাইনে সংরক্ষিত", en: "Saved offline" },
  online: { bn: "অনলাইন", en: "Online" },
  offlineNow: { bn: "অফলাইন", en: "Offline" },

  nutritionScore: { bn: "পুষ্টি স্কোর", en: "Nutrition score" },
  estimateNote: { bn: "আনুমানিক হিসাব", en: "Estimated" },

  streaks: { bn: "রান্নার ধারা", en: "Cooking streak" },
  streakDays: { bn: "দিনের ধারা", en: "day streak" },
  bestStreak: { bn: "সেরা", en: "Best" },
  badges: { bn: "অর্জন", en: "Badges" },
  markCooked: { bn: "রান্না হয়েছে", en: "Mark as cooked" },
  cookedDone: { bn: "রান্না হয়েছে ✓", en: "Cooked ✓" },

  mealPrep: { bn: "মিল প্রেপ মোড", en: "Meal prep mode" },
  mealPrepHint: {
    bn: "৩–৪টি রেসিপি একসাথে রান্নার পরিকল্পনা",
    en: "Plan 3–4 recipes in one cooking session",
  },
  buildPlan: { bn: "পরিকল্পনা তৈরি করুন", en: "Build plan" },
  sharedPrep: { bn: "যৌথ প্রস্তুতি", en: "Shared prep" },
  timeline: { bn: "সময়সূচি", en: "Timeline" },
  storageTips: { bn: "সংরক্ষণ", en: "Storage" },

  coverImage: { bn: "রেসিপির ছবি", en: "Recipe cover" },
  generateCoverBtn: { bn: "ছবি বানান", en: "Generate image" },

  kitchenMode: { bn: "কিচেন মোড", en: "Kitchen Mode" },
  kitchenModeHint: {
    bn: "স্ক্রিন জাগানো থাকবে, লেখা বড় হবে",
    en: "Screen stays awake, text gets bigger",
  },
  largeText: { bn: "বড় লেখা", en: "Large text" },
  keepAwake: { bn: "স্ক্রিন জাগানো", en: "Keep screen awake" },
  exitKitchen: { bn: "কিচেন মোড বন্ধ", en: "Exit Kitchen Mode" },

  difficulty: { bn: "কঠিনতা", en: "Difficulty" },
  easyLevel: { bn: "সহজ", en: "Easy" },
  mediumLevel: { bn: "মাঝারি", en: "Medium" },
  hardLevel: { bn: "কঠিন", en: "Hard" },
  howWasIt: { bn: "কেমন লাগল?", en: "How did it go?" },
  tooEasy: { bn: "সহজ ছিল", en: "Too easy" },
  justRight: { bn: "ঠিক ছিল", en: "Just right" },
  tooHard: { bn: "কঠিন ছিল", en: "Too hard" },

  family: { bn: "পরিবারের প্রোফাইল", en: "Family profiles" },
  familyHint: {
    bn: "এক প্যান্ট্রি, সবার আলাদা পছন্দ",
    en: "One shared pantry, individual preferences",
  },
  addMember: { bn: "সদস্য যোগ করুন", en: "Add member" },
  memberName: { bn: "নাম", en: "Name" },
  avoids: { bn: "এড়িয়ে চলে", en: "Avoids" },

  substitutions: { bn: "বিকল্প উপকরণ", en: "Substitutions" },
  confidence: { bn: "আত্মবিশ্বাস", en: "Confidence" },
  whyWorks: { bn: "কেন কাজ করে", en: "Why this works" },

  timers: { bn: "ধাপের টাইমার", en: "Step timers" },
  startTimer: { bn: "টাইমার", en: "Timer" },
  timerDone: { bn: "সময় শেষ!", en: "Time's up!" },

  seasonal: { bn: "এই মৌসুমের বাজার", en: "In season now" },
  seasonalHint: {
    bn: "এখন সস্তা ও তাজা — যোগ করে দেখুন",
    en: "Cheaper and fresher right now — try adding these",
  },

  costEstimate: { bn: "আনুমানিক খরচ", en: "Cost estimate" },
  perServing: { bn: "প্রতি জনে", en: "per serving" },
  totalCost: { bn: "মোট", en: "Total" },

  shareCard: { bn: "শেয়ার কার্ড", en: "Share card" },
  shareCardHint: {
    bn: "রান্না শেষে সুন্দর কার্ড বানিয়ে শেয়ার করুন",
    en: "Make a pretty card to share after cooking",
  },
  download: { bn: "ডাউনলোড", en: "Download" },
  share: { bn: "শেয়ার", en: "Share" },

  rateRecipe: { bn: "রেটিং ও মতামত", en: "Rate & refine" },
  rateHint: {
    bn: "আপনার মতামত পরের রেসিপিগুলো আরও ভালো করবে",
    en: "Your feedback tunes the next recipes",
  },
  noteOptional: { bn: "মন্তব্য (ঐচ্ছিক)", en: "Note (optional)" },
  saveFeedback: { bn: "সংরক্ষণ করুন", en: "Save" },
  saved: { bn: "সংরক্ষিত", en: "Saved" },

  digest: { bn: "দৈনিক রান্নার আইডিয়া", en: "Daily cooking digest" },
  digestHint: {
    bn: "প্রতিদিন একটি নোটিফিকেশন — মেয়াদ ও পছন্দ অনুযায়ী",
    en: "One daily nudge based on expiry and your taste",
  },
  enable: { bn: "চালু করুন", en: "Enable" },
  disable: { bn: "বন্ধ করুন", en: "Disable" },
  sendNow: { bn: "এখনই দেখুন", en: "Preview now" },
  hour: { bn: "সময়", en: "Time" },

  mealPrepPick: { bn: "রেসিপি বাছাই করুন", en: "recipes selected" },
  mealPrepList: { bn: "একত্রিত বাজারের তালিকা", en: "Consolidated shopping list" },
  mealPrepSequence: { bn: "একসাথে রান্নার ধারাবাহিকতা", en: "Batch-cooking sequence" },
  mealPrepAddList: { bn: "বাজারের তালিকায় যোগ করুন", en: "Add to grocery list" },
  mealPrepNothing: { bn: "সব উপকরণ ঘরেই আছে", en: "You already have everything" },
  mealPrepBatchTime: { bn: "একসাথে রান্নায়", en: "Batched" },
  mealPrepSeparate: { bn: "আলাদা রান্নায়", en: "separately" },

  /* --- Navigation & profile --- */
  home: { bn: "হোম", en: "Home" },
  explore: { bn: "খুঁজুন", en: "Explore" },
  pantry: { bn: "প্যান্ট্রি", en: "Pantry" },
  social: { bn: "কমিউনিটি", en: "Community" },
  profile: { bn: "প্রোফাইল", en: "Profile" },
  profileHint: { bn: "আপনার পছন্দ ও সেটিংস", en: "Your preferences and settings" },
  guestUser: { bn: "গেস্ট ব্যবহারকারী", en: "Guest user" },
  noRegionSet: { bn: "অঞ্চল সেট করা হয়নি", en: "No region set" },

  /* --- Language picker --- */
  selectLanguage: { bn: "ভাষা নির্বাচন করুন", en: "Select your language" },
  searchLanguage: { bn: "ভাষা খুঁজুন", en: "Search language" },
  confirmSelection: { bn: "নির্বাচন সম্পন্ন", en: "Confirm selection" },
  noResults: { bn: "কোনো ভাষা পাওয়া যায়নি", en: "No languages found" },
  groupByRegion: { bn: "অঞ্চল অনুযায়ী", en: "Group by region" },
  allLanguages: { bn: "সব ভাষা", en: "All languages" },
  languageChanged: { bn: "ভাষা পরিবর্তিত হয়েছে", en: "Language changed" },
  cancel: { bn: "বাতিল", en: "Cancel" },
  close: { bn: "বন্ধ করুন", en: "Close" },
  search: { bn: "খুঁজুন", en: "Search" },
  regionSouthAsian: { bn: "দক্ষিণ এশীয়", en: "South Asian" },
  regionEuropean: { bn: "ইউরোপীয়", en: "European" },
  regionEastAsian: { bn: "পূর্ব ও দক্ষিণ-পূর্ব এশীয়", en: "East & Southeast Asian" },
  regionAfrican: { bn: "আফ্রিকান", en: "African" },
  regionOther: { bn: "অন্যান্য", en: "Other" },

  /* --- Error messages --- */
  errorNetwork: {
    bn: "ইন্টারনেট সংযোগে সমস্যা হচ্ছে",
    en: "We can't reach the network right now",
  },
  errorTimeout: { bn: "অনুরোধে অনেক সময় লাগছে", en: "That request took too long" },
  errorOffline: {
    bn: "আপনি অফলাইনে আছেন — সংরক্ষিত রেসিপি দেখতে পারবেন",
    en: "You're offline — saved recipes are still available",
  },
  errorNotFound: { bn: "এটি খুঁজে পাওয়া যায়নি", en: "We couldn't find that" },
  errorUnauthorized: { bn: "চালিয়ে যেতে সাইন ইন করুন", en: "Please sign in to continue" },
  errorRateLimited: {
    bn: "একটু বেশি অনুরোধ হয়ে গেছে — একটু পরে চেষ্টা করুন",
    en: "Too many requests — please wait a moment",
  },
  errorServer: {
    bn: "আমাদের সার্ভারে সমস্যা হয়েছে",
    en: "Something broke on our side",
  },
  errorInvalidInput: { bn: "তথ্যটি ঠিক দেখাচ্ছে না", en: "That input doesn't look right" },
  errorSaveFailed: { bn: "সংরক্ষণ করা যায়নি", en: "Couldn't save your changes" },
  errorLoadFailed: { bn: "লোড করা যায়নি", en: "Couldn't load this" },
  errorTryAgain: { bn: "আবার চেষ্টা করুন", en: "Try again" },
  errorContactSupport: { bn: "সাহায্য নিন", en: "Contact support" },

  /* --- Onboarding copy --- */
  welcomeTitle: { bn: "স্মার্ট প্যান্ট্রিতে স্বাগতম", en: "Welcome to Smart Pantry" },
  welcomeSubtitle: {
    bn: "ফ্রিজে যা আছে, তা দিয়েই আজকের রান্না",
    en: "Tonight's dinner, from what's already in your fridge",
  },
  onboardingStep1Title: { bn: "প্যান্ট্রি সাজান", en: "Stock your pantry" },
  onboardingStep1Body: {
    bn: "ঘরে থাকা উপকরণগুলো একবার যোগ করে রাখুন",
    en: "Add the ingredients you keep at home, just once",
  },
  onboardingStep2Title: { bn: "রেসিপি পান", en: "Get recipes" },
  onboardingStep2Body: {
    bn: "আপনার উপকরণ ও স্বাদ বুঝে রেসিপি তৈরি হবে",
    en: "Recipes are built around your items and your taste",
  },
  onboardingStep3Title: { bn: "রান্না শুরু করুন", en: "Start cooking" },
  onboardingStep3Body: {
    bn: "ধাপে ধাপে নির্দেশনা, টাইমার আর হ্যান্ডস-ফ্রি মোড",
    en: "Step-by-step guidance, timers, and hands-free mode",
  },
  getStarted: { bn: "শুরু করা যাক", en: "Get started" },
  onboardingProgress: { bn: "প্রায় শেষ", en: "Nearly there" },
  onboardingAlmostDone: {
    bn: "আর একটি ধাপ বাকি",
    en: "Just one more step",
  },
  onboardingFinishHint: {
    bn: "সব উত্তর পরে সেটিংসে বদলানো যাবে",
    en: "You can change every answer later in Settings",
  },

  /* --- Settings labels --- */
  settings: { bn: "সেটিংস", en: "Settings" },
  settingsGeneral: { bn: "সাধারণ", en: "General" },
  settingsAccount: { bn: "অ্যাকাউন্ট", en: "Account" },
  settingsNotifications: { bn: "নোটিফিকেশন", en: "Notifications" },
  settingsAppearance: { bn: "চেহারা", en: "Appearance" },
  settingsPrivacy: { bn: "গোপনীয়তা", en: "Privacy" },
  settingsUnits: { bn: "মাপের একক", en: "Measurement units" },
  settingsUnitsMetric: { bn: "মেট্রিক (গ্রাম, মিলি)", en: "Metric (g, ml)" },
  settingsUnitsImperial: { bn: "ইম্পেরিয়াল (আউন্স, কাপ)", en: "Imperial (oz, cups)" },
  settingsCurrency: { bn: "মুদ্রা", en: "Currency" },
  settingsDataSaver: { bn: "ডেটা সাশ্রয়", en: "Data saver" },
  settingsClearCache: { bn: "ক্যাশ পরিষ্কার করুন", en: "Clear cache" },
  settingsCacheCleared: { bn: "ক্যাশ পরিষ্কার হয়েছে", en: "Cache cleared" },
  settingsResetPrefs: { bn: "পছন্দ রিসেট করুন", en: "Reset preferences" },
  settingsAbout: { bn: "অ্যাপ সম্পর্কে", en: "About" },
  settingsVersion: { bn: "সংস্করণ", en: "Version" },
  settingsSignOut: { bn: "সাইন আউট", en: "Sign out" },
  settingsDeleteAccount: { bn: "অ্যাকাউন্ট মুছুন", en: "Delete account" },

  /* --- Recipe detail --- */
  servings: { bn: "পরিবেশন", en: "Servings" },
  prepTime: { bn: "প্রস্তুতির সময়", en: "Prep time" },
  cookTime: { bn: "রান্নার সময়", en: "Cook time" },
  totalTime: { bn: "মোট সময়", en: "Total time" },
  calories: { bn: "ক্যালরি", en: "Calories" },
  protein: { bn: "প্রোটিন", en: "Protein" },
  carbs: { bn: "কার্বোহাইড্রেট", en: "Carbs" },
  fat: { bn: "ফ্যাট", en: "Fat" },
  equipment: { bn: "প্রয়োজনীয় সরঞ্জাম", en: "Equipment" },
  tips: { bn: "টিপস", en: "Tips" },
  storageAdvice: { bn: "কীভাবে সংরক্ষণ করবেন", en: "How to store it" },
  allergenWarning: { bn: "অ্যালার্জেন সতর্কতা", en: "Allergen warning" },
  addToGrocery: { bn: "বাজারের তালিকায় যোগ করুন", en: "Add to grocery list" },
  viewFullRecipe: { bn: "পুরো রেসিপি দেখুন", en: "View full recipe" },
  markStepDone: { bn: "ধাপ শেষ", en: "Mark step done" },
  nextStep: { bn: "পরের ধাপ", en: "Next step" },
  previousStep: { bn: "আগের ধাপ", en: "Previous step" },
  recipeNotes: { bn: "আপনার নোট", en: "Your notes" },
} as const;

export type Key = keyof typeof dict;

/** The bn/en source of truth, exported for translation tooling. */
export const BASE_DICT: Record<string, { bn: string; en: string }> = dict;

/** Overlay dictionaries, merged in priority order (later wins). */
const OVERLAYS: Partial<Record<LanguageCode, Record<string, string>>>[] = [
  GENERATED_TRANSLATIONS,
  CORE_TRANSLATIONS,
  EXTENDED_A,
  EXTENDED_B,
];

const MERGED: Partial<Record<LanguageCode, Record<string, string>>> = {};
for (const overlay of OVERLAYS) {
  for (const [code, entries] of Object.entries(overlay)) {
    if (!entries) continue;
    MERGED[code as LanguageCode] = { ...(MERGED[code as LanguageCode] ?? {}), ...entries };
  }
}

/** Translate with graceful degradation: language -> English -> Bengali -> key. */
export function translate(key: Key, lang: LanguageCode): string {
  if (lang === "bn" || lang === "en") return dict[key][lang] ?? dict[key].en ?? key;
  const hit = MERGED[lang]?.[key as string];
  if (hit) return hit;
  const entry = dict[key] as { en?: string; bn?: string } | undefined;
  return entry?.en ?? entry?.bn ?? (key as string);
}

/** How much of the UI vocabulary exists for a language (0-1). */
export function translationCoverage(lang: LanguageCode): number {
  if (lang === "bn" || lang === "en") return 1;
  const keys = Object.keys(dict);
  const table = MERGED[lang] ?? {};
  return keys.filter((k) => table[k]).length / keys.length;
}

type Ctx = {
  lang: Lang;
  /** Narrowed language for bn/en-only data modules. */
  bi: BiLang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
  /** True until the stored/detected language has been resolved on the client. */
  ready: boolean;
  /** No stored choice was found — the picker should be shown on first launch. */
  needsLanguageChoice: boolean;
};

const LangContext = createContext<Ctx>({
  lang: DEFAULT_LANGUAGE,
  bi: toBiLang(DEFAULT_LANGUAGE),
  setLang: () => {},
  t: (k) => dict[k].bn,
  ready: false,
  needsLanguageChoice: false,
});

function readStoredLanguage(): LanguageCode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (isLanguageCode(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);
  const [needsLanguageChoice, setNeedsChoice] = useState(false);

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored) {
      setLangState(stored);
    } else {
      setLangState(detectDeviceLanguage() ?? DEFAULT_LANGUAGE);
      setNeedsChoice(true);
    }
    setReady(true);
  }, []);

  // Keep <html lang>/dir in sync so RTL scripts (Arabic, Urdu) render correctly.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = SUPPORTED_LANGUAGES[lang]?.rtl ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setNeedsChoice(false);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      // Mirror into the user preference blob so recipe generation sees it too.
      const raw = localStorage.getItem("sp-prefs");
      const prefs = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      prefs['language'] = l;
      localStorage.setItem("sp-prefs", JSON.stringify(prefs));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      bi: toBiLang(lang),
      setLang,
      t: (k: Key) => translate(k, lang),
      ready,
      needsLanguageChoice,
    }),
    [lang, setLang, ready, needsLanguageChoice],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

