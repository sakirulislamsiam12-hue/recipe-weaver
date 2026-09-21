import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Tables holding rows owned by a single user, with the column that points at
 * auth.users. Rows cascade when the auth user is removed, but we delete them
 * explicitly first so the deletion is complete even if a cascade is missing.
 */
const OWNED_TABLES: ReadonlyArray<readonly [string, string]> = [
  ["recipe_chat_messages", "user_id"],
  ["saved_recipes", "user_id"],
  ["pantry_items", "user_id"],
  ["pantry_purchase", "user_id"],
  ["notifications", "user_id"],
  ["user_preferences", "user_id"],
  ["community_recipe_ratings", "user_id"],
  ["community_recipes", "user_id"],
  ["community_donations", "user_id"],
  ["community_requests", "user_id"],
  ["sharing_groups", "created_by"],
  ["content_reports", "reporter_id"],
  ["user_blocks", "blocker_id"],
  ["user_blocks", "blocked_id"],
  ["profiles", "id"],
];

/**
 * Permanently deletes the signed-in user's account and all of their data.
 * Required by Google Play's account-deletion policy.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    for (const [table, column] of OWNED_TABLES) {
      const { error } = await supabaseAdmin.from(table as never).delete().eq(column, userId);
      // A missing table or column must not block account deletion.
      if (error && !/does not exist|schema cache/i.test(error.message)) {
        throw new Error(`Failed to delete ${table}: ${error.message}`);
      }
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(`Failed to delete account: ${authError.message}`);

    return { deleted: true } as const;
  });
