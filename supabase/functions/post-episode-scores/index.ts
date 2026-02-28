// ============================================================
// post-episode-scores/index.ts — Supabase Edge Function
//
// Called by the admin after entering episode codes.
// Upserts episode_queen_scores, recomputes all player scores,
// and returns the updated leaderboard.
//
// POST /functions/v1/post-episode-scores
// Headers: Authorization: Bearer <user JWT>
// Body:
//   {
//     "season_id": 1,
//     "episode": 9,
//     "queen_scores": [
//       { "queen_id": 1, "codes": ["D","B","E","E"] },
//       { "queen_id": 7, "codes": ["A","E"] },
//       ...
//     ]
//   }
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Build a Supabase client using the caller's auth token
    // (so RLS policies apply — only admins can write scores)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the caller is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const { data: playerRow, error: playerError } = await supabase
      .from("players")
      .select("is_admin")
      .eq("auth_id", user.id)
      .single();

    if (playerError || !playerRow?.is_admin) {
      return json({ error: "Admin access required" }, 403);
    }

    // Parse request body
    const body = await req.json();
    const { season_id, episode, queen_scores } = body as {
      season_id: number;
      episode: number;
      queen_scores: Array<{ queen_id: number; codes: string[] }>;
    };

    if (!season_id || !episode || !Array.isArray(queen_scores)) {
      return json({ error: "Invalid request body" }, 400);
    }

    // Use the service-role client for writes (bypass RLS for the compute function)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Upsert episode_queen_scores for each queen
    const upsertRows = queen_scores.map((qs) => ({
      season_id,
      episode,
      queen_id: qs.queen_id,
      codes: qs.codes,
      entered_by: playerRow ? user.id : null,
      entered_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await serviceClient
      .from("episode_queen_scores")
      .upsert(upsertRows, { onConflict: "season_id,episode,queen_id" });

    if (upsertError) {
      return json({ error: `Failed to save scores: ${upsertError.message}` }, 500);
    }

    // 2. Run the compute function to update all player_episode_scores
    const { error: computeError } = await serviceClient.rpc("compute_episode_scores", {
      p_season_id: season_id,
      p_episode: episode,
    });

    if (computeError) {
      return json({ error: `Score computation failed: ${computeError.message}` }, 500);
    }

    // 3. Update aired_episodes on the season if this is a new high-water mark
    const { data: season } = await serviceClient
      .from("seasons")
      .select("aired_episodes")
      .eq("id", season_id)
      .single();

    if (season && episode > season.aired_episodes) {
      await serviceClient
        .from("seasons")
        .update({ aired_episodes: episode })
        .eq("id", season_id);
    }

    // 4. Mark the episode as aired and add summary if provided
    if (body.summary) {
      await serviceClient
        .from("episodes")
        .update({ aired: true, summary: body.summary })
        .eq("season_id", season_id)
        .eq("number", episode);
    } else {
      await serviceClient
        .from("episodes")
        .update({ aired: true })
        .eq("season_id", season_id)
        .eq("number", episode);
    }

    // 5. Return the updated leaderboard for confirmation
    const { data: leaderboard, error: lbError } = await serviceClient
      .from("players")
      .select(`
        id,
        display_name,
        team_submissions!inner (
          queen_ids,
          winner_pick,
          season_id
        ),
        player_episode_scores (
          episode,
          points,
          season_id
        )
      `)
      .eq("team_submissions.season_id", season_id)
      .eq("player_episode_scores.season_id", season_id);

    if (lbError) {
      // Scores were saved even if leaderboard fetch fails
      return json({ ok: true, leaderboard: null }, 200);
    }

    // Compute totals and sort
    const ranked = (leaderboard ?? [])
      .map((p: any) => ({
        id: p.id,
        name: p.display_name,
        total: (p.player_episode_scores ?? []).reduce(
          (sum: number, ep: any) => sum + ep.points,
          0
        ),
      }))
      .sort((a: any, b: any) => b.total - a.total);

    return json({ ok: true, episode, leaderboard: ranked });
  } catch (err: any) {
    console.error("post-episode-scores error:", err);
    return json({ error: err.message ?? "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
