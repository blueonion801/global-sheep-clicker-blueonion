import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    const { data: topPlayers, error: topPlayersError } = await supabase
      .from('users')
      .select('id')
      .order('total_clicks', { ascending: false })
      .limit(3);

    if (topPlayersError) {
      throw topPlayersError;
    }

    const topPlayerIds = new Set(topPlayers?.map(p => p.id) || []);

    const { data: allUserStats, error: statsError } = await supabase
      .from('user_stats')
      .select('*');

    if (statsError) {
      throw statsError;
    }

    const updates = [];

    for (const stats of allUserStats || []) {
      const isInTop3 = topPlayerIds.has(stats.user_id);
      const lastCheckDate = stats.last_top3_check_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCurrentStreak = stats.current_top3_streak || 0;
      let newLongestStreak = stats.longest_top3_streak || 0;

      if (lastCheckDate === yesterdayStr) {
        if (isInTop3) {
          newCurrentStreak += 1;
          newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
        } else {
          newCurrentStreak = 0;
        }
      } else if (lastCheckDate !== today) {
        newCurrentStreak = isInTop3 ? 1 : 0;
        newLongestStreak = Math.max(newLongestStreak, newCurrentStreak);
      }

      if (lastCheckDate !== today) {
        updates.push({
          user_id: stats.user_id,
          current_top3_streak: newCurrentStreak,
          longest_top3_streak: newLongestStreak,
          last_top3_check_date: today
        });
      }
    }

    if (updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('user_stats')
          .update({
            current_top3_streak: update.current_top3_streak,
            longest_top3_streak: update.longest_top3_streak,
            last_top3_check_date: update.last_top3_check_date
          })
          .eq('user_id', update.user_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updates.length,
        top_players: topPlayers?.length || 0
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});