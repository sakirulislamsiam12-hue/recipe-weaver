import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * In-app reporting and blocking for user generated content.
 * Google Play's User Generated Content policy requires both to be available
 * to every signed-in user, in-app, on the content itself.
 */

export const REPORT_REASONS = [
  "spam",
  "offensive",
  "unsafe_food",
  "sexual",
  "hate",
  "fraud",
  "other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

const reportSchema = z.object({
  content_type: z.enum(["recipe", "donation", "request", "group", "user", "ai_output"]),
  content_id: z.string().uuid(),
  reported_user_id: z.string().uuid().nullable().optional(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(500).nullable().optional(),
});

/** Files a report against a piece of community content. */
export const reportContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reportSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("content_reports").upsert(
      {
        reporter_id: userId,
        content_type: data.content_type,
        content_id: data.content_id,
        reported_user_id: data.reported_user_id ?? null,
        reason: data.reason,
        details: data.details ?? null,
      },
      { onConflict: "reporter_id,content_type,content_id" },
    );
    if (error) throw new Error(error.message);
    return { reported: true } as const;
  });

const blockSchema = z.object({ blocked_id: z.string().uuid() });

/** Hides everything posted by another user from the reporter's feeds. */
export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => blockSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.blocked_id === userId) throw new Error("You cannot block yourself.");
    const { error } = await supabase
      .from("user_blocks")
      .upsert(
        { blocker_id: userId, blocked_id: data.blocked_id },
        { onConflict: "blocker_id,blocked_id" },
      );
    if (error) throw new Error(error.message);
    return { blocked: true } as const;
  });

/** Removes a block. */
export const unblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => blockSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", data.blocked_id);
    if (error) throw new Error(error.message);
    return { unblocked: true } as const;
  });

/** The signed-in user's blocked user ids. */
export const listBlockedUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_blocks")
      .select("blocked_id")
      .eq("blocker_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => row.blocked_id);
  });
