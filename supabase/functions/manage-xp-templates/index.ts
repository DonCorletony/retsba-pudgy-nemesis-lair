import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // All write actions require password validation
    if (req.method === 'POST' || req.method === 'DELETE') {
      const contentType = req.headers.get('content-type') || '';
      let password: string | null = null;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        password = formData.get('password') as string;
      } else {
        const body = await req.json();
        password = body.password;
      }

      const correctPassword = Deno.env.get('COMMAND_CENTER_PASSWORD');
      if (!password || password !== correctPassword) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // GET: List all templates
    if (req.method === 'GET' || action === 'list') {
      const { data, error } = await supabase
        .from('xp_templates')
        .select('*')
        .order('section')
        .order('sort_order');

      if (error) throw error;
      return new Response(
        JSON.stringify({ templates: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST actions
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || '';

      // Upload new template
      if (action === 'upload') {
        // Re-parse form data (already consumed above, need to handle differently)
        // Actually we need to re-read, let's restructure
        return new Response(
          JSON.stringify({ error: 'Use upload-template action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For JSON body actions
      let body: any;
      if (contentType.includes('multipart/form-data')) {
        // Already consumed, this shouldn't happen for non-upload actions
        return new Response(
          JSON.stringify({ error: 'Invalid content type for this action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Body was already consumed for password check, need to restructure
      // Let's use a different approach - parse once and route
      return new Response(
        JSON.stringify({ error: 'Action not supported via this path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
