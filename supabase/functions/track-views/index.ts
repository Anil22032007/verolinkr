import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { submission_id, post_url, platform } = await req.json();

    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    let viewCount = 0;
    let verified = false;

    if (platform === 'youtube' && post_url.includes('youtube.com') || post_url.includes('youtu.be')) {
      // Extract YouTube video ID
      let videoId = null;
      const urlObj = new URL(post_url);

      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.searchParams.get('v')) {
        videoId = urlObj.searchParams.get('v');
      }

      if (videoId) {
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${youtubeApiKey}`
        );
        const ytData = await ytRes.json();

        if (ytData.items && ytData.items.length > 0) {
          viewCount = parseInt(ytData.items[0].statistics.viewCount || '0');
          verified = true;
        }
      }
    } else {
      // Manual verification for Instagram (until Meta approves)
      // Extract view count from submission manually
      verified = false;
      viewCount = 0;
    }

    // Update submission with view count
    const { error } = await supabase
      .from('cpv_submissions')
      .update({
        view_count: viewCount,
        verified,
        last_checked: new Date().toISOString(),
      })
      .eq('id', submission_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, view_count: viewCount, verified }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
