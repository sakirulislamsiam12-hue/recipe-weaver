import { Compass, Home, ShoppingBasket, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/explore" | "/pantry" | "/profile";
  icon: LucideIcon;
  bn: string;
  en: string;
};

/** 4-tab structure, ordered left to right. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", icon: Home, bn: "হোম", en: "Home" },
  { to: "/explore", icon: Compass, bn: "খুঁজুন", en: "Explore" },
  { to: "/pantry", icon: ShoppingBasket, bn: "প্যান্ট্রি", en: "Pantry" },
  { to: "/profile", icon: User, bn: "প্রোফাইল", en: "Profile" },
];
