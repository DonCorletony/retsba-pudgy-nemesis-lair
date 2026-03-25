import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-forwarded-for, x-real-ip",
};

const PORTAL = "abstracttxns";
const SESSION_HOURS = 12;
const PASSWORD = "AbsterSucksEggs987";

function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key);
}

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, password } = body;
    const ip = getClientIP(req);
    const supabase = getSupabase();

    // Check if IP already has a valid session
    if (action === "check") {
      const { data } = await supabase
        .from("ip_sessions")
        .select("expires_at")
        .eq("ip_address", ip)
        .eq("portal", PORTAL)
        .single();

      if (data && new Date(data.expires_at) > new Date()) {
        return new Response(
          JSON.stringify({ authenticated: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ authenticated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Login with password
    if (action === "login") {
      if (password !== PASSWORD) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();

      await supabase.from("ip_sessions").upsert(
        { ip_address: ip, portal: PORTAL, expires_at: expiresAt },
        { onConflict: "ip_address,portal" }
      );

      return new Response(
        JSON.stringify({ success: true, authenticated: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
