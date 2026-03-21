import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // GET: public list (no auth needed)
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('xp_templates')
        .select('*')
        .order('section')
        .order('sort_order');
      if (error) throw error;
      return jsonResponse({ templates: data });
    }

    // POST: all mutations require password
    if (req.method === 'POST') {
      const correctPassword = Deno.env.get('COMMAND_CENTER_PASSWORD');

      // --- File upload (multipart) ---
      if (action === 'upload') {
        const formData = await req.formData();
        const password = formData.get('password') as string;
        if (!password || password !== correctPassword) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }

        const file = formData.get('file') as File;
        const section = formData.get('section') as string;
        const sortOrder = parseInt(formData.get('sort_order') as string || '0', 10);

        if (!file || !section) {
          return jsonResponse({ error: 'Missing file or section' }, 400);
        }

        // Upload to storage
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('xp-templates')
          .upload(fileName, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('xp-templates')
          .getPublicUrl(fileName);

        // Insert DB record
        const { data: template, error: insertError } = await supabase
          .from('xp_templates')
          .insert({
            image_url: urlData.publicUrl,
            section,
            sort_order: sortOrder,
            is_new: false,
            is_default: false,
          })
          .select()
          .single();
        if (insertError) throw insertError;

        return jsonResponse({ template });
      }

      // --- JSON body actions ---
      const body = await req.json();
      if (!body.password || body.password !== correctPassword) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      // Update template (toggle NEW, default, etc.)
      if (action === 'update') {
        const { id, ...updates } = body;
        delete updates.password;
        if (!id) return jsonResponse({ error: 'Missing id' }, 400);

        // If setting as default, unset other defaults in same section
        if (updates.is_default === true) {
          // Get the template's section first
          const { data: tmpl } = await supabase
            .from('xp_templates')
            .select('section')
            .eq('id', id)
            .single();
          if (tmpl) {
            await supabase
              .from('xp_templates')
              .update({ is_default: false })
              .eq('section', tmpl.section)
              .neq('id', id);
          }
        }

        const { data, error } = await supabase
          .from('xp_templates')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ template: data });
      }

      // Reorder templates
      if (action === 'reorder') {
        const { items } = body; // [{id, sort_order, section}]
        if (!items || !Array.isArray(items)) {
          return jsonResponse({ error: 'Missing items array' }, 400);
        }

        for (const item of items) {
          const updateData: any = { sort_order: item.sort_order };
          if (item.section) updateData.section = item.section;
          await supabase
            .from('xp_templates')
            .update(updateData)
            .eq('id', item.id);
        }

        return jsonResponse({ success: true });
      }

      // Delete template
      if (action === 'delete') {
        const { id } = body;
        if (!id) return jsonResponse({ error: 'Missing id' }, 400);

        // Get image URL to delete from storage
        const { data: tmpl } = await supabase
          .from('xp_templates')
          .select('image_url')
          .eq('id', id)
          .single();

        if (tmpl?.image_url) {
          const urlParts = tmpl.image_url.split('/xp-templates/');
          if (urlParts[1]) {
            await supabase.storage.from('xp-templates').remove([urlParts[1]]);
          }
        }

        const { error } = await supabase
          .from('xp_templates')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      return jsonResponse({ error: 'Unknown action' }, 400);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});
