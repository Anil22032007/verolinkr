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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      campaign_id,
      user_id,
      amount,
    } = await req.json();

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(keySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const hashArray = Array.from(new Uint8Array(signature));
    const generatedSignature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    if (generatedSignature !== razorpay_signature) {
      throw new Error("Payment verification failed — invalid signature");
    }

    // Save payment to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase.from("payments").insert({
      campaign_id,
      brand_id: user_id,
      razorpay_order_id,
      razorpay_payment_id,
      amount,
      status: "paid",
      created_at: new Date().toISOString(),
    });

    if (error) throw error;

    // Update campaign escrow status
    await supabase
      .from("campaigns")
      .update({ escrow_status: "funded" })
      .eq("id", campaign_id);

    return new Response(
      JSON.stringify({ success: true, payment_id: razorpay_payment_id }),
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

