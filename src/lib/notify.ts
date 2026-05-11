import { supabase } from "@/lib/supabase";

export type NotificationType =
  | "giveaway_win"
  | "guess_result_win"
  | "jackpot_win"
  | "general"
  | "se_points_earned"
  | "se_points_spent";

/** Fire-and-forget notification insert. Errors are logged but never thrown. */
export async function notify(
  userTwitchId: string,
  type: NotificationType,
  title: string,
  message: string,
) {
  try {
    await supabase.from("notifications").insert({
      user_twitch_id: userTwitchId,
      type,
      title,
      message,
    });
  } catch (e) {
    console.error("notify insert failed:", e);
  }
}
